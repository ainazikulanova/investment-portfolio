from django.db import models

class Asset (models.Model):
    ticker = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    current_price = models.FloatField(default=0.0)
    instrument_type = models.CharField(
        max_length=10,
        choices=[
            ('shares', 'Shares'),
            ('bonds', 'Bonds'),
            ('etf', 'ETF'),
        ],
        default='shares'
    )

    def __str__(self):
        return self.ticker

class HistoricalPrice(models.Model):
    asset = models.ForeignKey(Asset, related_name='historical_prices', on_delete=models.CASCADE)
    date = models.DateField()
    price = models.FloatField()

    class Meta:
        unique_together = ('asset', 'date')

    def __str__(self):
        return f"{self.asset.ticker} - {self.date}: {self.price}"