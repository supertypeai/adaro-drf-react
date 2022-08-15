import React, { useState } from "react";
import { Menu } from "antd";
import { Link, useLocation } from "react-router-dom";
import { useLogin } from "../../contexts/UserContext";
import ChangePasswordModal from "../ChangePasswordModal";
const { SubMenu } = Menu;

const Navbar = () => {
  const { logoutUser } = useLogin();
  const [openModal, setOpenModal] = useState(false);

  const id = useLocation();
  // console.log(id.pathname);
  let activeKey;
  if (id.pathname === "/") {
    activeKey = "1";
  } else if (id.pathname === "/google-data-studio") {
    activeKey = "2";
  } else {
    activeKey = "3"
  }
  return (
    <Menu
      theme="dark"
      mode="horizontal"
      defaultSelectedKeys={["1"]}
      selectedKeys={[activeKey]}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <Menu.Item key="1">
        <Link to="/">Data Warehouse</Link>
      </Menu.Item>
      <Menu.Item key="2">
        <Link to="/google-data-studio">Google Data Studio</Link>
      </Menu.Item>
      <SubMenu key="3" title="My Account">
        <Menu.Item key="3.1">
          <span onClick={() => setOpenModal(true)}>Reset Password</span>

          <ChangePasswordModal
            openModal={openModal}
            setOpenModal={setOpenModal}
          />
        </Menu.Item>
        <Menu.Item key="3.2">
          <span onClick={() => logoutUser()}>Logout</span>
        </Menu.Item>
      </SubMenu>
    </Menu>
  );
};

export default Navbar;
