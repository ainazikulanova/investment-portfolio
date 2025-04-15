import requests
from datetime import datetime, timedelta
from pypfopt import EfficientFrontier, risk_models, expected_returns
import pandas as pd
import numpy as np
import logging
from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Asset, HistoricalPrice
from .serializers import AssetSerializer

logger = logging.getLogger(__name__)

TICKER_MAPPING = {
    'sberbank': 'SBER',
    'gazprom': 'GAZP',
    'lukoil': 'LKOH',
    'yandex': 'YNDX',
}

class AssetListCreate(generics.ListCreateAPIView):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer

class AssetDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer

    def get_object(self):
        try:
            return super().get_object()
        except Asset.DoesNotExist:
            logger.error(f"Asset with id {self.kwargs.get('pk')} not found")
            raise generics.get_object_or_404(Asset, pk=self.kwargs.get('pk'))

@api_view(['GET'])
def get_price(request):
    ticker = request.GET.get('ticker')
    if not ticker:
        logger.warning("Ticker parameter is missing")
        return Response({'error': 'Ticker parameter is required'}, status=400)

    ticker_lower = ticker.lower()
    ticker = TICKER_MAPPING.get(ticker_lower, ticker).upper()

    try:
        asset = Asset.objects.filter(ticker=ticker).first()
        if asset and asset.historical_prices.filter(date=datetime.now().date()).exists():
            price = asset.historical_prices.filter(date=datetime.now().date()).first().price
            logger.info(f"Price for {ticker} retrieved from database: {price}")
            return Response({'ticker': ticker, 'price': float(price)})

        response = requests.get(f'https://iss.moex.com/iss/engines/stock/markets/shares/securities/{ticker}.json')
        response.raise_for_status()
        data = response.json()
        market_data = data.get('marketdata', {}).get('data', [])
        if not market_data:
            logger.warning(f"No price data available for {ticker} via MOEX ISS API, using fallback")
            price = 100
        else:
            price = market_data[0][4]
            if price is None:
                logger.warning(f"No valid price data for {ticker}, using fallback")
                price = 100

        logger.info(f"Price for {ticker}: {price}")

        if not asset:
            asset = Asset.objects.create(
                ticker=ticker,
                name=ticker,
                buy_price=price,
                current_price=price,
                quantity=0
            )
        HistoricalPrice.objects.create(asset=asset, date=datetime.now().date(), price=price)

        return Response({'ticker': ticker, 'price': float(price)})
    except Exception as e:
        logger.error(f"Failed to fetch price for {ticker}: {str(e)}")
        return Response({'error': f'Failed to fetch price for {ticker}: {str(e)}'}, status=400)

@api_view(['POST'])
def optimize_portfolio(request):
    try:
        tickers = request.data.get("tickers", "").split(",")
        model = request.data.get("model", "markowitz").lower()
        target_return = float(request.data.get("target_return", 0.1))
        risk_level = float(request.data.get("risk_level", 0.02))
        current_portfolio = request.data.get("current_portfolio", [])

        if not tickers or tickers == ['']:
            logger.error("No tickers provided for optimization")
            return Response({'error': 'At least one ticker is required'}, status=400)

        if model not in ['markowitz', 'sharpe']:
            return Response({'error': 'Invalid model. Use "markowitz" or "sharpe"'}, status=400)

        assets = Asset.objects.filter(ticker__in=tickers)
        if len(assets) != len(tickers):
            start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
            end_date = datetime.now().strftime("%Y-%m-%d")
            price_data = fetch_and_cache_prices(tickers, start_date, end_date)
            assets = Asset.objects.filter(ticker__in=tickers)

        if len(assets) < 2:
            return Response({'error': 'Need at least 2 assets for optimization'}, status=400)

        data = {}
        for asset in assets:
            prices = asset.historical_prices.values('date', 'price')
            if not prices:
                logger.warning(f"No historical prices for {asset.ticker}")
                continue
            price_series = pd.Series(
                {p['date']: p['price'] for p in prices},
                name=asset.ticker
            )
            if len(price_series) < 2:
                logger.warning(f"Insufficient price data for {asset.ticker}")
                continue
            data[asset.ticker] = price_series

        df = pd.DataFrame(data)
        if df.empty or len(df.columns) < 2:
            return Response({'error': 'Insufficient historical data'}, status=400)

        if len(df) < 2:
            return Response({'error': 'Not enough price data points'}, status=400)

        mu = expected_returns.mean_historical_return(df)
        S = risk_models.sample_cov(df)
        ef = EfficientFrontier(mu, S)

        if model == 'sharpe':
            weights = ef.max_sharpe(risk_free_rate=risk_level)
        else:
            if target_return > 0:
                weights = ef.efficient_return(target_return)
            else:
                weights = ef.min_volatility()

        cleaned_weights = ef.clean_weights()
        performance = ef.portfolio_performance(risk_free_rate=risk_level)

        ef_frontier = []
        returns = np.linspace(min(mu), max(mu), 50)
        for ret in returns:
            try:
                ef.efficient_return(ret)
                perf = ef.portfolio_performance()
                ef_frontier.append({
                    'return': perf[0] * 100,
                    'risk': perf[1] * 100
                })
            except ValueError:
                continue

        recommendations = []
        total_value = sum(
            item['quantity'] * Asset.objects.get(ticker=item['ticker']).current_price
            for item in current_portfolio
        ) if current_portfolio else 0

        if total_value == 0:
            total_value = 1000

        current_holdings = {item['ticker']: item['quantity'] for item in current_portfolio}
        current_prices = {asset.ticker: asset.current_price for asset in assets}

        for ticker, weight in cleaned_weights.items():
            optimal_value = total_value * weight
            current_price = current_prices.get(ticker, 0)
            if current_price == 0:
                continue

            optimal_quantity = int(optimal_value / current_price)
            current_quantity = current_holdings.get(ticker, 0)
            quantity_diff = optimal_quantity - current_quantity

            if quantity_diff != 0:
                action = 'Купить' if quantity_diff > 0 else 'Продать'
                recommendations.append({
                    'ticker': ticker,
                    'action': action,
                    'quantity': abs(quantity_diff),
                    'value': abs(quantity_diff) * current_price
                })

        return Response({
            'tickers': list(cleaned_weights.keys()),
            'weights': [float(w) for w in cleaned_weights.values()],
            'return': performance[0] * 100,
            'risk': performance[1] * 100,
            'sharpe': performance[2] if model == 'sharpe' else None,
            'frontier': ef_frontier,
            'recommendations': recommendations,
            'explanation': (
                "Модель Марковица минимизирует риск для заданной доходности. "
                "Модель Шарпа максимизирует коэффициент Шарпа (доходность/риск). "
                f"Вы выбрали модель: {model}. "
                f"Ожидаемая доходность: {target_return*100}%, уровень риска: {risk_level}."
            )
        })

    except ValueError as e:
        logger.error(f"Invalid input in optimize_portfolio: {str(e)}")
        return Response({'error': f'Invalid input: {str(e)}'}, status=400)
    except Exception as e:
        logger.error(f"Server error in optimize_portfolio: {str(e)}")
        return Response({'error': f'Server error: {str(e)}'}, status=500)

@api_view(['GET'])
def get_historical_prices(request):
    ticker = request.GET.get('ticker')
    if not ticker:
        logger.warning("Ticker parameter is missing in get_historical_prices")
        return Response({'error': 'Ticker parameter is required'}, status=400)

    asset = Asset.objects.filter(ticker=ticker).first()
    if not asset:
        logger.warning(f"Asset not found for ticker: {ticker}")
        return Response({'error': 'Asset not found'}, status=404)

    prices = asset.historical_prices.values('date', 'price')
    if not prices:
        logger.warning(f"No historical data available for ticker: {ticker}")
        return Response({'error': 'No historical data available'}, status=404)

    return Response({
        'ticker': ticker,
        'prices': list(prices)
    })