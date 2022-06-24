import React from "react";
import { Menu } from "antd";
import { Link } from "react-router-dom";
import { useLogin } from "../../contexts/UserContext";
const { SubMenu } = Menu;

const Navbar = () => {
  const { setToken } = useLogin();

  const handleLogout = (event) => {
    event.preventDefault();
  
    sessionStorage.removeItem("token");
    setToken(null);
    window.location.reload();
    
  }

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
          <Link to="/">Reset Password</Link>
        </Menu.Item>
        <Menu.Item key="2.2">
          <span onClick={(event) => handleLogout(event)}>Logout</span>
        </Menu.Item>
      </SubMenu>
    </Menu>
  );
};

export default Navbar;
