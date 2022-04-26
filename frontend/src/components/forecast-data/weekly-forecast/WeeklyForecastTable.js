import React from "react";
import { Table, Tag } from "antd";

const WeeklyForecastTable = ({ tableWeeklyData }) => {
  const date = [...new Set(tableWeeklyData.map((item) => item.date))];

  const newData = tableWeeklyData.map((x) => {
    return {
      ...x,
      DateHour: `${x["date"]}-${x["hour"]}`,
    };
  });

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      filters: date.map((d) => {
        return {
          text: d,
          value: d,
        };
      }),
      onFilter: (value, record) => record.date.startsWith(value),
      filterSearch: true,
    },
    {
      title: "Hour",
      dataIndex: "hour",
    },
    {
      title: "Prediction",
      dataIndex: "predict",
    },
    {
      title: "Status",
      dataIndex: "Status",
      editable: false,
      render: (tags) => (
        <span>
          {tags.map((tag) => {
            let color;
            if (tag === "Maximum") {
              color = "green";
            } else if (tag === "Reduced") {
              color = "blue";
            } else if (tag === "Warning") {
              color = "gold";
            } else if (tag === "Not Sailable") {
              color = "red";
            }
            return (
              <Tag color={color} key={tag}>
                {tag.toUpperCase()}
              </Tag>
            );
          })}
        </span>
      ),
    },
  ];

  return <Table dataSource={newData} columns={columns} rowKey="DateHour" />;
};

export default WeeklyForecastTable;
