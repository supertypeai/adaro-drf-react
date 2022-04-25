from rest_framework.decorators import api_view
from rest_framework.response import Response

from django.http import JsonResponse
from google.cloud import bigquery
from pandas import DataFrame
import json

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


# GET BIGQUERY FORECAST DATA
def sail_status(row):
    if (row['predict'] >= 19.51) & (row['predict'] <= 26.5):
        status = ['Maximum']
    elif (row['predict'] >= 18.61) & (row['predict'] <= 19.5):
        status = ['Reduced']
    elif (row['predict'] >= 17.51) & (row['predict'] <= 18.6):
        status = ['Warning']
    else:
        status = ['Not Sailable']
    return status


def getForecastData(request):
    client = bigquery.Client()

    if request.method == 'POST':
        loc_requested = json.loads(request.body)
        return loc_requested

    # mt_forecast_dataset = "adaro-data-warehouse.muara_tuhup_prediction_new_deployment_test"
    # mt_one_week_forecast = [
    #     table.table_id for table in client.list_tables(mt_forecast_dataset)][-7:]

    # mt_forecast_list = []

    # for day in mt_one_week_forecast:
    #     query_string = f"""
    #             SELECT *
    #             FROM `adaro-data-warehouse.muara_tuhup_prediction_new_deployment_test.{day}`
    #         """

    #     forecast_query = (
    #         client.query(query_string)
    #         .result()
    #     )

    #     records = [dict(row) for row in forecast_query]
    #     mt_forecast_list.extend(records)

    #     # SORT THE HOUR ACCORDING TO ADARO'S BUSINESS HOUR
    # mt_forecast_list = sorted(mt_forecast_list, key=lambda x: (
    #     x["date"], (float(x["hour"]) - 6) % 24))

    # mt_forecast_df = DataFrame(mt_forecast_list)

    # # Turn dataframe to long format
    # mt_forecast_df_melted = mt_forecast_df.melt(id_vars=['date', 'hour'])
    # mt_forecast_json = mt_forecast_df_melted.to_json(orient='records')

    # mt_forecast_wide = mt_forecast_df[['date', 'hour', 'predict']]

    # mt_forecast_wide['Status'] = mt_forecast_wide.apply(
    #     lambda row: sail_status(row), axis=1)

    # mt_forecast_wide_json = mt_forecast_wide.to_json(orient="records")

    # return True
