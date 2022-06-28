from rest_framework import viewsets, status
from rest_framework import generics
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from django.shortcuts import HttpResponse, get_object_or_404
from django.core.mail import send_mail
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import smart_str, force_str, smart_bytes, DjangoUnicodeDecodeError
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from .models import Location, LocationData
from .serializers import (
    LocationSerializer,
    LocationDataSerializer,
    UserSerializer,
    MyTokenObtainPairSerializer,
    ResetPasswordEmailRequestSerializer,
    SetNewPasswordSerializer,
)


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


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class LocationListView(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer

    permission_classes = [IsAuthenticated]


@api_view(["GET", "POST"])
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


# class UserView(viewsets.ModelViewSet):
#     queryset = User.objects.all()
#     serializer_class = UserSerializer


class UserView(viewsets.ViewSet):
    def list(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def create(self, request):
        raw_password = User.objects.make_random_password()
        print(raw_password)
        request.data["password"] = raw_password
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            send_mail(
                "Account Successfully Created",
                f"""
You have created a new account for the ADARO Web App - Barito River
Your login details are as follows:

Username: {request.data['username']}
Password: {raw_password}

Note: The password above is randomly generated. Do change it to your personal password on the homepage where you can find a "Change Password" option.
*Email is auto-generated. Please do not reply.
                """,
                "adaro@supertype.ai",
                [request.data["email"]],
            )
            print("mail sent")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, pk=None):
        queryset = User.objects.all()
        user = get_object_or_404(queryset, pk=pk)
        serializer = UserSerializer(user)
        return Response(serializer.data)

    # def update(self, request, pk=None):
    #     queryset = User.objects.all()
    #     user = get_object_or_404(queryset, pk=pk)
    #     serializer = UserSerializer(user, data=request.data, context={"id": pk})
    #     if serializer.is_valid():
    #         serializer.save()
    #         return Response(serializer.data)
    #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        queryset = User.objects.all()
        user = get_object_or_404(queryset, pk=pk)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RequestPasswordResetEmail(generics.GenericAPIView):
    serializer_class = ResetPasswordEmailRequestSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)

        email = request.data['email']

        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            uidb64 = urlsafe_base64_encode(smart_bytes(user.id))
            print("this is the encoding: ", uidb64)
            token = PasswordResetTokenGenerator().make_token(user)
            print("token: ", token)

            send_mail(
                "Password Reset Request",
                f"""
Hello, use the credentials provided below to set your new password!

Your User ID: {uidb64}
Your Token: {token}

Note: Do not share the link above with anyone!
                """,
                "adaro@supertype.ai",
                [email],
            )

        return Response({"success": "We have sent you a link to reset your password."}, status=status.HTTP_200_OK)


class PasswordTokenCheckAPI(generics.GenericAPIView):
    def get(self, request, uidb64, token):
        try:
            id = smart_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=id)

            if not PasswordResetTokenGenerator().check_token(user, token):
                return Response({'error': "Token is not valid, please request a new one."}, status=status.HTTP_401_UNAUTHORIZED)

            return Response({
                'success': True,
                'message': 'Credentials Valid',
                "uidb64": uidb64,
                "token": token
            }, status=status.HTTP_200_OK)

        except DjangoUnicodeDecodeError as identifier:
            if not PasswordResetTokenGenerator().check_token(user, token):
                return Response({'error': 'Token is not valid, please request a new one.'}, status=status.HTTP_401_UNAUTHORIZED)


class SetNewPasswordAPIView(generics.GenericAPIView):
    serializer_class = SetNewPasswordSerializer

    def patch(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        return Response(
            {'success': True, 'message': "Password has been reset successfully"},
            status=status.HTTP_200_OK
        )
