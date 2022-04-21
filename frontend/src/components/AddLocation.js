import React, { useState } from "react";
import { Input, Modal, Button, InputNumber, Space, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";

import APIService from "../APIService";
import { useAPI } from "../LocationContext";

const { Text } = Typography;

const AddLocation = () => {
  const [newLocation, setNewLocation] = useState({
    name: "",
    title: "",
    longitude: "",
    latitude: "",
  });

  const [openModal, setOpenModal] = useState(false);

  const { locations, setLocations } = useAPI();

  const handleOk = () => {
    APIService.AddLocation(newLocation)
      .then((resp) => setLocations([...locations, resp]))
      .then(setOpenModal(false));
  };

  const handleCancel = () => {
    setOpenModal(false);
  };

  return (
    <div style={{ marginBottom: "2em" }}>
      <Button type="primary" onClick={() => setOpenModal(true)}>
        Add New Location <PlusOutlined />
      </Button>
      <Modal
        title="Add New Location"
        visible={openModal}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Space direction="vertical">
          <Text>Name (For e.g. "muara_tuhup"):</Text>
          <Input
            placeholder="Location Name"
            onChange={(e) =>
              setNewLocation({ ...newLocation, name: e.target.value })
            }
          />

          <Text>Title (For e.g. "Muara Tuhup"):</Text>
          <Input
            placeholder="Location Title"
            onChange={(e) =>
              setNewLocation({ ...newLocation, title: e.target.value })
            }
          />

          <Text>Longitude (For e.g. "123.456789"):</Text>
          <InputNumber
            placeholder="Insert Longitude"
            onChange={(value) =>
              setNewLocation({ ...newLocation, longitude: value })
            }
          />

          <Text>Latitude (For e.g. "-1.2345"):</Text>
          <InputNumber
            placeholder="Insert Latitude"
            onChange={(value) =>
              setNewLocation({ ...newLocation, latitude: value })
            }
          />
        </Space>
      </Modal>
    </div>
  );
};

export default AddLocation;
