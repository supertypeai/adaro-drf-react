import re
from rest_framework import viewsets, status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.shortcuts import HttpResponse
from google.cloud import bigquery
from pandas import DataFrame
import json

from .models import Location, LocationData
from .serializers import LocationSerializer, LocationDataSerializer, UserSerializer


# Create your views here.


# @api_view(['GET'])
# def apiOverview(request):
#     api_urls = {
#         'Locations': '/locs/',
#         'Location (Add)': '/locs/add-location/',
#         'Location (Data)': '/locs/data/<str:pk>/',
#         'Location (Data) (Add)': '/locs/add-data/',
#         'Location (Data) (Update)': '/locs/<str:pk>/update/<str:rowKey>/',
#         'Location (Data) (Delete)': '/locs/<str:pk>/delete/<str:rowKey>/',
#     }

#     return Response(api_urls)


class LocationListView(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer

    permission_classes = [IsAuthenticated]
    authentication_classes = [TokenAuthentication]


@api_view(["GET", "POST"])
@authentication_classes(
    [TokenAuthentication, ]
)
@permission_classes(
    [IsAuthenticated, ]
)
def locationData(request, locId):
    if request.method == "GET":
        locationData = LocationData.objects.filter(location=locId)
        serializer = LocationDataSerializer(locationData, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        newData = request.data
        serializer = LocationDataSerializer(data=newData)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@authentication_classes(
    [TokenAuthentication, ]
)
@permission_classes(
    [IsAuthenticated, ]
)
def singleLocationData(request, pk):
    try:
        locData = LocationData.objects.get(pk=pk)
    except LocationData.DoesNotExist:
        return HttpResponse(status=404)

    if request.method == "GET":
        serializer = LocationDataSerializer(locData)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = LocationDataSerializer(locData, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        locData.delete()
        return HttpResponse(status=status.HTTP_204_NO_CONTENT)


class UserView(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
