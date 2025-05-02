from rest_framework import serializers
from .models import Asset, HistoricalPrice

TICKER_MAPPING = {
    'sberbank': 'SBER',
    'gazprom': 'GAZP',
    'lukoil': 'LKOH',
    'yandex': 'YDEX',
    'rosneft': 'ROSN',
    'nornickel': 'GMKN',
    'tatneft': 'TATN',
    'novatek': 'NVTK',
    'ofz26207': 'SU26207RMFS9',
    'sberbond': 'RU000A0JX0J2',
    'finamrussia': 'FXRL',
    'sberetf': 'SBSP',
}

class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = ['id', 'ticker', 'name', 'buy_price', 'current_price', 'quantity', 'instrument_type']

    def validate_ticker(self, value):
        ticker_lower = value.lower()
        return TICKER_MAPPING.get(ticker_lower, ticker_lower.upper())

    def validate_name(self, value):
        ticker_lower = value.lower()
        return TICKER_MAPPING.get(ticker_lower, ticker_lower.upper())

    def validate_buy_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Цена покупки не может быть отрицательной.")
        return value

    def validate_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError("Количество не может быть отрицательным.")
        return value

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret.update({
            'hide_label': False,
            'placeholder': f'Введите {self.fields["ticker"].label.lower()}' if 'ticker' in self.fields else '',
            'autofocus': False
        })
        return ret

class HistoricalPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoricalPrice
        fields = ['date', 'price']