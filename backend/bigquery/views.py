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
    [
        IsAuthenticated,
    ]
)
@csrf_exempt
def getV3TuhupForecastData(request):
    client = bigquery.Client()

    if request.method == "POST":
        loc_requested = json.loads(request.body)
        if loc_requested == "muara_tuhup":
            try:
                # Get v3 forecast data with performance metrics and weather data
                table_id = "adaro-data-warehouse.muara_tuhup_forecasts_v3.detailed_forecast_and_weather"
                query_string = f"""
                    SELECT 
                        Date,
                        Hour,
                        Actual,
                        Actual_Rain,
                        Pred_1d,
                        Pred_2d,
                        Pred_3d,
                        Rain_Forecast_1d,
                        Rain_Forecast_2d,
                        Rain_Forecast_3d,
                        CONCAT(Date, '-', LPAD(CAST(Hour AS STRING), 2, '0')) AS DateHour
                    FROM `{table_id}`
                    WHERE PARSE_DATE('%Y-%m-%d', Date) >= DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY)
                      AND PARSE_DATE('%Y-%m-%d', Date) <= DATE_ADD(CURRENT_DATE(), INTERVAL 10 DAY)
                    ORDER BY Date ASC, Hour ASC
                """

                query_job = client.query(query_string)

                # Convert query results to list of dictionaries without pandas
                forecast_data = []
                wide_data = []

                for row in query_job:
                    row_dict = dict(row)

                    # Add to wide format data (for table display with performance metrics)
                    wide_record = {
                        "date": row_dict.get("Date"),
                        "hour": row_dict.get("Hour"),
                        "actual": row_dict.get("Actual"),
                        "actual_rain": row_dict.get("Actual_Rain"),
                        "pred_1d": row_dict.get("Pred_1d"),
                        "pred_2d": row_dict.get("Pred_2d"),
                        "pred_3d": row_dict.get("Pred_3d"),
                        "rain_forecast_1d": row_dict.get("Rain_Forecast_1d"),
                        "rain_forecast_2d": row_dict.get("Rain_Forecast_2d"),
                        "rain_forecast_3d": row_dict.get("Rain_Forecast_3d"),
                        "DateHour": row_dict.get("DateHour"),
                    }

                    # Calculate accuracy metrics if actual value exists
                    if row_dict.get("Actual") is not None:
                        actual_val = float(row_dict.get("Actual"))

                        # Calculate differences for performance measurement
                        if row_dict.get("Pred_1d") is not None:
                            wide_record["diff_1d"] = abs(
                                actual_val - float(row_dict.get("Pred_1d"))
                            )
                        if row_dict.get("Pred_2d") is not None:
                            wide_record["diff_2d"] = abs(
                                actual_val - float(row_dict.get("Pred_2d"))
                            )
                        if row_dict.get("Pred_3d") is not None:
                            wide_record["diff_3d"] = abs(
                                actual_val - float(row_dict.get("Pred_3d"))
                            )

                    wide_data.append(wide_record)

                    # Create melted format records for graph visualization
                    for key, value in row_dict.items():
                        if (
                            key not in ["Date", "Hour", "DateHour"]
                            and value is not None
                        ):
                            forecast_data.append(
                                {
                                    "date": row_dict.get("Date"),
                                    "hour": row_dict.get("Hour"),
                                    "variable": key,
                                    "value": value,
                                }
                            )

                return JsonResponse(
                    {
                        "response": "success",
                        "data": forecast_data,
                        "data_wide": wide_data,
                        "version": "v3",
                    },
                    safe=False,
                )

            except Exception as e:
                return JsonResponse(
                    {
                        "response": "error",
                        "message": f"Failed to fetch v3 forecast data: {str(e)}",
                    },
                    status=500,
                )

        else:
            return JsonResponse({"response": "location not found"})


@api_view(["POST"])
@permission_classes(
    [
        IsAuthenticated,
    ]
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
            ][-4:]

            mt_forecast_list = []

            for day in mt_one_week_forecast:
                query_string = f"""
                    SELECT *
                    FROM `adaro-data-warehouse.muara_tuhup_forecasts.{day}`
                """

                forecast_query_result = client.query(query_string).result()

                records = [dict(row) for row in forecast_query_result]
                mt_forecast_list.extend(records)

                # mt_forecast_list = sorted(
                #     mt_forecast_list,
                #     key=lambda x: (x["date"], (float(x["hour"]) - 6) % 24),
                # )

                mt_forecast_df = pd.DataFrame(mt_forecast_list).tail(72)

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

                forecast_list = sorted(
                    forecast_list,
                    key=lambda x: (x["date"]),
                )

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
    [
        IsAuthenticated,
    ]
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
            df["measurement"] = df["measurement"]
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
    [
        IsAuthenticated,
    ]
)
@authentication_classes([TokenAuthentication])
@csrf_exempt
def listSensorData(request):
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
    [
        IsAuthenticated,
    ]
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
            SELECT
            measurement,
            power_supply_status,
            battery_status,
            solar_panel_status,
            electricity_status,
            CAST(TIMESTAMP(CONCAT(CAST(year AS STRING), '-', CAST(month AS STRING), '-', CAST(day AS STRING), ' ',
                                CAST(hour AS STRING), ':', CAST(minute AS STRING), ':', CAST(second AS STRING))) AS STRING) AS datetime
            FROM `{table_id}`
            ORDER BY TIMESTAMP(datetime) DESC
            LIMIT 1;

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
    [
        IsAuthenticated,
    ]
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
            WITH ordered_data AS (
                SELECT 
                    measurement,
                    CONCAT(CAST(year AS STRING), '-', LPAD(CAST(month AS STRING), 2, '0'), '-', LPAD(CAST(day AS STRING), 2, '0')) AS date,
                    hour,
                    minute,
                    second,
                    TIMESTAMP(CONCAT(CAST(year AS STRING), '-', LPAD(CAST(month AS STRING), 2, '0'), '-', LPAD(CAST(day AS STRING), 2, '0'), ' ', 
                        LPAD(CAST(hour AS STRING), 2, '0'), ':', LPAD(CAST(minute AS STRING), 2, '0'), ':', LPAD(CAST(second AS STRING), 2, '0'))) AS constructed_timestamp,
                    ROW_NUMBER() OVER (PARTITION BY year, month, day, hour ORDER BY year, month, day, hour, minute, second) AS rn
                FROM `{table_id}`
                WHERE power_supply_status = 1
                AND battery_status = 1
                AND solar_panel_status = 1
                AND electricity_status = 1
            )
            SELECT 
                measurement,
                date,
                hour,
                minute,
                second,
                constructed_timestamp
            FROM ordered_data
            WHERE rn = 1
            ORDER BY constructed_timestamp DESC
            LIMIT 5000
        """

        try:
            query_job = client.query(query_string)
            id = 0
            data = []
            chart_data = []
            for row in query_job:
                record = {
                    "id": id,
                    "measurement": row["measurement"],
                    "date": row["date"],
                    "hour": row["hour"],
                    "minute": row["minute"],
                    "second": row["second"],
                }

                id += 1

                chart_record = {
                    "measurement": row["measurement"],
                    "date": row["date"],
                    "hour": row["hour"],
                }
                data.append(record)
                chart_data.append(chart_record)

            return JsonResponse(
                {"response": "success", "table_data": data, "chart_data": chart_data}
            )
        except Exception as e:
            return Response(
                {"response": "invalid location requested"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # query_string = f"""
        #     SELECT *
        #     FROM `{table_id}`
        # """

        # try:
        #     query_job = client.query(query_string).result()
        #     df = pd.DataFrame([dict(row) for row in query_job])
        #     temp = df.copy()
        #     temp[["year", "month", "day", "hour", "minute", "second"]] = temp[
        #         ["year", "month", "day", "hour", "minute", "second"]
        #     ].astype(str)
        #     df["timestamp"] = pd.to_datetime(
        #         temp["year"]
        #         + "-"
        #         + temp["month"]
        #         + "-"
        #         + temp["day"]
        #         + " "
        #         + temp["hour"]
        #         + ":"
        #         + temp["minute"]
        #         + ":"
        #         + temp["second"]
        #     )
        #     df["date"] = pd.to_datetime(
        #         temp["year"] + "-" + temp["month"] + "-" + temp["day"]
        #     )
        #     df = df.sort_values(by="timestamp", ascending=False).reset_index(drop=True)
        #     df = df[df["power_supply_status"] == 1]
        #     df = df[df["battery_status"] == 1]
        #     df = df[df["solar_panel_status"] == 1]
        #     df = df[df["electricity_status"] == 1]
        #     df = df[["measurement", "date", "hour", "minute", "second"]]
        #     df["date"] = df["date"].dt.strftime("%Y-%m-%d")
        #     df = df.drop_duplicates(subset=["date", "hour"], keep="first")
        #     df = df.reset_index()
        #     df = df.rename(columns={"index": "id"})
        #     df = df.head(5000)

        #     copy_df = df.copy()
        #     copy_df = copy_df[["date", "hour", "measurement"]]

        #     return JsonResponse(
        #         {
        #             "response": "success",
        #             "table_data": df.to_json(orient="records"),
        #             "chart_data": copy_df.to_json(orient="records"),
        #         }
        #     )

        # except:
        #     return Response(
        #         {"response": "invalid location requested"},
        #         status=status.HTTP_400_BAD_REQUEST,
        #     )
