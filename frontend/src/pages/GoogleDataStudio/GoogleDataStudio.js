import React from "react";
import { Layout } from "antd";

import Navbar from "../../components/navbar/Navbar";

import adaroLogo from "../../images/adaro-logo.png";

const { Header, Content } = Layout;

function GoogleDataStudio() {
    return (
        <Layout>
            <Header style={{ display: "flex", alignItems: "center" }}>
                <img src={adaroLogo} alt="adaro logo" style={{ height: "50%" }} />
                <Navbar />
            </Header>
            <Content style={{ minHeight: "100vh" }}>
                <iframe
                    title="DataStudio"
                    height={"700px"}
                    src="https://datastudio.google.com/embed/reporting/6a2d4029-f809-4036-9420-0cbe2cfdce57/page/p_fvyq1bw4vc"
                    frameBorder="0"
                    style={{ "border": "0", "minWidth": "100%" }}
                    allowFullScreen>
                </iframe>
            </Content>
        </Layout>
    );
}

export default GoogleDataStudio