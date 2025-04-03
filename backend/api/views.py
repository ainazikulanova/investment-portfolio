import yfinance as yf
from datetime import datetime, timedelta
from pypfopt import EfficientFrontier, risk_models, expected_returns
import pandas as pd
import numpy as np
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['GET'])
def optimize_portfolio(request):
    model = request.GET.get('model', 'markowitz')  # markowitz или sharpe
    target_return = float(request.GET.get('target_return', 0)) / 100  # Ожидаемая доходность в %
    risk_level = float(request.GET.get('risk_level', 0.5))  # Уровень риска (0-1)

    assets = Asset.objects.all()
    if len(assets) < 2:
        return Response({'error': 'Need at least 2 assets'}, status=400)

    data = {}
    for asset in assets:
        prices = asset.historical_prices.values('date', 'price')
        if prices:
            data[asset.ticker] = pd.Series({p['date']: p['price'] for p in prices}, name=asset.ticker)
    df = pd.DataFrame(data)
    if df.empty:
        return Response({'error': 'No historical data'}, status=400)

    mu = expected_returns.mean_historical_return(df)
    S = risk_models.sample_cov(df)
    ef = EfficientFrontier(mu, S)

    # Оптимизация
    if model == 'sharpe':
        weights = ef.max_sharpe(risk_free_rate=risk_level)
    else:  # markowitz
        if target_return > 0:
            weights = ef.efficient_return(target_return)
        else:
            weights = ef.min_volatility()

    cleaned_weights = ef.clean_weights()
    
    # Эффективная граница для визуализации
    ef_frontier = []
    returns = np.linspace(min(mu), max(mu), 50)
    for ret in returns:
        ef.efficient_return(ret)
        ef_frontier.append({
            'return': ret * 100,  # В процентах
            'risk': ef.portfolio_performance()[1] * 100  # В процентах
        })

    return Response({
        'weights': cleaned_weights,
        'performance': ef.portfolio_performance(),
        'frontier': ef_frontier,
        'explanation': (
            "Модель Марковица минимизирует риск для заданной доходности. "
            "Модель Шарпа максимизирует коэффициент Шарпа (доходность/риск). "
            f"Вы выбрали модель: {model}. "
            f"Ожидаемая доходность: {target_return*100}%, уровень риска: {risk_level}."
        )
    })