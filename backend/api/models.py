from django.db import models

class Asset(models.Model):
    name = models.CharField(max_length=50)
    buy_price = models.FloatField()
    current_price = models.FloatField()
    quantity = models.IntegerField()
    ticker = models.CharField(max_length=10, default="UNKNOWN")

    def __str__(self):
        return self.name

class HistoricalPrice(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='historical_prices')
    date = models.DateField()
    price = models.FloatField()