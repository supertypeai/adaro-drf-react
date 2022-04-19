from rest_framework import serializers
from .models import Location, LocationData

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'

class LocationDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationData
        fields = '__all__'