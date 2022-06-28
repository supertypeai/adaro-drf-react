import { Form, Popconfirm, Table, Typography } from "antd";
import { useState } from "react";
import { useLogin } from "../../contexts/UserContext";
import EditableCell from "./EditableCell";

import APIService from "../../APIService";

const EditableTable = ({
  loc,
  data,
  setData,
  filteredData,
  setFilteredData,
  locCategory,
}) => {
  // const [tempData, setTempData] = useState([]);
  const [form] = Form.useForm();

  const [editingKey, setEditingKey] = useState("");
  const { authTokens } = useLogin();

  // useEffect(() => {
  //     setTempData(data);
  // }, [data])

  const isEditing = (record) => record.id === editingKey;
  let columns;
  let edit;
  if (locCategory === "daily") {
    columns = [
      {
        title: "Date",
        dataIndex: "date",
      },
      {
        title: "Measurement",
        dataIndex: "measurement",
        editable: true,
      },
    ];
    edit = (record) => {
      form.setFieldsValue({
        date: "",
        measurement: "",
        ...record,
      });
      setEditingKey(record.id);
    };
  } else {
    columns = [
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
        editable: true,
      },
    ];
    edit = (record) => {
      form.setFieldsValue({
        date: "",
        hour: "",
        measurement: "",
        ...record,
      });
      setEditingKey(record.id);
    };
  }
  columns = [
    ...columns,
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Typography.Link
              onClick={() => save(record.id)}
              style={{
                marginRight: 8,
              }}
            >
              Save
            </Typography.Link>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <a href="#!">Cancel</a>
            </Popconfirm>
          </span>
        ) : (
          <span>
            <Typography.Link
              disabled={editingKey !== ""}
              onClick={() => edit(record)}
            >
              Edit
            </Typography.Link>
            {data.length > 1 ? (
              <Popconfirm
                title="Sure to delete?"
                onConfirm={() => handleDelete(record)}
              >
                <Typography.Link
                  type="danger"
                  disabled={editingKey !== ""}
                  style={{
                    marginLeft: 15,
                  }}
                >
                  Delete
                </Typography.Link>
              </Popconfirm>
            ) : null}
          </span>
        );
      },
    },
  ];

  const cancel = () => {
    setEditingKey("");
  };

  const save = async (id) => {
    // console.log(id)
    try {
      const row = await form.validateFields();
      const newData = [...data];
      console.log(row);
      const index = newData.findIndex((item) => id === item.id);
      const item = newData[index];
      const updatedEntry = {
        ...item,
        measurement: parseFloat(row.measurement),
      };
      newData.splice(index, 1, {
        ...item,
        measurement: parseFloat(row.measurement),
      });
      APIService.EditData(
        id,
        {
          date: updatedEntry.date,
          hour: updatedEntry.hour,
          measurement: updatedEntry.measurement,
          location: updatedEntry.location,
        },
        authTokens.access
      ).then(() => {
        console.log("Data updated on the backend!");
        setData(newData);
        setFilteredData(newData);
        setEditingKey("");
      });
    } catch (errInfo) {
      console.log("Validate Failed:", errInfo);
    }
  };

  const handleDelete = (record) => {
    APIService.DeleteData(record.id, authTokens.access).then((res) => {
      console.log(res);
      setData((old) => {
        return old.filter((d) => d.id !== record.id);
      });
      setFilteredData((old) => {
        return old.filter((d) => d.id !== record.id);
      });
    });
  };

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: col.dataIndex === "number",
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });
  return (
    <Form form={form} component={false}>
      <Table
        components={{
          body: {
            cell: EditableCell,
          },
        }}
        bordered
        dataSource={filteredData}
        columns={mergedColumns}
        rowClassName="editable-row"
        pagination={{
          onChange: cancel,
        }}
        rowKey="id"
      />
    </Form>
  );
};

export default EditableTable;
