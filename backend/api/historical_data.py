import requests
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def fetch_current_price(ticker, instrument_type='shares'):
    boards = {
        'shares': 'TQBR',
        'bonds': 'TQCB',
        'etf': 'TQTD',
    }
    board = boards.get(instrument_type, 'TQBR')
    logger.info(f"Fetching current price for {ticker} (type: {instrument_type})")
    logger.info(f"Trying board {board} for {ticker}")

    url = f"https://iss.moex.com/iss/engines/stock/markets/{instrument_type}/boards/{board}/securities/{ticker}.json"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        market_data = data.get('marketdata', {}).get('data', [])
        if not market_data:
            logger.warning(f"No market data for {ticker} on {board}")
            return None

        for row in market_data:
            price = row[12]
            if price is not None and price > 0:
                logger.info(f"Found price for {ticker} on {board}: {price}")
                return price
        logger.warning(f"No valid price found for {ticker} on {board}")
        return None
    except requests.RequestException as e:
        logger.error(f"Failed to fetch current price for {ticker}: {str(e)}")
        return None

def fetch_historical_prices(ticker, start_date, end_date, instrument_type='shares'):
    boards = {
        'shares': 'TQBR',
        'bonds': 'TQCB',
        'etf': 'TQTD',
    }
    board = boards.get(instrument_type, 'TQBR')
    logger.info(f"Fetching historical prices for {ticker} from {start_date} to {end_date}")
    logger.info(f"Trying board {board} for historical prices of {ticker}")

    url = f"https://iss.moex.com/iss/history/engines/stock/markets/{instrument_type}/boards/{board}/securities/{ticker}.json?from={start_date}&till={end_date}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        history_data = data.get('history', {}).get('data', [])
        if not history_data:
            logger.warning(f"No historical data for {ticker} on {board}")
            return []

        historical_prices = []
        for row in history_data:
            try:
                date_str = row[0] 
                price = row[3]
                if not date_str or price is None:
                    continue

                date = datetime.strptime(date_str, '%Y-%m-%d').date()
                if price > 0:
                    historical_prices.append({
                        'date': date,
                        'price': float(price)
                    })
            except (ValueError, IndexError) as e:
                logger.warning(f"Skipping invalid historical data for {ticker}: {str(e)}")
                continue

        logger.info(f"Fetched {len(historical_prices)} historical prices for {ticker} on {board}")
        return historical_prices
    except requests.RequestException as e:
        logger.error(f"Failed to fetch historical prices for {ticker}: {str(e)}")
        return []