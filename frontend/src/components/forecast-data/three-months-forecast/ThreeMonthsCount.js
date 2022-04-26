import React from "react";
import { Statistic } from "antd";

import "./ThreeMonthsCount.css";

const ThreeMonthsCount = ({ monthlyData }) => {
  const temp = [...monthlyData];

  temp.forEach(function (record) {
    if (record.month === 1) {
      record.month = "January";
    } else if (record.month === 2) {
      record.month = "February";
    } else if (record.month === 3) {
      record.month = "March";
    } else if (record.month === 4) {
      record.month = "April";
    } else if (record.month === 5) {
      record.month = "May";
    } else if (record.month === 6) {
      record.month = "June";
    } else if (record.month === 7) {
      record.month = "July";
    } else if (record.month === 8) {
      record.month = "August";
    } else if (record.month === 9) {
      record.month = "September";
    } else if (record.month === 10) {
      record.month = "October";
    } else if (record.month === 11) {
      record.month = "November";
    } else if (record.month === 12) {
      record.month = "December";
    }
  });

  const data = temp.map((x) => {
    return {
      ...x,
      datetime: `${x["month"]} ${x["year"]}`,
    };
  });
  return (
    <div className="statistic-wrapper">
      {data.map((month) => {
        return (
          <Statistic
            title={month.datetime}
            value={`${month.loadable_monthly} days`}
            key={month.datetime}
          />
        );
      })}
    </div>
  );
};

export default ThreeMonthsCount;
