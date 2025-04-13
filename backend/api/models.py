# backend/portfolio_backend/models.py
from django.db import models

class Asset(models.Model):
    name = models.CharField(max_length=50)
    buy_price = models.FloatField()
    current_price = models.FloatField()
    quantity = models.IntegerField()
    ticker = models.CharField(max_length=10, default="UNKNOWN")

    def __str__(self):
        return self.name

    class Meta:
        indexes = [
            models.Index(fields=['ticker']),  # Индекс для быстрого поиска по тикеру
        ]

class HistoricalPrice(models.Model):
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='historical_prices')
    date = models.DateField()
    price = models.FloatField()

    class Meta:
        indexes = [
            models.Index(fields=['asset', 'date']),  # Индекс для быстрого поиска цен
            models.Index(fields=['date']),
        ]
        unique_together = ('asset', 'date')  # Уникальность комбинации asset+date