from django.urls import path, include
from rest_framework import routers
from . import views

# router = routers.DefaultRouter()
# router.register("locs", views.LocationListView, "locs")
# router.register("users", views.UserView, "users")

urlpatterns = [
    # path('', views.apiOverview, name='api-overview'),
    # path("", include(router.urls)),
    # path("locs/data/<int:locId>/", views.locationData, name="locs-data"),
    path("locs/forecast-data/", views.getForecastData, name="forecast-data"),
    path("sensor/data/insert", views.postSensorData, name="muara_tuhup_sensor-post"),
    path("sensor/data/retrieve", views.getSensorData, name="muara_tuhup_sensor-get"),
    # path(
    #     # "locs/single-data/<int:pk>/",
    #     views.singleLocationData,
    #     name="single-location-data",
    # ),
]
