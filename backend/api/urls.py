from django.urls import path
from . import views

urlpatterns = [
    path('', views.apiOverview, name='api-overview'),

    path('locs/', views.locationList, name='location-list'),
    path('locs/add-location/', views.addLocation, name='add-location'),

    path('locs/data/<str:pk>/', views.locationData, name='location-data'),
    path('locs/add-data/', views.addData, name='add-data'),

    path('locs/forecast-data/',
         views.getForecastData, name='forecast-data'),
]
