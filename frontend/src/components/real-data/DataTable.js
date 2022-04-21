import React, { useEffect, useState } from "react";
import { Table } from "antd";

const DataTable = ({ loc, data }) => {
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    if (loc === "muara_teweh" || loc === "tarusan") {
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
  }, [loc]);

  return <Table dataSource={data} columns={columns} rowKey="id" />;
};

export default DataTable;
