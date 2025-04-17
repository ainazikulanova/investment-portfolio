from django.urls import path
from .views import (
    AssetListCreate,
    AssetDetail,
    get_price,
    optimize_portfolio,
    get_historical_prices,
)

urlpatterns = [
    path('assets/', AssetListCreate.as_view(), name='asset-list-create'),
    path('assets/<int:pk>/', AssetDetail.as_view(), name='asset-detail'),
    path('price/', get_price, name='get-price'),
    path('optimize/', optimize_portfolio, name='optimize-portfolio'),
    path('historical-prices/', get_historical_prices, name='get-historical-prices'),
]