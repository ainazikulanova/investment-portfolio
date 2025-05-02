import numpy as np
import pandas as pd
from pypfopt import EfficientFrontier
from scipy.optimize import minimize

def optimize_markowitz(mu, S, target_return=0.1):
    """Оптимизация по модели Марковица (минимизация риска при заданной доходности)."""
    ef = EfficientFrontier(mu, S)
    if target_return > 0:
        weights = ef.efficient_return(target_return)
    else:
        weights = ef.min_volatility()
    cleaned_weights = ef.clean_weights()
    performance = ef.portfolio_performance(risk_free_rate=0.02)
    return cleaned_weights, performance

def optimize_sharpe(mu, S, risk_free_rate=0.02):
    """Оптимизация по максимальному коэффициенту Шарпа."""
    ef = EfficientFrontier(mu, S)
    weights = ef.max_sharpe(risk_free_rate=risk_free_rate)
    cleaned_weights = ef.clean_weights()
    performance = ef.portfolio_performance(risk_free_rate=risk_free_rate)
    return cleaned_weights, performance

def optimize_sortino(mu, S, returns_df, risk_free_rate=0.02, L=0.0):
    """Оптимизация по максимальному коэффициенту Сортино (приближение)."""
    ef = EfficientFrontier(mu, S)
    weights = ef.max_sharpe(risk_free_rate=risk_free_rate)  # Приближение
    cleaned_weights = ef.clean_weights()
    downside_returns = returns_df[returns_df < L].dropna()
    downside_risk = np.sqrt(np.mean(downside_returns ** 2)) * np.sqrt(252) if not downside_returns.empty else 0
    portfolio_returns = returns_df @ [cleaned_weights.get(t, 0) for t in returns_df.columns]
    annualized_return = np.mean(portfolio_returns) * 252
    sortino_ratio = (annualized_return - risk_free_rate) / downside_risk if downside_risk > 0 else 0
    return cleaned_weights, (annualized_return / 100, np.std(portfolio_returns) * np.sqrt(252), sortino_ratio)

def optimize_rachev(mu, S, returns_df, risk_free_rate=0.02):
    """Оптимизация по максимальному коэффициенту Рачева (приближение)."""
    ef = EfficientFrontier(mu, S)
    weights = ef.max_sharpe(risk_free_rate=risk_free_rate)  # Приближение
    cleaned_weights = ef.clean_weights()
    portfolio_returns = returns_df @ [cleaned_weights.get(t, 0) for t in returns_df.columns]
    cvar_positive = -np.percentile(portfolio_returns, 95) * np.sqrt(252)
    cvar_negative = np.percentile(portfolio_returns, 5) * np.sqrt(252)
    rachev_ratio = cvar_positive / cvar_negative if cvar_negative > 0 else 0
    annualized_return = np.mean(portfolio_returns) * 252
    annualized_volatility = np.std(portfolio_returns) * np.sqrt(252)
    return cleaned_weights, (annualized_return / 100, annualized_volatility, rachev_ratio)

def optimize_max_drawdown(mu, S, returns_df):
    """Оптимизация по минимизации максимальной просадки."""
    def calculate_drawdown(weights):
        portfolio_returns = returns_df @ weights
        cum_returns = (1 + portfolio_returns).cumprod()
        peak = cum_returns.cummax()
        drawdown = (cum_returns - peak) / peak
        return drawdown.min()

    initial_weights = np.array([1.0 / len(mu)] * len(mu))
    bounds = tuple((0, 1) for _ in range(len(mu)))
    constraints = {'type': 'eq', 'fun': lambda w: np.sum(w) - 1}
    result = minimize(
        lambda w: calculate_drawdown(w),
        initial_weights,
        method='SLSQP',
        bounds=bounds,
        constraints=constraints
    )
    weights = {ticker: weight for ticker, weight in zip(mu.index, result.x)}
    portfolio_returns = returns_df @ result.x
    annualized_return = np.mean(portfolio_returns) * 252
    annualized_volatility = np.std(portfolio_returns) * np.sqrt(252)
    cum_returns = (1 + portfolio_returns).cumprod()
    peak = cum_returns.cummax()
    max_drawdown = ((cum_returns - peak) / peak).min()
    return weights, (annualized_return / 100, annualized_volatility, max_drawdown)

def calculate_additional_metrics(weights, returns_df, risk_free_rate=0.02, L=0.0):
    """Расчёт дополнительных метрик для портфеля."""
    portfolio_returns = returns_df @ [weights.get(t, 0) for t in returns_df.columns]
    annualized_return = np.mean(portfolio_returns) * 252
    annualized_volatility = np.std(portfolio_returns) * np.sqrt(252)
    downside_returns = portfolio_returns[portfolio_returns < L].dropna()
    downside_risk = np.sqrt(np.mean(downside_returns ** 2)) * np.sqrt(252) if not downside_returns.empty else 0
    sortino_ratio = (annualized_return - risk_free_rate) / downside_risk if downside_risk > 0 else 0
    cvar_positive = -np.percentile(portfolio_returns, 95) * np.sqrt(252)
    cvar_negative = np.percentile(portfolio_returns, 5) * np.sqrt(252)
    rachev_ratio = cvar_positive / cvar_negative if cvar_negative > 0 else 0
    cum_returns = (1 + portfolio_returns).cumprod()
    peak = cum_returns.cummax()
    max_drawdown = ((cum_returns - peak) / peak).min()
    calmar_ratio = annualized_return / (-max_drawdown) if -max_drawdown > 0 else 0
    sterling_ratio = (annualized_return - risk_free_rate) / (-max_drawdown) if -max_drawdown > 0 else 0
    return {
        'sortino': sortino_ratio,
        'rachev': rachev_ratio,
        'max_drawdown': max_drawdown,
        'calmar': calmar_ratio,
        'sterling': sterling_ratio
    }