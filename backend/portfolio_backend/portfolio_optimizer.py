import numpy as np
import pandas as pd
from scipy.optimize import minimize
import yfinance as yf

def get_asset_data(tickers, start_date, end_date):
    """Загружаем данные по тикерам через yfinance"""
    try:
        data = yf.download(tickers, start=start_date, end=end_date)["Adj Close"]
        returns = data.pct_change().dropna()
        mean_returns = returns.mean() * 252  # Годовая доходность
        cov_matrix = returns.cov() * 252    # Годовая ковариация
        return mean_returns, cov_matrix, data
    except Exception as e:
        raise Exception(f"Ошибка загрузки данных: {str(e)}")

def portfolio_volatility(weights, mean_returns, cov_matrix):
    """Вычисляем волатильность портфеля"""
    return np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))

def optimize_markowitz(target_return, mean_returns, cov_matrix):
    """Оптимизация по Марковицу"""
    num_assets = len(mean_returns)
    args = (mean_returns, cov_matrix)
    constraints = (
        {'type': 'eq', 'fun': lambda x: np.sum(x) - 1},  # Сумма весов = 1
        {'type': 'eq', 'fun': lambda x: np.sum(mean_returns * x) - target_return}  # Целевая доходность
    )
    bounds = tuple((0, 1) for _ in range(num_assets))
    result = minimize(portfolio_volatility, num_assets*[1./num_assets], args=args,
                      method='SLSQP', bounds=bounds, constraints=constraints)
    if not result.success:
        raise Exception("Оптимизация не удалась")
    weights = result.x
    port_return = np.sum(mean_returns * weights) * 252
    port_risk = portfolio_volatility(weights, mean_returns, cov_matrix)
    return weights, port_return, port_risk

def neg_sharpe_ratio(weights, mean_returns, cov_matrix, risk_free_rate=0.02):
    """Отрицательный Шарп для минимизации"""
    port_return = np.sum(mean_returns * weights) * 252
    port_vol = np.sqrt(np.dot(weights.T, np.dot(cov_matrix * 252, weights)))
    return - (port_return - risk_free_rate) / port_vol

def optimize_sharpe(mean_returns, cov_matrix, risk_free_rate=0.02):
    """Оптимизация по Шарпу"""
    num_assets = len(mean_returns)
    args = (mean_returns, cov_matrix, risk_free_rate)
    constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1})
    bounds = tuple((0, 1) for _ in range(num_assets))
    result = minimize(neg_sharpe_ratio, num_assets*[1./num_assets], args=args,
                      method='SLSQP', bounds=bounds, constraints=constraints)
    if not result.success:
        raise Exception("Оптимизация не удалась")
    weights = result.x
    port_return = np.sum(mean_returns * weights) * 252
    port_risk = portfolio_volatility(weights, mean_returns, cov_matrix)
    sharpe = (port_return - risk_free_rate) / port_risk
    return weights, port_return, port_risk, sharpe

def efficient_frontier(mean_returns, cov_matrix, num_portfolios=50):
    """Строим эффективную границу"""
    results = []
    target_returns = np.linspace(mean_returns.min(), mean_returns.max(), num_portfolios)
    for tr in target_returns:
        try:
            weights, _, risk = optimize_markowitz(tr, mean_returns, cov_matrix)
            results.append([risk, tr, weights])
        except:
            continue
    return results