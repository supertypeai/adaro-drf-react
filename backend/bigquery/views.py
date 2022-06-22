from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.shortcuts import HttpResponse

from google.cloud import bigquery

from pandas import DataFrame
import json


def sail_status(row):
    if (row["predict"] >= 19.51) & (row["predict"] <= 26.5):
        status = ["Maximum"]
    elif (row["predict"] >= 18.61) & (row["predict"] <= 19.5):
        status = ["Reduced"]
    elif (row["predict"] >= 17.51) & (row["predict"] <= 18.6):
        status = ["Warning"]
    else:
        status = ["Not Sailable"]
    return status


@authentication_classes(
    [TokenAuthentication, ]
)
@permission_classes(
    [IsAuthenticated, ]
)
@api_view(["POST"])
@csrf_exempt
def getForecastData(request):
    client = bigquery.Client()

    if request.method == "POST":
        loc_requested = json.loads(request.body)
        # if loc_requested == "muara_tuhup":

        # Weekly Forecast Data
        mt_forecast_dataset = (
            "adaro-data-warehouse.muara_tuhup_prediction_new_deployment_test"
        )
        mt_one_week_forecast = [
            table.table_id for table in client.list_tables(mt_forecast_dataset)
        ][-7:]

        mt_forecast_list = []

        for day in mt_one_week_forecast:
            query_string = f"""
                SELECT *
                FROM `adaro-data-warehouse.muara_tuhup_prediction_new_deployment_test.{day}`
            """

            forecast_query_result = client.query(query_string).result()

            records = [dict(row) for row in forecast_query_result]
            mt_forecast_list.extend(records)

            mt_forecast_list = sorted(
                mt_forecast_list,
                key=lambda x: (x["date"], (float(x["hour"]) - 6) % 24),
            )

            mt_forecast_df = DataFrame(mt_forecast_list)

            # Turn dataframe to long format
            mt_forecast_df_melted = mt_forecast_df.melt(
                id_vars=["date", "hour"])
            mt_forecast_json = mt_forecast_df_melted.to_json(
                orient="records")

            mt_forecast_wide = mt_forecast_df[["date", "hour", "predict"]]

            mt_forecast_wide["Status"] = mt_forecast_wide.apply(
                lambda row: sail_status(row), axis=1
            )

            mt_forecast_wide_json = mt_forecast_wide.to_json(
                orient="records")

            # Monthly Forecast Data
            table_id = "adaro-data-warehouse.muara_tuhup_loadabledays_forecast.forecast_loadabledays"
            query_string = f"""
                SELECT *
                FROM `{table_id}`
            """
            query_job = client.query(query_string).result()

            query_result = DataFrame([dict(row) for row in query_job]).sort_values(
                ["year", "month"], ascending=True
            )
            mt_monthly_forecast = query_result.tail(
                3).to_json(orient="records")

            return JsonResponse(
                {
                    "response": "success",
                    "data": mt_forecast_json,
                    "data_wide": mt_forecast_wide_json,
                    "monthly_data": mt_monthly_forecast,
                }
            )

        # else:  # Insert other locations' forecast here!
        #     return JsonResponse({"response": "empty"})
