import React from "react";
import { Link } from "react-router-dom";
import { Layout, Typography, Row, Col, Card } from "antd";
import { useAPI } from "../LocationContext";

import Navbar from "../components/navbar/Navbar";

import adaroLogo from "../images/adaro-logo.png";

import "./Home.css";

const { Header, Content } = Layout;
const { Title } = Typography;

const Home = () => {
  const { locations } = useAPI();

  return (
    <Layout>
      <Header style={{ display: "flex", alignItems: "center" }}>
        <img src={adaroLogo} alt="adaro logo" style={{ height: "50%" }} />
        <Navbar />
      </Header>
      <Content style={{ minHeight: "100vh" }}>
        <div className="container">
          <Title style={{ textAlign: "center", padding: "0.8em 0 0.5em" }}>
            Locations
          </Title>
          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
            {locations.map((location) => {
              return (
                <Col xs={24} md={12} lg={8} key={location.id}>
                  <Link to={`/locs/${location.id}`}>
                    <Card
                      title={
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
                          : "Tarusan"
                      }
                      style={{ marginBottom: "1.6em" }}
                    >
                      <p>Longitude: {location.longitude}</p>
                      <p>Latitude: {location.latitude}</p>
                    </Card>
                  </Link>
                </Col>
              );
            })}
          </Row>
        </div>
      </Content>
    </Layout>
  );
};

export default Home;
