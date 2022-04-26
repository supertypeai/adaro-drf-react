import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Skeleton, Table, Grid, Typography, Space } from "antd";

import APIService from "../../APIService";
import WeeklyForecastGraph from "./WeeklyForecastGraph";

const { Title } = Typography;

const ForecastComponent = ({ loc }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { pathname } = useLocation();

  useEffect(() => {
    setIsLoading(true);
    APIService.getForecastData(loc)
      .then((resp) => {
        if (resp.response === "success") {
          setWeeklyData(JSON.parse(resp.data));
          setMonthlyData(JSON.parse(resp.data_wide));
        } else if (resp.response === "empty") {
          setWeeklyData([]);
        }
      })
      .then(() => setIsLoading(false));
  }, [pathname]);

  return (
    <>
      {isLoading ? (
        <Skeleton active />
      ) : weeklyData.length > 0 ? (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <>
            <Title level={2}>Weekly Forecast</Title>
            <WeeklyForecastGraph weeklyData={weeklyData} />
          </>
          {loc === "muara_tuhup" ? (
            <>
              <Title level={2}>Three Months Forecast</Title>
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
