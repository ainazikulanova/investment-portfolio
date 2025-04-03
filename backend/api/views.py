import yfinance as yf
from datetime import datetime, timedelta
from pypfopt import EfficientFrontier, risk_models, expected_returns
import pandas as pd
import numpy as np
from rest_framework import generics
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Asset, HistoricalPrice  # Предполагаемые модели
from .serializers import AssetSerializer  # Предполагаемый сериализатор

# Класс для списка и создания активов
class AssetListCreate(generics.ListCreateAPIView):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer

# Класс для детальной информации, обновления и удаления активов
class AssetDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer

# Функция для получения цены (заглушка, можно доработать)
@api_view(['GET'])
def get_price(request):
    ticker = request.GET.get('ticker')
    if not ticker:
        return Response({'error': 'Ticker parameter is required'}, status=400)
    
    try:
        stock = yf.Ticker(ticker)
        price = stock.history(period='1d')['Close'].iloc[-1]
        return Response({'ticker': ticker, 'price': price})
    except Exception as e:
        return Response({'error': str(e)}, status=400)

# Функция оптимизации портфеля (ваш код с улучшениями)
@api_view(['GET'])
def optimize_portfolio(request):
    try:
        model = request.GET.get('model', 'markowitz').lower()
        target_return = float(request.GET.get('target_return', 0)) / 100
        risk_level = float(request.GET.get('risk_level', 0.5))

        if model not in ['markowitz', 'sharpe']:
            return Response({'error': 'Invalid model. Use "markowitz" or "sharpe"'}, status=400)

        assets = Asset.objects.all()
        if len(assets) < 2:
            return Response({'error': 'Need at least 2 assets for optimization'}, status=400)

        data = {}
        for asset in assets:
            prices = asset.historical_prices.values('date', 'price')
            if not prices:
                continue
            data[asset.ticker] = pd.Series(
                {p['date']: p['price'] for p in prices}, 
                name=asset.ticker
            )
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

        return Response({
            'weights': cleaned_weights,
            'performance': {
                'expected_return': performance[0] * 100,
                'volatility': performance[1] * 100,
                'sharpe_ratio': performance[2]
            },
            'frontier': ef_frontier,
            'explanation': (
                "Модель Марковица минимизирует риск для заданной доходности. "
                "Модель Шарпа максимизирует коэффициент Шарпа (доходность/риск). "
                f"Вы выбрали модель: {model}. "
                f"Ожидаемая доходность: {target_return*100}%, уровень риска: {risk_level}."
            )
        })

    except ValueError as e:
        return Response({'error': f'Invalid input: {str(e)}'}, status=400)
    except Exception as e:
        return Response({'error': f'Server error: {str(e)}'}, status=500)