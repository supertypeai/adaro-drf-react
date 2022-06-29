import React, { useState } from "react";
import { Form, Input, Typography, message, Modal, Space } from "antd";
import APIService from "../APIService";
import { useLogin } from "../contexts/UserContext";

const { Text } = Typography;

const ChangePasswordModal = ({ openModal, setOpenModal }) => {
  const [password, setPassword] = useState({
    old_password: "",
    new_password: "",
  });

  const [form] = Form.useForm();

  const { authTokens } = useLogin();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setPassword((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const successMessage = () => {
    message.success("Password has been changed successfully.");
  };

  const errorMessage = () => {
    message.error("Something went wrong.");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setOpenModal(false);
    APIService.ChangePassword(password, authTokens.access)
      .then((response) => {
        successMessage();
        form.resetFields();
      })
      .catch((e) => {
        errorMessage();
        form.resetFields();
      });
  };

  const handleCancel = () => {
    setOpenModal(false);
    form.resetFields();
  };

  return (
    <Modal
      title="Reset Password"
      visible={openModal}
      onOk={handleSubmit}
      onCancel={handleCancel}
    >
      <Space direction="vertical">
        <Form form={form} initialValues={{ remember: true }}>
          <Form.Item name="old_password">
            <Text>Old Password</Text>
            <Input.Password
              name="old_password"
              placeholder="Input Old Password"
              onChange={handleChange}
            />
          </Form.Item>
          <Form.Item name="new_password">
            <Text>New Password</Text>
            <Input.Password
              name="new_password"
              placeholder="Input New Password"
              onChange={handleChange}
            />
          </Form.Item>
          {/* <Form.Item name="confirm-password">
        <Text>Confirm Password</Text>
        <Input.Password
          placeholder="Reinput New Password"
          onChange={handleChange}
        />
      </Form.Item> */}
        </Form>
      </Space>
    </Modal>
  );
};

export default ChangePasswordModal;
