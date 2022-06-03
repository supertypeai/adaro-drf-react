import React, { useState, useEffect } from "react";
import { Skeleton, Typography, Space, Divider } from "antd";

import APIService from "../../APIService";
import WeeklyForecastGraph from "./weekly-forecast/WeeklyForecastGraph";
import ThreeMonthsBar from "./three-months-forecast/ThreeMonthsBar";
import ThreeMonthsPie from "./three-months-forecast/ThreeMonthsPie";
import ThreeMonthsCount from "./three-months-forecast/ThreeMonthsCount";
import WeeklyTableModal from "./weekly-forecast/WeeklyTableModal";

import "./ForecastComponent.css";

const { Title } = Typography;

const ForecastComponent = ({ loc }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [tableWeeklyData, setTableWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (loc !== "loading") {
      APIService.getForecastData(loc)
        .then((resp) => {
          if (resp.response === "success") {
            setWeeklyData(JSON.parse(resp.data));
            setTableWeeklyData(JSON.parse(resp.data_wide));
            setMonthlyData(JSON.parse(resp.monthly_data));
          } else if (resp.response === "empty") {
            setWeeklyData([]);
          }
        })
        .then(() => setIsLoading(false));
    }
  }, [loc]);

  return (
    <>
      {isLoading ? (
        <Skeleton active />
      ) : weeklyData.length > 0 ? (
        <Space
          direction="vertical"
          size="large"
          style={{ width: "100%", marginBottom: "24px" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Title level={2}>Weekly Forecast</Title>
            <WeeklyForecastGraph weeklyData={weeklyData} />
            <br />
            <WeeklyTableModal tableWeeklyData={tableWeeklyData} />
          </div>
          {loc === "muara_tuhup" ? (
            <>
              <Divider />
              <Title level={2}>Three Months Forecast</Title>
              <div className="three-months-forecast-wrapper container">
                <div className="three-months-left">
                  <ThreeMonthsPie monthlyData={monthlyData} />
                </div>
                <div className="three-months-right">
                  <ThreeMonthsCount monthlyData={monthlyData} />
                  <ThreeMonthsBar monthlyData={monthlyData} />
                </div>
              </div>
            </>
          ) : null}
        </Space>
      ) : (
        <Title>No Forecast Data Yet</Title>
      )}
    </>
  );
};

export default ForecastComponent;
