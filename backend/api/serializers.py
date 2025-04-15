from rest_framework import serializers
from .models import Asset

TICKER_MAPPING = {
    'sberbank': 'SBER',
    'gazprom': 'GAZP',
    'lukoil': 'LKOH',
    'yandex': 'YNDX',
}

class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = ['id', 'ticker', 'name', 'buy_price', 'current_price', 'quantity']

    def validate_ticker(self, value):
        ticker_lower = value.lower()
        return TICKER_MAPPING.get(ticker_lower, ticker_lower.upper())

    def validate_name(self, value):
        ticker_lower = value.lower()
        return TICKER_MAPPING.get(ticker_lower, ticker_lower.upper())