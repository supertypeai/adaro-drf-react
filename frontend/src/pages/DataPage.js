import React from "react";
import { Link } from "react-router-dom";
import { Layout, Typography, Grid, Breadcrumb } from "antd";

import Navbar from "../components/navbar/Navbar";
import SideNavbar from "../components/navbar/SideNavbar";
import DataComponent from "../components/real-data/DataComponent";

import adaroLogo from "../images/adaro-logo.png";

import "./DataPage.css";

const { Header, Content, Sider } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

const DataPage = ({ locId, loc, locTitle, locCategory }) => {
  const { sm } = useBreakpoint();
  const contentMargin = sm ? 200 : 30;

  return (
    <Layout>
      <Sider
        breakpoint="sm"
        collapsedWidth="0"
        width={200}
        style={{
          height: "100%",
          minHeight: "100vh",
          overflow: "auto",
          position: "fixed",
          left: 0,
          zIndex: 99,
        }}
      >
        <div
          style={{
            width: 200,
            backgroundColor: "#141414",
            padding: "1.5em 0 2em 1em",
          }}
        >
          <img src={adaroLogo} alt="adaro logo" style={{ width: "80%" }} />
        </div>
        <SideNavbar />
      </Sider>
      <Layout>
        <Header>
          <Navbar />
        </Header>
        <Content style={{ marginLeft: contentMargin }}>
          <div className="container">
            <Breadcrumb style={{ margin: "1em 0" }}>
              <Breadcrumb.Item>
                <Link to="/">Home</Link>
              </Breadcrumb.Item>
              <Breadcrumb.Item>{locTitle}</Breadcrumb.Item>
            </Breadcrumb>
            <Title>Data of {locTitle}</Title>
            <DataComponent
              loc={loc}
              locId={locId}
              locTitle={locTitle}
              locCategory={locCategory}
            />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DataPage;
