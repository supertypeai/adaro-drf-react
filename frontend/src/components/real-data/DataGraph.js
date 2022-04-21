import React from "react";
import { Line } from "@ant-design/charts";

const DataGraph = ({ data }) => {
  var config = {
    data: data,
    padding: "auto",
    xField: "DateHour",
    xAxis: {
      tickCount: 5,
      label: {
        formatter: (d) => {
          return (
            d.split("-")[0] +
            "-" +
            d.split("-")[1] +
            "-" +
            d.split("-")[2] +
            ", Hour-" +
            d.split("-")[3]
          );
        },
        style: {
          fill: "white",
        },
      },
      title: {
        text: "Date",
        style: {
          fill: "white",
        },
      },
    },
    yField: "measurement",
    annotations: [
      {
        type: "regionFilter",
        start: ["min", "0"],
        end: ["max", "4"],
        color: "#F4664A",
      },
      {
        type: "regionFilter",
        start: ["min", "4.01"],
        end: ["max", "11.49"],
        color: "#86DC3D",
      },
      {
        type: "regionFilter",
        start: ["min", "11.5"],
        end: ["max", "max"],
        color: "#86DC3D",
      },
    ],
    yAxis: {
      minLimit: 0,
      maxLimit: 20,
      tickCount: 11,
      title: {
        text: "Measurement",
        style: {
          fill: "white",
        },
      },
    },
    tooltip: {
      fields: ["date", "hour", "measurement"],
      showTitle: false,
      formatter: (d) => {
        return {
          name: d.date + ", Hour-" + d.hour,
          value: "<b>" + d.measurement + "</b>",
        };
      },
    },
  };
  return <Line {...config} />;
};

export default DataGraph;
