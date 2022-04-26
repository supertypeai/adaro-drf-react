import React, { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Space,
  DatePicker,
  Typography,
  InputNumber,
  Select,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import moment from "moment";

import APIService from "../APIService";

const { Text } = Typography;
const { Option } = Select;

const AddData = ({
  locId,
  locTitle,
  locCategory,
  data,
  setData,
  filteredData,
  setFilteredData,
}) => {
  const initialState = {
    date: "",
    hour: "",
    measurement: "",
    location: locId,
  };

  const [newData, setNewData] = useState({
    ...initialState,
  });

  const location = useLocation();

  useEffect(() => {
    setNewData({ ...newData, location: locId });
  }, [location, newData, locId]);

  const [openModal, setOpenModal] = useState(false);

  const handleOk = () => {
    APIService.AddData(newData)
      .then((response) => {
        setData([response, ...data]);
        setFilteredData([response, ...data]);
      })
      .then(() => {
        setOpenModal(false);
        setNewData({ ...initialState, location: locId });
      });
  };

  const handleCancel = () => {
    setOpenModal(false);
  };

  const handleDate = (_, dateString) => {
    setNewData({ ...newData, date: dateString });
  };

  return (
    <>
      <Button
        type="primary"
        onClick={() => {
          setOpenModal(true);
          console.log(locId);
        }}
      >
        Add New Data <PlusOutlined />
      </Button>
      <Modal
        title={`Add New Data For ${locTitle}`}
        visible={openModal}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Space direction="vertical">
          <Text>Date:</Text>
          <DatePicker
            onChange={handleDate}
            value={newData.date !== "" ? moment(newData.date) : null}
          />
          {/* REMEMBER TO ADD HANDLERS */}
          {locCategory === "hourly" ? (
            <>
              <Text>Hour (Between 0 - 24):</Text>
              <InputNumber
                placeholder="Input Hour"
                min={0}
                max={24}
                value={newData.hour !== "" ? newData.hour : null}
                onChange={(value) => {
                  setNewData({ ...newData, hour: value });
                }}
              />
            </>
          ) : locCategory === "daily" ? null : (
            <>
              <Text>Hour:</Text>
              <Select
                defaultValue="Select Hour"
                value={newData.hour !== "Select Hour" ? newData.hour : null}
                onChange={(value) => {
                  setNewData({ ...newData, hour: value });
                }}
              >
                <Option value="2">Hour-2</Option>
                <Option value="6">Hour-6</Option>
                <Option value="10">Hour-10</Option>
                <Option value="14">Hour-14</Option>
                <Option value="18">Hour-18</Option>
                <Option value="22">Hour-22</Option>
              </Select>
            </>
          )}

          <Text>Measurement:</Text>
          <InputNumber
            placeholder="Input Measurement"
            value={newData.measurement !== "" ? newData.measurement : null}
            onChange={(value) => {
              setNewData({ ...newData, measurement: value });
            }}
          />
        </Space>
      </Modal>
    </>
  );
};

export default AddData;
