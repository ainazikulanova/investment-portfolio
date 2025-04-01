from django.shortcuts import render
from rest_framework import generics
from .models import Asset
from .serializers import AssetSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response

class AssetListCreate(generics.ListCreateAPIView):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer

class AssetDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Asset.objects.all()
    serializer_class = AssetSerializer

@api_view(['GET'])
def get_price(request, ticker):
    prices = {
        'SBER': 300.50,
        'GAZP': 150.20,
        'LKOH': 7000.00,
    }
    price = prices.get(ticker, 0)
    return Response({'ticker': ticker, 'price': price})