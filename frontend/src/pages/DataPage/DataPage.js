import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Layout, Typography, Grid, Breadcrumb } from "antd";
import { useLogin } from "../../contexts/UserContext";

import Navbar from "../../components/navbar/Navbar";
import SideNavbar from "../../components/navbar/SideNavbar";
import DataComponent from "../../components/real-data/DataComponent";
import APIService from "../../APIService";

import adaroLogo from "../../images/adaro-logo.png";

import "./DataPage.css";

const { Header, Content, Sider } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

const DataPage = () => {
  const { sm } = useBreakpoint();
  const contentMargin = sm ? 200 : 30;

  const params = useParams();
  const [locations, setLocations] = useState([]);
  const [loc, setLoc] = useState([]);

  const { authTokens } = useLogin();
  // const navigate = useNavigate();

  useEffect(() => {
    const locsCache = JSON.parse(localStorage.getItem("locations"));
    if (locsCache) {
      setLocations(locsCache);
    } else {
      APIService.GetLocations(authTokens).then((response) => {
        localStorage.setItem("locations", JSON.stringify(response));
        setLocations(response);
      });
    }
  }, [params, authTokens]);

  useEffect(() => {
    setLoc(locations.filter((el) => el.id === parseInt(params.id)));
  }, [locations, params]);

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
              <Breadcrumb.Item>
                {loc.length !== 0 ? loc[0].title : "Loading..."}
              </Breadcrumb.Item>
            </Breadcrumb>
            <Title>
              Data of {loc.length !== 0 ? loc[0].title : "Loading..."}
            </Title>
            <DataComponent
              loc={loc.length !== 0 ? loc[0].name : "Loading..."}
              locId={params.id}
              locTitle={loc.length !== 0 ? loc[0].title : "Loading..."}
              locCategory={loc.length !== 0 ? loc[0].category : "Loading..."}
              isSensor={loc.length !== 0 ? loc[0].sensor : "loading..."}
            />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DataPage;
