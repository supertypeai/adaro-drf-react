import React from "react";
import { Menu } from "antd";
import { Link, useLocation } from "react-router-dom";
import { useAPI } from "../../LocationContext";

const SideNavbar = () => {
  const { locations } = useAPI();
  const activeKey = useLocation().pathname.split("/")[2];
  const { SubMenu } = Menu;

  return (
    <Menu
      mode="inline"
      selectedKeys={[activeKey]}
      style={{
        height: "100%",
        borderRight: 0,
      }}
    >
      {locations.map((location) => {
        const locTitle =
          location.name === "muara_tuhup"
            ? "Muara Tuhup"
            : location.name === "puruk_cahu"
            ? "Puruk Cahu"
            : location.name === "siwak"
            ? "Teluk Siwak"
            : location.name === "hasan_basri"
            ? "Hasan Basri"
            : location.name === "papar_pujung"
            ? "Papar Pujung"
            : location.name === "muara_teweh"
            ? "Muara Teweh"
            : "Tarusan";
        return (
          <SubMenu key={location.id} title={locTitle}>
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
