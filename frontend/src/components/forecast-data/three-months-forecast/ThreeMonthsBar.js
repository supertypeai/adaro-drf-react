import React from "react";
import { Column } from "@ant-design/charts";

const ThreeMonthsBar = ({ monthlyData }) => {
  const data = monthlyData.map((x) => {
    return {
      ...x,
      datetime: `${x["month"]} ${x["year"]}`,
    };
  });

  var config = {
    data: data,
    xField: "datetime",
    xAxis: {
      label: {
        style: {
          fill: "white",
        },
      },
    },
    yField: "loadable_monthly",
    seriesField: "datetime",
    color: ["#1979C9", "#D62A0D", "#FAA219"],
    legend: {
      itemName: {
        style: {
          fill: "white",
        },
      },
    },
  };

  return <Column {...config} />;
};

export default ThreeMonthsBar;
