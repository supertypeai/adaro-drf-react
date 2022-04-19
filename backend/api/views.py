from http.client import HTTPResponse
from django.shortcuts import render
from django.http import JsonResponse

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Location, LocationData
from .serializers import LocationSerializer, LocationDataSerializer

# Create your views here.
@api_view(['GET'])
def apiOverview(request):
    api_urls = {
        'Locations': '/locs/',
        'Location (Add)': '/locs/add/',
        'Location (Data)': '/locs/<str:pk>/',
        'Location (Data) (Add)': '/locs/<str:pk>/add/',
        'Location (Data) (Update)': '/locs/<str:pk>/update/<str:rowKey>/',
        'Location (Data) (Delete)': '/locs/<str:pk>/delete/<str:rowKey>/',
    }

    return Response(api_urls)

@api_view(['GET'])
def locationList(request):
    locations = Location.objects.all()
    serializer = LocationSerializer(locations, many=True)
    
    return Response(serializer.data)

@api_view(['GET'])
def locationData(request, pk):
    data = LocationData.objects.filter(location=pk)
    serializer = LocationDataSerializer(data, many=True)

    return Response(serializer.data)