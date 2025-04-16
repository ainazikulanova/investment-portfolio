import requests
from datetime import datetime, timedelta
import logging
from ..models import Asset, HistoricalPrice

logger = logging.getLogger(__name__)

def fetch_and_cache_prices(tickers, start_date, end_date):
    """
    Получает исторические цены с MOEX ISS API и кэширует их в базе данных.
    Возвращает словарь с сериями цен для каждого тикера.
    """
    price_data = {}
    for ticker in tickers:
        try:
            ticker = ticker.upper().replace('.ME', '')
            logger.info(f"Fetching historical prices for {ticker} from {start_date} to {end_date}")
            response = requests.get(
                f'https://iss.moex.com/iss/history/engines/stock/markets/shares/securities/{ticker}.json?from={start_date}&to={end_date}'
            )
            response.raise_for_status()
            data = response.json()
            history_data = data.get('history', {}).get('data', [])
            
            logger.info(f"MOEX ISS API response for {ticker}: {history_data}")

            asset, created = Asset.objects.get_or_create(
                ticker=ticker,
                defaults={
                    'name': ticker,
                    'buy_price': 100,
                    'current_price': 100,
                    'quantity': 0
                }
            )

            prices = {}
            if not history_data or len(history_data) < 2:
                logger.warning(f"No or insufficient historical price data for {ticker}, adding fallback data")
                dates = [
                    (datetime.now() - timedelta(days=2)).date(),
                    (datetime.now() - timedelta(days=1)).date(),
                    datetime.now().date()
                ]
                prices = [asset.current_price * 0.99, asset.current_price, asset.current_price * 1.01]
            else:
                for row in history_data:
                    date = datetime.strptime(row[2], '%Y-%m-%d').date()
                    price = row[11]
                    if price is not None:
                        prices[date] = price
                        HistoricalPrice.objects.update_or_create(
                            asset=asset,
                            date=date,
                            defaults={'price': price}
                        )
                if len(prices) < 2:
                    logger.warning(f"Adding additional price data for {ticker}")
                    last_date = max(prices.keys())
                    prices[last_date - timedelta(days=1)] = prices[last_date] * 0.99
                    HistoricalPrice.objects.update_or_create(
                        asset=asset,
                        date=last_date - timedelta(days=1),
                        defaults={'price': prices[last_date] * 0.99}
                    )

            price_data[ticker] = prices
        except Exception as e:
            logger.error(f"Error fetching historical prices for {ticker}: {str(e)}")
            continue

    return price_data