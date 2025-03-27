from django.urls import path
from .views import AssetListCreate, AssetDetail

urlpatterns = [
    path('assets/', AssetListCreate.as_view(), name='asset-list-create'),
    path('assets/<int:pk>/', AssetDetail.as_view(), name='asset-detail'),
]