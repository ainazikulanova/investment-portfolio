from rest_framework import serializers
from .models import Asset

class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = ['id', 'ticker', 'name', 'buy_price', 'current_price', 'quantity']

    def validate_ticker(self, value):
        return value.upper().replace('.ME', '')

    def validate_name(self, value):
        return value.upper().replace('.ME', '')