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
from .historical_data import fetch_and_cache_prices

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
    normalized_ticker = TICKER_MAPPING.get(ticker_lower, ticker_lower.upper())

    try:
        asset = Asset.objects.filter(ticker=normalized_ticker).first()
        if asset and asset.historical_prices.filter(date=datetime.now().date()).exists():
            price = asset.historical_prices.filter(date=datetime.now().date()).first().price
            logger.info(f"Price for {normalized_ticker} retrieved from database: {price}")
            return Response({'ticker': normalized_ticker, 'price': float(price)})

        response = requests.get(f'https://iss.moex.com/iss/engines/stock/markets/shares/securities/{normalized_ticker}.json')
        response.raise_for_status()
        data = response.json()
        market_data = data.get('marketdata', {}).get('data', [])
        if not market_data:
            logger.warning(f"No price data available for {normalized_ticker} via MOEX ISS API, using fallback")
            price = 100
        else:
            price = market_data[0][4]
            if price is None:
                logger.warning(f"No valid price data for {normalized_ticker}, using fallback")
                price = 100

        logger.info(f"Price for {normalized_ticker}: {price}")
        return Response({'ticker': normalized_ticker, 'price': float(price)})
    except Exception as e:
        logger.error(f"Failed to fetch price for {normalized_ticker}: {str(e)}")
        return Response({'error': f'Failed to fetch price for {normalized_ticker}: {str(e)}'}, status=400)

@api_view(['POST'])
def optimize_portfolio(request):
    try:
        tickers = request.data.get("tickers", "").split(",")
        tickers = [ticker.strip() for ticker in tickers if ticker.strip()]
        model = request.data.get("model", "markowitz").lower()
        target_return = float(request.data.get("target_return", 0.1))
        risk_level = float(request.data.get("risk_level", 0.02))
        current_portfolio = request.data.get("current_portfolio", [])

        logger.info(f"Received optimization request: tickers={tickers}, model={model}, target_return={target_return}, risk_level={risk_level}, current_portfolio={current_portfolio}")

        if len(tickers) < 2:
            logger.error("Less than 2 valid tickers provided for optimization")
            return Response({'error': 'At least 2 valid tickers are required'}, status=400)

        if model not in ['markowitz', 'sharpe']:
            return Response({'error': 'Invalid model. Use "markowitz" or "sharpe"'}, status=400)

        normalized_tickers = [TICKER_MAPPING.get(t.lower(), t.upper().replace('.ME', '')) for t in tickers]
        logger.info(f"Normalized tickers: {normalized_tickers}")

        start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
        end_date = datetime.now().strftime("%Y-%m-%d")
        price_data = fetch_and_cache_prices(normalized_tickers, start_date, end_date)
        logger.info(f"Price data after fetch: {price_data}")

        market_prices = fetch_and_cache_prices(['IMOEX'], start_date, end_date)
        if not market_prices.get('IMOEX'):
            logger.error("Failed to fetch market index data for IMOEX")
            return Response({'error': 'Failed to fetch market index data'}, status=500)

        assets = Asset.objects.filter(ticker__in=normalized_tickers)
        logger.info(f"Found assets: {[asset.ticker for asset in assets]}")

        if len(assets) < 2:
            logger.error(f"Need at least 2 assets for optimization, found: {len(assets)}")
            return Response({'error': 'Need at least 2 assets for optimization'}, status=400)

        data = {}
        for asset in assets:
            prices = asset.historical_prices.values('date', 'price')
            logger.info(f"Historical prices for {asset.ticker}: {list(prices)}")
            if not prices:
                logger.warning(f"No historical prices for {asset.ticker}, adding fallback")
                dates = [
                    (datetime.now() - timedelta(days=2)).date(),
                    (datetime.now() - timedelta(days=1)).date(),
                    datetime.now().date()
                ]
                prices = [
                    {'date': dates[0], 'price': asset.current_price * 0.99},
                    {'date': dates[1], 'price': asset.current_price},
                    {'date': dates[2], 'price': asset.current_price * 1.01}
                ]
                for price_entry in prices:
                    HistoricalPrice.objects.update_or_create(
                        asset=asset,
                        date=price_entry['date'],
                        defaults={'price': price_entry['price']}
                    )
            price_series = pd.Series(
                {p['date']: p['price'] for p in prices},
                name=asset.ticker
            )
            if len(price_series) < 2:
                logger.warning(f"Insufficient price data for {asset.ticker}, adding fallback")
                dates = [
                    (datetime.now() - timedelta(days=2)).date(),
                    (datetime.now() - timedelta(days=1)).date()
                ]
                prices = [
                    {'date': dates[0], 'price': asset.current_price * 0.99},
                    {'date': dates[1], 'price': asset.current_price}
                ]
                for price_entry in prices:
                    HistoricalPrice.objects.update_or_create(
                        asset=asset,
                        date=price_entry['date'],
                        defaults={'price': price_entry['price']}
                    )
                price_series = pd.Series(
                    [price_entry['price'] for price_entry in prices],
                    index=[price_entry['date'] for price_entry in prices],
                    name=asset.ticker
                )
            data[asset.ticker] = price_series
            logger.info(f"Price series for {asset.ticker}: {price_series.to_dict()}")

        df = pd.DataFrame(data)
        logger.info(f"DataFrame for optimization: {df}")
        if df.empty or len(df.columns) < 2:
            logger.error("Insufficient historical data for optimization")
            return Response({'error': 'Insufficient historical data'}, status=400)

        if len(df) < 2:
            logger.error("Not enough price data points for optimization")
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
                ef_new = EfficientFrontier(mu, S)
                ef_new.efficient_return(ret)
                perf = ef_new.portfolio_performance()
                ef_frontier.append({
                    'return': perf[0] * 100,
                    'risk': perf[1] * 100
                })
            except ValueError:
                continue

        # 1. Доходность портфеля
        weights_series = pd.Series(cleaned_weights)
        portfolio_returns = (df.pct_change().dropna() * weights_series).sum(axis=1)

        # 2. Доходность рынка (IMOEX)
        market_df = pd.DataFrame(market_prices['IMOEX'], columns=['IMOEX']).pct_change().dropna()

        # 3. Синхронизируем данные
        common_dates = portfolio_returns.index.intersection(market_df.index)
        portfolio_returns = portfolio_returns.loc[common_dates]
        market_returns = market_df['IMOEX'].loc[common_dates]

        # 4. Расчёт бета
        covariance = portfolio_returns.cov(market_returns)
        market_variance = market_returns.var()
        beta = covariance / market_variance if market_variance != 0 else 0

        # 5. Расчёт альфа
        portfolio_annual_return = performance[0]
        market_annual_return = expected_returns.mean_historical_return(pd.DataFrame(market_prices['IMOEX'], columns=['IMOEX']))[0]
        risk_free_rate = risk_level
        alpha = portfolio_annual_return - (risk_free_rate + beta * (market_annual_return - risk_free_rate))

        recommendations = []
        total_value = sum(
            item['quantity'] * Asset.objects.get(ticker=item['ticker']).current_price
            for item in current_portfolio if Asset.objects.filter(ticker=item['ticker']).exists()
        ) if current_portfolio else 1000

        current_holdings = {item['ticker']: item['quantity'] for item in current_portfolio if Asset.objects.filter(ticker=item['ticker']).exists()}
        current_prices = {asset.ticker: asset.current_price for asset in assets if asset.current_price > 0}

        for ticker, weight in cleaned_weights.items():
            if ticker not in current_prices or current_prices[ticker] <= 0:
                continue
            optimal_value = total_value * weight
            current_price = current_prices[ticker]
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
            'beta': float(beta),  # Добавляем бета
            'alpha': float(alpha),  # Добавляем альфа
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