from django.urls import path
from . import views

urlpatterns = [
    path('', views.apiOverview, name='api-overview'),
    path('locs/', views.locationList, name='location-list'),
    path('locs/<str:pk>/', views.locationData, name='location-data'),
]