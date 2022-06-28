import React from "react";
// import { Chart as ChartJS } from "chart.js/auto"; // This is needed to prevent the "category is not a registered scale" error
import { Line } from "react-chartjs-2";
import { Grid } from "antd";

const { useBreakpoint } = Grid;

const WeeklyForecastGraph = ({ loc, weeklyData }) => {
  const { md } = useBreakpoint();
  const maxTicksLimitDesktop = md ? 7 : 4;

  const weeklyForecast = weeklyData.map((x) => {
    return {
      ...x,
      DateHour: `${x["date"]}-${x["hour"]}`,
    };
  });

  let predictData = weeklyForecast.reduce(function (dataArray, row) {
    if (row.variable === "predict") {
      dataArray.push(row);
    }
    return dataArray;
  }, []);

  let low80Data = weeklyForecast.reduce(function (dataArray, row) {
    if (row.variable === "lower_80") {
      dataArray.push(row);
    }
    return dataArray;
  }, []);

  let up80Data = weeklyForecast.reduce(function (dataArray, row) {
    if (row.variable === "upper_80") {
      dataArray.push(row);
    }
    return dataArray;
  }, []);

  let low90Data = weeklyForecast.reduce(function (dataArray, row) {
    if (row.variable === "lower_90") {
      dataArray.push(row);
    }
    return dataArray;
  }, []);

  let up90Data = weeklyForecast.reduce(function (dataArray, row) {
    if (row.variable === "upper_90") {
      dataArray.push(row);
    }
    return dataArray;
  }, []);

  let low95Data = weeklyForecast.reduce(function (dataArray, row) {
    if (row.variable === "lower_95") {
      dataArray.push(row);
    }
    return dataArray;
  }, []);

  let up95Data = weeklyForecast.reduce(function (dataArray, row) {
    if (row.variable === "upper_95") {
      dataArray.push(row);
    }
    return dataArray;
  }, []);

  const data = {
    labels: (loc === 'muara_tuhup') ? (
      predictData.map((row) => {
        const year = row.DateHour.split("-")[0];
        const month = row.DateHour.split("-")[1];
        const day = row.DateHour.split("-")[2];
        const hour = row.DateHour.split("-")[3];
        return year + "-" + month + "-" + day + ", " + hour + "-Hour";
      })
    ) : (
      predictData.map((row) => {
        const year = row.DateHour.split("-")[0];
        const month = row.DateHour.split("-")[1];
        const day = row.DateHour.split("-")[2];
        return year + "-" + month + "-" + day;
      })
    )

    ,
    datasets: [
      {
        label: "Lower_80%CI",
        type: "line",
        backgroundColor: "rgb(75, 192, 255, 0.3)",
        borderColor: "transparent",
        pointRadius: 0,
        fill: false,
        tension: 0,
        data: low80Data.map((row) => row.value),
        yAxisID: "y",
        xAxisID: "x",
      },
      {
        label: "80% CI",
        type: "line",
        backgroundColor: "rgb(75, 192, 255)",
        borderColor: "rgb(75, 192, 255)",
        hoverBorderColor: "rgb(75, 192, 255)",
        pointRadius: 0,
        fill: false,
        tension: 0,
        data: predictData.map((row) => row.value),
        yAxisID: "y",
        xAxisID: "x",
      },
      {
        label: "Upper_80%CI",
        type: "line",
        backgroundColor: "rgb(75, 192, 255, 0.3)",
        borderColor: "transparent",
        pointRadius: 0,
        fill: "-2",
        tension: 0,
        data: up80Data.map((row) => row.value),
        yAxisID: "y",
        xAxisID: "x",
      },
      {
        label: "Lower_90%CI",
        type: "line",
        backgroundColor: "rgb(255, 75, 75, 0.3)",
        borderColor: "transparent",
        pointRadius: 0,
        fill: false,
        tension: 0,
        data: low90Data.map((row) => row.value),
        yAxisID: "y",
        xAxisID: "x",
      },
      {
        label: "90% CI",
        type: "line",
        backgroundColor: "rgb(255, 75, 75)",
        borderColor: "rgb(255, 75, 75)",
        hoverBorderColor: "rgb(255, 75, 75)",
        pointRadius: 0,
        fill: false,
        tension: 0,
        data: predictData.map((row) => row.value),
        yAxisID: "y",
        xAxisID: "x",
      },
      {
        label: "Upper_90%CI",
        type: "line",
        backgroundColor: "rgb(255, 75, 75, 0.3)",
        borderColor: "transparent",
        pointRadius: 0,
        fill: "-2",
        tension: 0,
        data: up90Data.map((row) => row.value),
        yAxisID: "y",
        xAxisID: "x",
      },
      {
        label: "Lower_95%CI",
        type: "line",
        backgroundColor: "rgb(255, 246, 75, 0.3)",
        borderColor: "transparent",
        pointRadius: 0,
        fill: false,
        tension: 0,
        data: low95Data.map((row) => row.value),
        yAxisID: "y",
        xAxisID: "x",
      },
      {
        label: "95% CI",
        type: "line",
        backgroundColor: "rgb(255, 246, 75)",
        borderColor: "rgb(255, 246, 75)",
        hoverBorderColor: "rgb(255, 246, 75)",
        pointRadius: 0,
        fill: false,
        tension: 0,
        data: predictData.map((row) => row.value),
        yAxisID: "y",
        xAxisID: "x",
      },
      {
        label: "Upper_95%CI",
        type: "line",
        backgroundColor: "rgb(255, 246, 75, 0.3)",
        borderColor: "transparent",
        pointRadius: 0,
        fill: "-2",
        tension: 0,
        data: up95Data.map((row) => row.value),
        yAxisID: "y",
        xAxisID: "x",
      },
    ],
  };

  const options = {
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: true,
        position: "top",
        labels: {
          filter: function (item, chart) {
            return !item.text.includes("_");
          },
          color: "white",
        },
        onClick: function (e, legendItem, legend) {
          // need to hide index -1 and index +1
          const index = legendItem.datasetIndex;
          const ci = legend.chart;

          const alreadyHidden =
            ci.getDatasetMeta(index).hidden === null
              ? false
              : ci.getDatasetMeta(index).hidden;
          const meta_lo = ci.getDatasetMeta(index - 1);
          const meta = ci.getDatasetMeta(index);
          const meta_hi = ci.getDatasetMeta(index + 1);
          if (!alreadyHidden) {
            meta_lo.hidden = true;
            meta.hidden = true;
            meta_hi.hidden = true;
          } else {
            meta_lo.hidden = null;
            meta.hidden = null;
            meta_hi.hidden = null;
          }

          ci.update();
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
      hover: {
        mode: "nearest",
        intersect: false,
      },
    },
    scales: {
      x: {
        ticks: {
          maxTicksLimit: maxTicksLimitDesktop,
          color: "white",
          maxRotation: 0,
          minRotation: 0,
          padding: 10,
        },
        grid: {
          display: true,
          color: "#ababab",
        },
      },
      y: {
        ticks: {
          color: "white",
        },
        grid: {
          display: true,
          color: "#ababab",
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default WeeklyForecastGraph;
