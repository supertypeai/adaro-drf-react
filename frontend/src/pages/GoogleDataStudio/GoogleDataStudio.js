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
                    width="600"
                    height="1322"
                    src="https://lookerstudio.google.com/embed/reporting/dda1149a-50df-4dc2-af77-214bc4075823/page/p_00acbtzk9c"
                    frameborder="0"
                    style={{ "border": "0", "minWidth": "100%" }}
                    allowfullscreen>
                </iframe>
            </Content>
        </Layout>
    );
}

export default GoogleDataStudio