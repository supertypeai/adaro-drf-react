import React, { useState } from "react";
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

import APIService from "../APIService";

const { Text } = Typography;
const { Option } = Select;

const AddData = ({ locId, locTitle, loc }) => {
  const [newData, setNewData] = useState({
    date: "",
    hour: "",
    measurement: "",
    location: locId,
  });

  const [openModal, setOpenModal] = useState(false);

  const handleOk = () => {
    setOpenModal(false);
  };

  const handleCancel = () => {
    setOpenModal(false);
  };

  return (
    <>
      <Button type="primary" onClick={() => setOpenModal(true)}>
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
          <DatePicker />
          {/* REMEMBER TO ADD HANDLERS */}
          {loc === "muara_tuhup" ? (
            <>
              <Text>Hour (Between 0 - 24):</Text>
              <InputNumber placeholder="Input Hour" min={0} max={24} />
            </>
          ) : loc === "muara_teweh" || loc === "tarusan" ? null : (
            <>
              <Text>Hour:</Text>
              <Select defaultValue="2">
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
          <InputNumber placeholder="Input Measurement" />
        </Space>
      </Modal>
    </>
  );
};

export default AddData;
