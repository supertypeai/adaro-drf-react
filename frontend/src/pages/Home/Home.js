import React from "react";
import { Link } from "react-router-dom";
import { Layout, Typography, Row, Col, Card } from "antd";
import { useAPI } from "../../contexts/LocationContext";

import Navbar from "../../components/navbar/Navbar";

import adaroLogo from "../../images/adaro-logo.png";

import "./Home.css";

const { Header, Content } = Layout;
const { Title } = Typography;

const Home = () => {
  const { locations } = useAPI();
  const sortedLocations = [...locations].sort((a, b) => a.latitude - b.latitude);
  // const { authTokens } = useLogin();
  // const navigate = useNavigate();

  // useEffect(() => {
  //   if (!authTokens) {
  //     navigate("/login");
  //   }
  // }, [authTokens, navigate])

  return (
    <Layout>
      <Header style={{ display: "flex", alignItems: "center" }}>
        <img src={adaroLogo} alt="adaro logo" style={{ height: "50%" }} />
        <Navbar />
      </Header>
      <Content style={{ minHeight: "100vh" }}>
        <div className="container">
          <Title style={{ textAlign: "center", paddingTop: "0.8em" }}>
            Locations
          </Title>
          {/* <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <AddLocation />
          </div> */}

          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
            {Array.isArray(sortedLocations) && sortedLocations.map((location) => {
              return (
                <Col xs={24} md={12} lg={8} key={location.id}>
                  <Link to={`/locs/${location.id}`}>
                    <Card
                      title={location.title}
                      style={{ marginBottom: "1.6em" }}
                    >
                      <p>Longitude: {location.longitude}</p>
                      <p>Latitude: {location.latitude}</p>
                      <p>{location.sensor ? 'Using data from sensor' : 'Using manual data'}</p>
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
