from django.urls import path
from .views import AssetListCreate, AssetDetail, get_price

urlpatterns = [
    path('assets/', AssetListCreate.as_view(), name='asset-list-create'),
    path('assets/<int:pk>/', AssetDetail.as_view(), name='asset-detail'),
    path('price/<str:ticker>/', get_price, name='get-price'),
]