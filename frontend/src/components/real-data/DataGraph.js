import React from "react";
import { Line } from "@ant-design/charts";

const DataGraph = ({ data, loc }) => {
  // Ascending order of date
  const dataY = [...data].sort(function (a, b) {
    return a.date.localeCompare(b.date) || parseInt(a.hour) - parseInt(b.hour);
  });
  let minY = Math.min.apply(Math, dataY.map(function (val) { return val.measurement; }));
  let maxY = Math.max.apply(Math, dataY.map(function (val) { return val.measurement; }));

  var config = {
    data: dataY,
    padding: "auto",
    xField: "DateHour",
    xAxis: {
      tickCount: 5,
      label: {
        formatter: (d) => {
          const dateOnly =
            d.split("-")[0] + "-" + d.split("-")[1] + "-" + d.split("-")[2];

          const withHour =
            d.split("-")[0] +
            "-" +
            d.split("-")[1] +
            "-" +
            d.split("-")[2] +
            ", Hour-" +
            d.split("-")[3];

          const format =
            loc === "muara_teweh" || loc === "tarusan" ? dateOnly : withHour;

          return format;
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
        color: loc === "muara_teweh" ? "#F4664A" : "#86DC3D",
      },
    ],
    yAxis: {
      minLimit: (minY - 3) < 0 ? 0 : Math.round(minY - 2),
      maxLimit: Math.round(maxY + 3),
      // tickCount: 11,
      tickInterval: 2,
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
    smooth: true,
  };
  return <Line {...config} />;
};

export default DataGraph;
