import re
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.shortcuts import HttpResponse

from google.cloud import bigquery

import calendar
from datetime import datetime
import pandas as pd
import pandas_gbq
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


@api_view(["POST"])
@permission_classes(
    [IsAuthenticated,]
)
@csrf_exempt
def getForecastData(request):
    client = bigquery.Client()

    if request.method == "POST":
        loc_requested = json.loads(request.body)
        if loc_requested == "muara_tuhup":

            # Weekly Forecast Data
            mt_forecast_dataset = "adaro-data-warehouse.muara_tuhup_forecasts"
            mt_one_week_forecast = [
                table.table_id for table in client.list_tables(mt_forecast_dataset)
            ][-3:]

            mt_forecast_list = []

            for day in mt_one_week_forecast:
                query_string = f"""
                    SELECT *
                    FROM `adaro-data-warehouse.muara_tuhup_forecasts.{day}`
                """

                forecast_query_result = client.query(query_string).result()

                records = [dict(row) for row in forecast_query_result]
                mt_forecast_list.extend(records)

                mt_forecast_list = sorted(
                    mt_forecast_list,
                    key=lambda x: (x["date"], (float(x["hour"]) - 6) % 24),
                )

                mt_forecast_df = pd.DataFrame(mt_forecast_list)

                # Turn dataframe to long format
                mt_forecast_df_melted = mt_forecast_df.melt(id_vars=["date", "hour"])
                mt_forecast_json = mt_forecast_df_melted.to_json(orient="records")

                mt_forecast_wide = mt_forecast_df[["date", "hour", "predict"]]

                mt_forecast_wide["Status"] = mt_forecast_wide.apply(
                    lambda row: sail_status(row), axis=1
                )

                mt_forecast_wide_json = mt_forecast_wide.to_json(orient="records")

            # Monthly Forecast Data
            table_id = "adaro-data-warehouse.muara_tuhup_loadabledays_forecast.loadable_days_forecast"
            query_string = f"""
                SELECT *
                FROM `{table_id}`
            """
            query_job = client.query(query_string).result()

            query_result = pd.DataFrame([dict(row) for row in query_job]).sort_values(
                ["year"], ascending=True
            )
            query_result.index = query_result["year"]
            query_result.drop("year", axis=1, inplace=True)

            mt_monthly_forecast = query_result.to_json(orient="index")

            three_months_loadable = {}

            target_months = [
                datetime.now().month,
                datetime.now().month + 1,
                datetime.now().month + 2,
            ]

            for month in target_months:
                if month <= 12:
                    three_months_loadable[
                        f"{calendar.month_name[month]} {datetime.now().year}"
                    ] = query_result.loc[
                        f"Predicted {datetime.now().year}", calendar.month_name[month]
                    ]
                else:
                    if f"Predicted {datetime.now().year + 1}" in query_result.index:
                        three_months_loadable[
                            f"{calendar.month_name[month - 12]} {datetime.now().year+1}"
                        ] = query_result.loc[
                            f"Predicted {datetime.now().year+1}",
                            calendar.month_name[month - 12],
                        ]
                    else:
                        three_months_loadable[
                            f"{calendar.month_name[month - 12]} {datetime.now().year+1}"
                        ] = None
            return JsonResponse(
                {
                    "response": "success",
                    "data": mt_forecast_json,
                    "data_wide": mt_forecast_wide_json,
                    "monthly_data": mt_monthly_forecast,
                    "three_months_loadable": json.dumps(three_months_loadable),
                }
            )

        else:
            forecast_dataset = f"adaro-data-warehouse.{loc_requested}_forecasts"
            try:
                one_week_forecast = [
                    table.table_id for table in client.list_tables(forecast_dataset)
                ][-3:]
            except:
                return JsonResponse({"response": "empty"})
            forecast_list = []
            for day in one_week_forecast:
                query_string = f"""
                    SELECT *
                    FROM `adaro-data-warehouse.{loc_requested}_forecasts.{day}`
                """

                forecast_query_result = client.query(query_string).result()

                records = [dict(row) for row in forecast_query_result]
                forecast_list.extend(records)

                forecast_list = sorted(forecast_list, key=lambda x: (x["date"]),)

                forecast_df = pd.DataFrame(forecast_list)

                # Turn dataframe to long format
                forecast_df_melted = forecast_df.melt(id_vars=["date"])
                forecast_json = forecast_df_melted.to_json(orient="records")

                forecast_wide = forecast_df[["date", "predict"]]

                forecast_wide["Status"] = forecast_wide.apply(
                    lambda row: sail_status(row), axis=1
                )

                forecast_wide_json = forecast_wide.to_json(orient="records")

            return JsonResponse(
                {
                    "response": "success",
                    "data": forecast_json,
                    "data_wide": forecast_wide_json,
                }
            )


@api_view(["POST"])
@permission_classes(
    [IsAuthenticated,]
)
@authentication_classes([TokenAuthentication])
@csrf_exempt
def postSensorData(request):
    client = bigquery.Client()

    if request.method == "POST":
        if len(request.body) == 0:
            return Response(
                {"status": "missing parameter"}, status=status.HTTP_400_BAD_REQUEST
            )
        body = json.loads(request.body)
        if set(body.keys()) != {"location", "rows"}:
            return Response(
                {"status": "invalid or missing fields are provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if set(body["rows"][0].keys()) != {
            "measurement",
            "power_supply_status",
            "battery_status",
            "solar_panel_status",
            "electricity_status",
            "month",
            "day",
            "year",
            "minute",
            "hour",
            "second",
        }:
            return Response(
                {"status": "invalid or missing schema in rows are provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            df = pd.DataFrame(body["rows"])
            df["measurement"] = df["measurement"] + 14.2
            pandas_gbq.to_gbq(
                dataframe=df,
                destination_table=f"adaro-data-warehouse.{body['location']}_sensor.{body['location']}_sensor",
                project_id="adaro-data-warehouse",
                location="asia-southeast2",
                if_exists="append",
                # api_method="load_csv",
            )
            return JsonResponse(
                {"response": f"success in inserting {len(body['rows'])} rows"}
            )
        except:
            return Response(
                {"response": "failed to insert rows"},
                status=status.HTTP_400_BAD_REQUEST,
            )


@api_view(["POST"])
@permission_classes(
    [IsAuthenticated,]
)
@authentication_classes([TokenAuthentication])
@csrf_exempt
def getSensorData(request):
    client = bigquery.Client()

    if request.method == "POST":
        if len(request.body) == 0:
            return Response(
                {"status": "missing parameter"}, status=status.HTTP_400_BAD_REQUEST
            )
        body = json.loads(request.body)
        if set(body.keys()) != {"location"}:
            return Response(
                {"status": "invalid or missing fields are provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        table_id = (
            f"adaro-data-warehouse.{body['location']}_sensor.{body['location']}_sensor"
        )
        query_string = f"""
            SELECT *
            FROM `{table_id}`
        """

        try:
            query_job = client.query(query_string).result()

            query_result = pd.DataFrame([dict(row) for row in query_job])

            return JsonResponse(
                {"response": "success", "data": query_result.to_json(orient="index")}
            )
        except:
            return Response(
                {"response": "invalid location requested"},
                status=status.HTTP_400_BAD_REQUEST,
            )


@api_view(["POST"])
@permission_classes(
    [IsAuthenticated,]
)
@csrf_exempt
def getDataForFrontEnd(request):
    client = bigquery.Client()

    if request.method == "POST":
        if len(request.body) == 0:
            return Response(
                {"status": "missing parameter"}, status=status.HTTP_400_BAD_REQUEST
            )
        body = json.loads(request.body)
        if set(body.keys()) != {"location"}:
            return Response(
                {"status": "invalid or missing fields are provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        table_id = (
            f"adaro-data-warehouse.{body['location']}_sensor.{body['location']}_sensor"
        )
        query_string = f"""
            SELECT *
            FROM `{table_id}`
        """

        try:
            query_job = client.query(query_string).result()
            df = pd.DataFrame([dict(row) for row in query_job])
            temp = df.copy()
            temp[["year", "month", "day", "hour", "minute", "second"]] = temp[
                ["year", "month", "day", "hour", "minute", "second"]
            ].astype(str)
            df["timestamp"] = pd.to_datetime(
                temp["year"]
                + "-"
                + temp["month"]
                + "-"
                + temp["day"]
                + " "
                + temp["hour"]
                + ":"
                + temp["minute"]
                + ":"
                + temp["second"]
            )
            df["date"] = pd.to_datetime(
                temp["year"] + "-" + temp["month"] + "-" + temp["day"]
            )
            df = df.sort_values(by="timestamp", ascending=False).reset_index(drop=True)
            df = df.head(20000)
            df = df[df["power_supply_status"] == 1]
            df = df[df["battery_status"] == 1]
            df = df[df["solar_panel_status"] == 1]
            df = df[df["electricity_status"] == 1]
            df = df[["measurement", "date", "hour", "minute", "second"]]
            df["date"] = df["date"].dt.strftime("%Y-%m-%d")

            return JsonResponse(
                {"response": "success", "data": df.to_json(orient="records")}
            )

        except:
            return Response(
                {"response": "invalid location requested"},
                status=status.HTTP_400_BAD_REQUEST,
            )
