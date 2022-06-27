from unittest.util import _MAX_LENGTH
from libcst import Pass
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Location, LocationData
from django.contrib.auth.models import User
from rest_framework.authtoken.views import Token
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import smart_str, force_str, smart_bytes, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework.exceptions import AuthenticationFailed


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = "__all__"


class LocationDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationData
        fields = "__all__"


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token["username"] = user.username
        token["email"] = user.email
        # ...

        return token


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
        user = User(email=validated_data["email"],
                    username=validated_data["username"])
        user.set_password(validated_data["password"])
        user.save()

        # This is to automatically create a token for each user being created.
        # Token.objects.create(user=user)
        return user

    def validate(self, data):
        id = self.context.get("id")
        email = data.get("email")

        current_user = User.objects.filter(id=id)
        if current_user:
            current_email = User.objects.filter(
                id=id).values("email")[0]["email"]
            if current_email != email:
                user = User.objects.filter(email=email).first()

                if user:
                    raise serializers.ValidationError(
                        {"email": f"The email has been taken"}
                    )
        else:
            user = User.objects.filter(email=email).first()
            if user:
                raise serializers.ValidationError(
                    {"email": "The email has been taken"})
        return super().validate(data)


class ResetPasswordEmailRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(min_length=2)

    class Meta:
        fields = ['emails']


class SetNewPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(
        min_length=6, max_length=68, write_only=True)
    token = serializers.CharField(
        min_length=1, write_only=True)
    uidb64 = serializers.CharField(
        min_length=1, write_only=True)

    class Meta:
        fields = ['password', 'token', 'uidb64']

    def validate(self, attrs):
        try:
            password = attrs.get('password')
            token = attrs.get('token')
            uidb64 = attrs.get('uidb64')

            id = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=id)

            if not PasswordResetTokenGenerator().check_token(user, token):
                raise AuthenticationFailed(
                    'The reset link is invalid.', 401)

            user.set_password(password)
            user.save()

            return user
        except Exception as e:
            raise AuthenticationFailed('The reset link is invalid.', 401)

        return super().validate(attrs)
