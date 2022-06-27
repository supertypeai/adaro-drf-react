import React, { useState } from "react";
import { Menu, Form, Modal, Space, Typography, Input } from "antd";
import { Link } from "react-router-dom";
import { useLogin } from "../../contexts/UserContext";
const { SubMenu } = Menu;
const { Text } = Typography;

const Navbar = () => {
  const [form] = Form.useForm();
  const { logoutUser } = useLogin();
  const [openModal, setOpenModal] = useState(false);
  const [password, setPassword] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [value, setValue] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setPassword(prevState => ({
      ...prevState,
      [name]: value
    }));
  }

  const handleOk = () => {
    setOpenModal(false);
    form.resetFields();
  };

  const handleCancel = () => {
    setOpenModal(false);
    form.resetFields();
  };


  return (
    <Menu
      theme="dark"
      mode="horizontal"
      defaultSelectedKeys={["1"]}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <Menu.Item key="1">
        <Link to="/">Home</Link>
      </Menu.Item>
      <SubMenu key="2" title="My Account">
        <Menu.Item key="2.1">
          <span onClick={() => setOpenModal(true)}>Reset Password</span>
          <Modal
            title="Reset Password"
            visible={openModal}
            onOk={handleOk}
            onCancel={handleCancel}
          >
            <Space direction="vertical">
              <Form
                form = {form}
                initialValues = {{ remember: true }}
              >
                <Form.Item name="old-password">
                  <Text>Old Password</Text>
                  <Input.Password
                    placeholder="Input Old Password"
                    onChange={handleChange}
                  />
                </Form.Item>
                <Form.Item name="new-password">
                  <Text>New Password</Text>
                  <Input.Password
                    placeholder="Input New Password"
                    onChange={handleChange}
                  />
                </Form.Item>
                <Form.Item name="confirm-password">
                  <Text>Confirm Password</Text>
                  <Input.Password
                    placeholder="Reinput New Password"
                    onChange={handleChange}
                  />
                </Form.Item>
              </Form>
            </Space>
          </Modal>
        </Menu.Item>
        <Menu.Item key="2.2">
          <span onClick={() => logoutUser()}>Logout</span>
        </Menu.Item>
      </SubMenu>
    </Menu>
  );
};

export default Navbar;
