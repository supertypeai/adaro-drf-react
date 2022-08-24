import React from "react";
import { Statistic } from "antd";

import "./ThreeMonthsCount.css";

const ThreeMonthsCount = ({ loadableData }) => {
  return (
    <div className="statistic-wrapper">
      {Object.keys(loadableData).map((month) => {
        return (
          <Statistic
            title={month}
            value={`${loadableData[month]} days`}
            key={month}
          />
        );
      })}
    </div>
  );
};

export default ThreeMonthsCount;
