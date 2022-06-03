from rest_framework import serializers
from .models import Location, LocationData
from django.contrib.auth.models import User
from rest_framework.authtoken.views import Token


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'


class LocationDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationData
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password']

        # This is to prevent the password from being displayed in the API and hash it.
        extra_kwargs = {'password':
                        {
                            'write_only': True,
                            'required': True
                        }}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        # This is to automatically create a token for each user being created.
        Token.objects.create(user=user)
        return user
