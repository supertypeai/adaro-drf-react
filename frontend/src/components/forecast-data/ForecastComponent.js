import React, { useState, useEffect } from "react";
import { Skeleton, Typography, Space, Divider } from "antd";
import { useLogin } from "../../contexts/UserContext";

import APIService from "../../APIService";
import WeeklyForecastGraph from "./weekly-forecast/WeeklyForecastGraph";
import ThreeMonthsBar from "./three-months-forecast/ThreeMonthsBar";
import ThreeMonthsPie from "./three-months-forecast/ThreeMonthsPie";
import ThreeMonthsCount from "./three-months-forecast/ThreeMonthsCount";
import ThreeMonthsTable from "./three-months-forecast/ThreeMonthsTable";
import WeeklyTableModal from "./weekly-forecast/WeeklyTableModal";

import "./ForecastComponent.css";

const { Title } = Typography;

const ForecastComponent = ({ loc }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [tableWeeklyData, setTableWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loadableData, setLoadableData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { authTokens } = useLogin();

  useEffect(() => {
    setIsLoading(true);
    if (loc !== "loading") {
      APIService.getForecastData(loc, authTokens.access)
        .then((resp) => {
          if (resp.response === "success") {
            setWeeklyData(JSON.parse(resp.data));
            setTableWeeklyData(JSON.parse(resp.data_wide));
            if (loc === 'muara_tuhup') {
              setMonthlyData(JSON.parse(resp.monthly_data));
              setLoadableData(JSON.parse(resp.three_months_loadable))
            }
          } else if (resp.response === "empty") {
            setWeeklyData([]);
          }
        })
        .then(() => setIsLoading(false));
    }
  }, [loc, authTokens]);

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
            <WeeklyForecastGraph loc={loc} weeklyData={weeklyData} />
            <br />
            <WeeklyTableModal tableWeeklyData={tableWeeklyData} />
          </div>
          {loc === "muara_tuhup" ? (
            <>
              <Divider />
              <Title level={2}>Three Months Forecast</Title>
              <div className="three-months-forecast-wrapper">
                <div className="three-months-left">
                  <ThreeMonthsPie loadableData={loadableData} />
                </div>
                <div className="three-months-right">
                  <ThreeMonthsCount loadableData={loadableData} />
                  <ThreeMonthsBar loadableData={loadableData} />
                </div>
              </div>
              <div>
                <ThreeMonthsTable monthlyData={monthlyData} />
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
