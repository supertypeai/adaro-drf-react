from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = routers.DefaultRouter()
router.register("locs", views.LocationListView, "locs")
router.register("users", views.UserView, "users")

urlpatterns = [
    # path('', views.apiOverview, name='api-overview'),
    path("", include(router.urls)),
    path("locs/data/<int:locId>/", views.locationData, name="locs-data"),
    # path("locs/forecast-data/", views.getForecastData, name="forecast-data"),
    path(
        "locs/single-data/<int:pk>/",
        views.singleLocationData,
        name="single-location-data",
    ),
    path("token/", views.MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
