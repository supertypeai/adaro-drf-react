import React, { useEffect, useState } from "react";
import { Table, Popconfirm, Typography } from "antd";
import { useLogin } from "../../contexts/UserContext";
import APIService from "../../APIService";

const DataTable = ({ loc, data, setData, locCategory }) => {
  const [columns, setColumns] = useState([]);
  const [tempData, setTempData] = useState([]);
  const { authTokens } = useLogin();

  useEffect(() => {
    setTempData(data);
    if (locCategory === "daily") {
      setColumns([
        {
          title: "Date",
          dataIndex: "date",
        },
        {
          title: "Measurement",
          dataIndex: "measurement",
        },
        {
          title: "Actions",
          dataIndex: "actions",
          render: (_, record) => {
            return (
              <Popconfirm
                title="Sure to delete?"
                onConfirm={() => handleDelete(record)}
              >
                <Typography.Link
                  type="danger"
                  style={{
                    marginLeft: 15,
                  }}
                >
                  Delete
                </Typography.Link>
              </Popconfirm>
            )
          }
        }
      ]);
    } else {
      setColumns([
        {
          title: "Date",
          dataIndex: "date",
        },
        {
          title: "Hour",
          dataIndex: "hour",
        },
        {
          title: "Measurement",
          dataIndex: "measurement",
        },
        {
          title: "Actions",
          dataIndex: "actions",
          render: (_, record) => {
            return (
              <Popconfirm
                title="Sure to delete?"
                onConfirm={() => handleDelete(record)}
              >
                <Typography.Link
                  type="danger"
                  style={{
                    marginLeft: 15,
                  }}
                >
                  Delete
                </Typography.Link>
              </Popconfirm>
            )
          }
        }
      ]);
    }
  }, [locCategory, data]);

  const handleDelete = (record) => {
    APIService.DeleteData(record.id, authTokens.access)
      .then((res) => {
        console.log(res)
        setTempData((old) => {
          return old.filter((d) => d.id !== record.id)
        })
      })
  }

  return <Table dataSource={tempData} columns={columns} rowKey="id" />;
};

export default DataTable;
