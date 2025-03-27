from django.db import models

class Asset(models.Model):
    name = models.CharField(max_length=50)
    buy_price = models.FloatField()
    current_price = models.FloatField()
    quantity = models.IntegerField()

    def __str__(self):
        return self.name
