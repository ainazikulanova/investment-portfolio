import requests
import logging
from time import sleep

logger = logging.getLogger(__name__)

def fetch_current_price(ticker, instrument_type="shares", retries=3, delay=2):
    logger.info(f"Fetching current price for {ticker} (type: {instrument_type})")
    market = "bonds" if instrument_type == "bonds" else "shares"
    boards = {
        "shares": ["TQBR"],
        "etf": ["TQTF", "TQBR"],
        "bonds": ["TQOB", "CETS", "RPMO"], 
    }
    target_boards = boards.get(instrument_type, ["TQBR"])

    for board in target_boards:
        logger.info(f"Trying board {board} for {ticker}")
        for attempt in range(retries):
            try:
                url = f"https://iss.moex.com/iss/engines/stock/markets/{market}/boards/{board}/securities/{ticker}.json"
                response = requests.get(url)
                response.raise_for_status()
                data = response.json()
                market_data = data.get('marketdata', {}).get('data', [])
                logger.info(f"Market data for {ticker} on {board}: {market_data}")

                for row in market_data:
                    board_id = row[1]
                    if board_id == board:
                        price = row[4]
                        if price is not None and price > 0:
                            logger.info(f"Found price for {ticker} on {board}: {price}")
                            return float(price * 10) if instrument_type == "bonds" else float(price)

                for row in market_data:
                    price = row[4]
                    if price is not None and price > 0:
                        logger.info(f"Found fallback price for {ticker} on {row[1]}: {price}")
                        return float(price * 10) if instrument_type == "bonds" else float(price)

                logger.warning(f"No valid price data for {ticker} on {board} in attempt {attempt + 1}/{retries}")
                if attempt + 1 == retries:
                    logger.error(f"No valid price data for {ticker} on {board} after {retries} attempts")
                sleep(delay)

            except requests.RequestException as e:
                logger.warning(f"Attempt {attempt + 1}/{retries} failed for {ticker} on {board}: {str(e)}")
                if attempt + 1 == retries:
                    logger.error(f"Failed to fetch price for {ticker} on {board} after {retries} attempts: {str(e)}")
                sleep(delay)

    logger.error(f"No price data found for {ticker} on any board")
    return None

def fetch_historical_prices(ticker, start_date, end_date, instrument_type="shares", retries=3, delay=2):
    logger.info(f"Fetching historical prices for {ticker} from {start_date} to {end_date}")
    market = "bonds" if instrument_type == "bonds" else "shares"
    boards = {
        "shares": ["TQBR"],
        "etf": ["TQTF", "TQBR"],
        "bonds": ["TQOB", "CETS", "RPMO"],
    }
    target_boards = boards.get(instrument_type, ["TQBR"])

    for board in target_boards:
        logger.info(f"Trying board {board} for historical prices of {ticker}")
        for attempt in range(retries):
            try:
                url = f"https://iss.moex.com/iss/history/engines/stock/markets/{market}/boards/{board}/securities/{ticker}.json?from={start_date}&till={end_date}"
                response = requests.get(url)
                response.raise_for_status()
                data = response.json()
                history_data = data.get('history', {}).get('data', [])
                prices = []
                for row in history_data:
                    date = row[2]
                    close = row[11]
                    if close is not None and close > 0:
                        adjusted_price = float(close * 10) if instrument_type == "bonds" else float(close)
                        prices.append({'date': date, 'price': adjusted_price})
                if prices:
                    logger.info(f"Fetched {len(prices)} historical prices for {ticker} on {board}")
                    return prices
                logger.warning(f"No historical prices for {ticker} on {board} in attempt {attempt + 1}/{retries}")
                if attempt + 1 == retries:
                    logger.error(f"No historical prices for {ticker} on {board} after {retries} attempts")
                sleep(delay)
            except requests.RequestException as e:
                logger.warning(f"Attempt {attempt + 1}/{retries} failed for {ticker} on {board}: {str(e)}")
                if attempt + 1 == retries:
                    logger.error(f"Failed to fetch historical prices for {ticker} on {board} after {retries} attempts: {str(e)}")
                sleep(delay)
    logger.error(f"No historical price data found for {ticker} on any board")
    return []