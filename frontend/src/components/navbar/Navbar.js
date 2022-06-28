import React, { useState } from "react";
import { Menu } from "antd";
import { Link } from "react-router-dom";
import { useLogin } from "../../contexts/UserContext";
import ChangePasswordModal from "../ChangePasswordModal";
const { SubMenu } = Menu;

const Navbar = () => {
  const { logoutUser } = useLogin();
  const [openModal, setOpenModal] = useState(false);

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

          <ChangePasswordModal
            openModal={openModal}
            setOpenModal={setOpenModal}
          />
        </Menu.Item>
        <Menu.Item key="2.2">
          <span onClick={() => logoutUser()}>Logout</span>
        </Menu.Item>
      </SubMenu>
    </Menu>
  );
};

export default Navbar;
