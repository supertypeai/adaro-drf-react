from rest_framework import serializers
from .models import Location, LocationData
from django.contrib.auth.models import User
from rest_framework.authtoken.views import Token
from django.db.models import Q


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = "__all__"


class LocationDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationData
        fields = "__all__"


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

        # This is to prevent the password from being displayed in the API and hash it.
        extra_kwargs = {
            "password": {"write_only": True, "required": True},
            "email": {"required": True},
        }

    def create(self, validated_data):
        user = User(email=validated_data["email"], username=validated_data["username"])
        user.set_password(validated_data["password"])
        user.save()

        # This is to automatically create a token for each user being created.
        Token.objects.create(user=user)
        return user

    def validate(self, data):
        id = self.context.get("id")
        email = data.get("email")

        current_user = User.objects.filter(id=id)
        if current_user:
            current_email = User.objects.filter(id=id).values("email")[0]["email"]
            if current_email != email:
                user = User.objects.filter(email=email).first()

                if user:
                    raise serializers.ValidationError(
                        {"email": f"The email has been taken"}
                    )
        else:
            user = User.objects.filter(email=email).first()
            if user:
                raise serializers.ValidationError({"email": "The email has been taken"})
        return super().validate(data)
