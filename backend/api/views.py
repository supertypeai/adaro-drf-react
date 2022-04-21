from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Location, LocationData
from .serializers import LocationSerializer, LocationDataSerializer

# Create your views here.
@api_view(['GET'])
def apiOverview(request):
    api_urls = {
        'Locations': '/locs/',
        'Location (Add)': '/locs/add-location/',
        'Location (Data)': '/locs/data/<str:pk>/',
        'Location (Data) (Add)': '/locs/add-data/',
        'Location (Data) (Update)': '/locs/<str:pk>/update/<str:rowKey>/',
        'Location (Data) (Delete)': '/locs/<str:pk>/delete/<str:rowKey>/',
    }

    return Response(api_urls)

@api_view(['GET'])
def locationList(request):
    locations = Location.objects.all()
    serializer = LocationSerializer(locations, many=True)
    
    return Response(serializer.data)

@api_view(['POST'])
def addLocation(request):
    serializer = LocationSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()

    return Response(serializer.data)

@api_view(['GET'])
def locationData(request, pk):
    data = LocationData.objects.filter(location=pk)
    serializer = LocationDataSerializer(data, many=True)

    return Response(serializer.data)

@api_view(['POST'])
def addData(request):
    serializer = LocationDataSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
    
    return Response(serializer.data)