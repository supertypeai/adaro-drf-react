import React from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { useNavigate } from "react-router-dom";
import { Layout, Typography } from "antd";
import { useAPI } from "../../contexts/LocationContext";

import Navbar from "../../components/navbar/Navbar";

import adaroLogo from "../../images/adaro-logo.png";

import "./Maps.css";

const { Header, Content } = Layout;
const { Title } = Typography;

const Maps = () => {
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const { locations } = useAPI();
    const newLocations = locations.map(({ id, title, latitude, longitude, sensor }) => (
        {
            id: id, key: title, location: { lat: latitude, lng: longitude }, sensor: sensor
        }));
    const navigate = useNavigate();

    const handleClick = (id) => {
        navigate(`/locs/${id}`)
    }


    return (
        <Layout>
            <Header style={{ display: "flex", alignItems: "center" }}>
                <img src={adaroLogo} alt="adaro logo" style={{ height: "50%" }} />
                <Navbar />
            </Header>
            <Content style={{ minHeight: "100vh" }}>
                <div>
                    <Title style={{ textAlign: "center", paddingTop: "0.8em" }}>
                        Locations
                    </Title>

                    {/* <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
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
                    </Row> */}
                    <div className="site-layout-background">
                        <div className="map-container">
                            <APIProvider apiKey={apiKey}>
                                <Map
                                    style={{ height: '100vh' }}
                                    defaultCenter={{ lat: -1, lng: 114.89 }}
                                    defaultZoom={10}
                                    mapId={"b83c2252d6cb7543"}
                                // gestureHandling={'greedy'}
                                // disableDefaultUI={true}
                                />
                                {Array.isArray(newLocations) && newLocations.map((loc) => {
                                    console.log(loc)
                                    return (
                                        <AdvancedMarker
                                            title={loc.sensor === false ? loc.key : `${loc.key} - Sensor`}
                                            onClick={() => handleClick(loc.id)}
                                            key={loc.key}
                                            position={loc.location}>
                                            <Pin background={loc.sensor === false ? '#07a4f4' : '#f40707'} glyphColor={'#000'} borderColor={'#000'} />
                                        </AdvancedMarker>
                                    )
                                })}
                                {/* {infoWindowOpen && (
                                    <InfoWindow
                                        anchor={marker}
                                        maxWidth={200}
                                        onCloseClick={() => setInfoWindowOpen(false)}>
                                        Click here
                                        <Link to={`/locs/1`}></Link>
                                    </InfoWindow>
                                )} */}
                            </APIProvider>
                        </div>
                    </div>
                </div>
            </Content>
        </Layout >
    );
};

export default Maps;
