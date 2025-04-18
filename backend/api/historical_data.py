import requests
import logging

logger = logging.getLogger(__name__)

def fetch_current_price(ticker):
    logger.info(f"Fetching current price for {ticker}")
    try:
        url = f"https://iss.moex.com/iss/engines/stock/markets/shares/securities/{ticker}.json"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        market_data = data.get('marketdata', {}).get('data', [])
        logger.info(f"Market data for {ticker}: {market_data}")

        for row in market_data:
            board_id = row[1]
            if board_id == 'TQBR':
                price = row[4]
                if price is not None:
                    logger.info(f"Found price for {ticker} on TQBR: {price}")
                    return float(price)
                else:
                    logger.warning(f"No LAST price for {ticker} on TQBR")

        for row in market_data:
            price = row[4]
            if price is not None:
                logger.info(f"Found fallback price for {ticker} on {row[1]}: {price}")
                return float(price)

        logger.error(f"No valid price data for {ticker}")
        return None

    except Exception as e:
        logger.error(f"Failed to fetch current price for {ticker}: {str(e)}")
        return None