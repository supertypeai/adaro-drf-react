from django.urls import path, include
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register('locs', views.LocationListView, 'locs')
router.register('users', views.UserView, 'users')

urlpatterns = [
    # path('', views.apiOverview, name='api-overview'),
    path('', include(router.urls)),

    path('locs/data/<int:pk>/', views.locationData, name='locs-data'),
    path('locs/forecast-data/',
         views.getForecastData, name='forecast-data'),
]
