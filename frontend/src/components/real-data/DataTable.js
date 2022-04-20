import React from "react";
import { Table } from "antd";

const DataTable = ({ data }) => {
  const columns = [
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
  ];

  return <Table dataSource={data} columns={columns} rowKey="id" />;
};

export default DataTable;
