import React from "react";
import { Pie } from "@ant-design/charts";

const ThreeMonthsPie = ({ loadableData }) => {

  const sailable = Object.values(loadableData).reduce((a, b) => a + b, 0);
  const nonSailable = 93 - sailable;

  const data = [
    { category: "Sailable", value: sailable },
    { category: "Non-Sailable", value: nonSailable },
  ];

  const config = {
    height: 500,
    padding: 30,
    data,
    angleField: "value",
    colorField: "category",
    radius: 1,
    innerRadius: 0.6,
    legend: {
      position: "top",
      itemName: {
        style: {
          fill: "white",
        },
      },
    },
    label: {
      type: "inner",
      offset: "-50%",
      content: "{value}",
      style: {
        textAlign: "center",
        fontSize: 14,
      },
      autoRotate: false,
    },
    interactions: [
      {
        type: "element-selected",
      },
      {
        type: "element-active",
      },
    ],
    statistic: {
      title: {
        content: `No. of Sailable Days`,
        style: {
          color: "white",
          paddingBottom: "0.5em",
          fontSize: 16,
        },
      },
      content: {
        style: {
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: "white",
          textAlign: "center",
        },
        content: `${sailable}`,
      },
    },
  };

  return <Pie {...config} />;
};

export default ThreeMonthsPie;
