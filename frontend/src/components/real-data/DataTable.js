import React, { useEffect, useState } from "react";
import { Table } from "antd";

const DataTable = ({ loc, data, locCategory }) => {
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    if (locCategory === "daily") {
      setColumns([
        {
          title: "Date",
          dataIndex: "date",
          key: "id",
        },
        {
          title: "Measurement",
          dataIndex: "measurement",
          key: "id",
        },
      ]);
    } else {
      setColumns([
        {
          title: "Date",
          dataIndex: "date",
          key: "id",
        },
        {
          title: "Hour",
          dataIndex: "hour",
          key: "id",
        },
        {
          title: "Measurement",
          dataIndex: "measurement",
          key: "id",
        },
      ]);
    }
  }, [locCategory]);

  return <Table dataSource={data} columns={columns} rowKey="id" />;
};

export default DataTable;
