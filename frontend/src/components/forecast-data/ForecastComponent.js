import React, { useState, useEffect } from "react";
import { Skeleton, Typography, Space, Divider, Alert, Collapse, Row, Col, Card } from "antd";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { useLogin } from "../../contexts/UserContext";

import dasMapImage from "../../images/das-muara-tuhup-map.png";

import APIService from "../../APIService";
import WeeklyForecastGraph from "./weekly-forecast/WeeklyForecastGraph";
import ThreeMonthsBar from "./three-months-forecast/ThreeMonthsBar";
import ThreeMonthsPie from "./three-months-forecast/ThreeMonthsPie";
import ThreeMonthsCount from "./three-months-forecast/ThreeMonthsCount";
import ThreeMonthsTable from "./three-months-forecast/ThreeMonthsTable";
import WeeklyTableModal from "./weekly-forecast/WeeklyTableModal";
import V3PerformanceChart from "./v3-performance/V3PerformanceChart";
import V3PerformanceTable from "./v3-performance/V3PerformanceTable";

import "./ForecastComponent.css";

const { Title } = Typography;

const ForecastComponent = ({ loc }) => {
  const [weeklyData, setWeeklyData] = useState([]);
  const [tableWeeklyData, setTableWeeklyData] = useState([]);
  const [v3Data, setV3Data] = useState([]);
  const [v3TableData, setV3TableData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loadableData, setLoadableData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { authTokens } = useLogin();

  useEffect(() => {
    setIsLoading(true);
    if (loc !== "loading") {
      if (loc === 'muara_tuhup') {
        // For muara_tuhup, fetch both v3 performance data and regular forecast data
        Promise.all([
          APIService.getV3ForecastData(loc, authTokens.access),
          APIService.getForecastData(loc, authTokens.access)
        ])
        .then(([v3Response, regularResponse]) => {
          // Handle v3 performance data
          if (v3Response.response === "success") {
            setV3Data(v3Response.data || []);
            setV3TableData(v3Response.data_wide || []);
          }
          
          // Handle regular forecast data for monthly charts
          if (regularResponse.response === "success") {
            setWeeklyData(JSON.parse(regularResponse.data));
            setTableWeeklyData(JSON.parse(regularResponse.data_wide));
            setMonthlyData(JSON.parse(regularResponse.monthly_data));
            setLoadableData(JSON.parse(regularResponse.three_months_loadable));
          }
        })
        .catch((error) => {
          console.error('Error fetching forecast data:', error);
        })
        .finally(() => setIsLoading(false));
      } else {
        // For other locations, use regular API
        APIService.getForecastData(loc, authTokens.access)
          .then((resp) => {
            if (resp.response === "success") {
              setWeeklyData(JSON.parse(resp.data));
              setTableWeeklyData(JSON.parse(resp.data_wide));
            } else if (resp.response === "empty") {
              setWeeklyData([]);
            }
          })
          .catch((error) => {
            console.error('Error fetching forecast data:', error);
          })
          .finally(() => setIsLoading(false));
      }
    }
  }, [loc, authTokens]);

  return (
    <>
      {isLoading ? (
        <Skeleton active />
      ) : (
        <Space
          direction="vertical"
          size="large"
          style={{ width: "100%", marginBottom: "24px" }}
        >
          {/* V3 Performance Analysis Section - Only for muara_tuhup */}
          {loc === "muara_tuhup" && v3Data.length > 0 && (
            <>
              <Alert
                message="🚀 New V3 Forecast Performance System"
                description="Advanced performance tracking with historical comparison and accuracy metrics. Compare actual measurements with multi-day ahead forecasts."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              {/* Fun Fact - DAS Neural Network Section */}
              <Collapse 
                bordered={false} 
                style={{ 
                  marginBottom: 24, 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid rgba(24, 144, 255, 0.3)', 
                  borderRadius: 8 
                }}
                expandIcon={({ isActive }) => isActive ? <UpOutlined /> : <DownOutlined />}
              >
                <Collapse.Panel 
                  header={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontSize: 20 }}>💡</div>
                      <Typography.Title level={5} style={{ color: '#1890ff', margin: 0 }}>
                        Fun Fact: How Our Neural Network System Works
                      </Typography.Title>
                    </div>
                  } 
                  key="funfact"
                >
                  <Card 
                    style={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: 16,
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ position: 'relative', padding: '32px' }}>
                      {/* Background Pattern */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '30%',
                        height: '100%',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='m0 40l40-40h-40v40zm40 0v-40h-40l40 40z'/%3E%3C/g%3E%3C/svg%3E")`,
                        pointerEvents: 'none'
                      }} />

                      <Row gutter={[32, 24]} align="middle">
                        <Col xs={24} lg={14}>
                          <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                              <div style={{
                                width: 64,
                                height: 64,
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 32,
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                              }}>
                                🧠
                              </div>
                              <div>
                                <Typography.Title level={2} style={{ color: '#ffffff', margin: 0, fontWeight: 700, fontSize: 28 }}>
                                  Advanced Neural Network Forecast System
                                </Typography.Title>
                                <Typography.Text style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 18, fontWeight: 500 }}>
                                  Powered by DAS Muara Tuhup Watershed Intelligence
                                </Typography.Text>
                              </div>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                              <Typography.Text style={{ 
                                color: '#ffffff', 
                                fontSize: 16, 
                                lineHeight: 1.7, 
                                display: 'block' 
                              }}>
                                Our cutting-edge forecast system leverages comprehensive rainfall and hydrological data from the 
                                <strong style={{ color: '#ffd700' }}> DAS (Daerah Aliran Sungai) Muara Tuhup</strong> watershed 
                                region, utilizing state-of-the-art neural network algorithms to deliver unprecedented 
                                accuracy in water level predictions.
                              </Typography.Text>
                            </div>

                            <Row gutter={[16, 16]}>
                              <Col xs={24} sm={8}>
                                <div style={{ 
                                  padding: '16px 20px', 
                                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                  borderRadius: 12,
                                  textAlign: 'center',
                                  border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}>
                                  <div style={{ fontSize: 24, marginBottom: 8 }}>🌊</div>
                                  <Typography.Text style={{ color: '#ffffff', fontWeight: 600, fontSize: 14, display: 'block' }}>
                                    Watershed Integration
                                  </Typography.Text>
                                  <Typography.Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}>
                                    Real-time monitoring
                                  </Typography.Text>
                                </div>
                              </Col>
                              <Col xs={24} sm={8}>
                                <div style={{ 
                                  padding: '16px 20px', 
                                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                  borderRadius: 12,
                                  textAlign: 'center',
                                  border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}>
                                  <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
                                  <Typography.Text style={{ color: '#ffffff', fontWeight: 600, fontSize: 14, display: 'block' }}>
                                    Neural Processing
                                  </Typography.Text>
                                  <Typography.Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}>
                                    Deep learning AI
                                  </Typography.Text>
                                </div>
                              </Col>
                              <Col xs={24} sm={8}>
                                <div style={{ 
                                  padding: '16px 20px', 
                                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                  borderRadius: 12,
                                  textAlign: 'center',
                                  border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}>
                                  <div style={{ fontSize: 24, marginBottom: 8 }}>🎯</div>
                                  <Typography.Text style={{ color: '#ffffff', fontWeight: 600, fontSize: 14, display: 'block' }}>
                                    Enhanced Accuracy
                                  </Typography.Text>
                                  <Typography.Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 12 }}>
                                    Precision forecasting
                                  </Typography.Text>
                                </div>
                              </Col>
                            </Row>
                          </div>
                        </Col>

                        <Col xs={24} lg={10}>
                          <div style={{ 
                            position: 'relative', 
                            zIndex: 1,
                            textAlign: 'center'
                          }}>
                            {/* Watershed Map */}
                            <div style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: 16,
                              padding: 20,
                              border: '2px solid rgba(255, 255, 255, 0.2)',
                              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                            }}>
                              <div style={{ marginBottom: 16 }}>
                                <Typography.Text style={{ 
                                  color: '#ffd700', 
                                  fontWeight: 600,
                                  fontSize: 16,
                                  display: 'block'
                                }}>
                                  🏞️ DAS Muara Tuhup Watershed
                                </Typography.Text>
                              </div>
                              
                              <div style={{
                                borderRadius: 12,
                                overflow: 'hidden',
                                border: '3px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                              }}>
                                <img 
                                  src={dasMapImage} 
                                  alt="DAS Muara Tuhup Watershed Map"
                                  style={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block'
                                  }}
                                />
                              </div>
                              
                              <div style={{ 
                                marginTop: 16,
                                padding: '12px 16px',
                                backgroundColor: 'rgba(255, 215, 0, 0.2)',
                                borderRadius: 8,
                                border: '1px solid rgba(255, 215, 0, 0.3)'
                              }}>
                                <Typography.Text style={{ 
                                  color: 'rgba(255, 255, 255, 0.95)', 
                                  fontSize: 13,
                                  lineHeight: 1.4
                                }}>
                                  Comprehensive monitoring network with strategically positioned sensors 
                                  throughout the watershed for optimal rainfall and flow data collection.
                                </Typography.Text>
                              </div>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </Card>
                </Collapse.Panel>
              </Collapse>
              
              <V3PerformanceChart v3Data={v3Data} v3TableData={v3TableData} />
              
              <V3PerformanceTable v3TableData={v3TableData} />
              
              <Divider style={{ margin: '32px 0' }}>
                <Typography.Title level={4} type="secondary">
                  Regular Forecast Data
                </Typography.Title>
              </Divider>
            </>
          )}

          {/* Regular Forecast Section */}
          {weeklyData.length > 0 ? (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Title level={2}>
                  {loc === "muara_tuhup" ? "V1 Weekly Forecast" : "Weekly Forecast"}
                </Title>
                <WeeklyForecastGraph loc={loc} weeklyData={weeklyData} />
                <br />
                <WeeklyTableModal tableWeeklyData={tableWeeklyData} />
              </div>
              
              {loc === "muara_tuhup" ? (
                <>
                  <Divider />
                  <Title level={2}>Three Months Forecast</Title>
                  <div className="three-months-forecast-wrapper">
                    <div className="three-months-left">
                      <ThreeMonthsPie loadableData={loadableData} />
                    </div>
                    <div className="three-months-right">
                      <ThreeMonthsCount loadableData={loadableData} />
                      <ThreeMonthsBar loadableData={loadableData} />
                    </div>
                  </div>
                  <div className="three-months-forecast-wrapper">
                    <ThreeMonthsTable monthlyData={monthlyData} />
                  </div>
                </>
              ) : null}
            </>
          ) : (
            <Title>
              {loc === "muara_tuhup" && v3Data.length > 0 
                ? "No Regular Forecast Data Available" 
                : "No Forecast Data Yet"
              }
            </Title>
          )}
        </Space>
      )}
    </>
  );
};

export default ForecastComponent;
