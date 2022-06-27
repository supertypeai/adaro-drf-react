import React from "react";
import { Menu } from "antd";
import { Link, useLocation } from "react-router-dom";
import { useAPI } from "../../contexts/LocationContext";

const SideNavbar = () => {
  const { locations } = useAPI();
  const activeKey = useLocation().pathname.split("/")[2];
  const { SubMenu } = Menu;

  return (
    // ADD COLLAPSE BUTTON (BURGER) FOR RESPONSIVENESS LAH SIAAAAA!!!
    <Menu
      mode="inline"
      selectedKeys={[activeKey]}
      style={{
        height: "100%",
        borderRight: 0,
      }}
    >
      {Array.isArray(locations) &&
        locations.map((location) => {
          return (
            <SubMenu key={location.id} title={location.title}>
              <Menu.Item key={`${location.id}.1`}>
                <Link to={`/locs/${location.id}`}>Data</Link>
              </Menu.Item>
              <Menu.Item key={`${location.id}.2`}>
                <Link to={`/locs/${location.id}/forecast/`}>Forecast</Link>
              </Menu.Item>
            </SubMenu>
          );
        })}
    </Menu>
  );
};

export default SideNavbar;
