import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, DatePicker, Space, Typography, Row, Col, Segmented, Tooltip, Button, Collapse } from "antd";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { InfoCircleOutlined, TrophyOutlined, AimOutlined, LineChartOutlined, BarChartOutlined, QuestionCircleOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";
import customParseFormat from "dayjs/plugin/customParseFormat";


// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  ChartTooltip,
  Legend
);

// Configure dayjs plugins
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(customParseFormat);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const V3PerformanceChart = ({ v3TableData }) => {
  const availableDateRange = useMemo(() => {
    if (!v3TableData || v3TableData.length === 0) {
      return { minDate: dayjs().subtract(7, 'days'), maxDate: dayjs() };
    }
    const dates = v3TableData.map(item => dayjs(item.date)).filter(date => date.isValid());
    if (dates.length === 0) {
      return { minDate: dayjs().subtract(60, 'days'), maxDate: dayjs().add(10, 'days') };
    }
    let minDate = dates[0];
    let maxDate = dates[0];
    dates.forEach(date => {
      if (date.isBefore(minDate)) minDate = date;
      if (date.isAfter(maxDate)) maxDate = date;
    });
    return { minDate, maxDate };
  }, [v3TableData]);

  const [dateRange, setDateRange] = useState([
    availableDateRange.minDate.isAfter(dayjs().subtract(7, 'days')) ?
      availableDateRange.minDate : dayjs().subtract(7, 'days'),
    availableDateRange.maxDate.isBefore(dayjs()) ?
      availableDateRange.maxDate : dayjs()
  ]);

  const [viewMode, setViewMode] = useState('latest_vs_actual');
  const [showRainForecast, setShowRainForecast] = useState(true);
  const [rainForecastMode, setRainForecastMode] = useState('1d');

  useEffect(() => {
    setDateRange([
      availableDateRange.minDate.isAfter(dayjs().subtract(7, 'days')) ?
        availableDateRange.minDate : dayjs().subtract(7, 'days'),
      availableDateRange.maxDate.isBefore(dayjs()) ?
        availableDateRange.maxDate : dayjs()
    ]);
  }, [availableDateRange]);

  const filteredTableData = useMemo(() => {
    if (!v3TableData || !dateRange) return [];
    const [startDate, endDate] = dateRange;
    return v3TableData.filter(item => {
      if (viewMode === 'latest_vs_actual') return true;
      const itemDate = dayjs(item.date);
      return itemDate.isAfter(startDate.subtract(1, 'day')) && itemDate.isBefore(endDate.add(1, 'day'));
    }).sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      return dateCompare !== 0 ? dateCompare : a.hour - b.hour;
    });
  }, [v3TableData, dateRange, viewMode]);

  const performanceStats = useMemo(() => {
    if (!filteredTableData.length) return {};
    const validData = filteredTableData.filter(item =>
      item.actual !== null && item.pred_1d !== null && item.pred_2d !== null && item.pred_3d !== null
    );
    if (!validData.length) return {};
    const calculateStats = (diffKey) => {
      const diffs = validData.map(item => item[diffKey]).filter(d => d !== undefined && d !== null);
      if (!diffs.length) return { mae: 0, accuracy: 0, withinGreenZone: 0 };
      const mae = diffs.reduce((sum, diff) => sum + Math.abs(diff), 0) / diffs.length * 100; // in cm
      const accuracy = diffs.filter(diff => Math.abs(diff) <= 0.5).length / diffs.length * 100;
      const withinGreenZone = diffs.filter(diff => Math.abs(diff) * 100 <= 20).length / diffs.length * 100;
      return { mae: mae.toFixed(2), accuracy: accuracy.toFixed(1), withinGreenZone: withinGreenZone.toFixed(1) };
    };
    return {
      pred_1d: calculateStats('diff_1d'),
      pred_2d: calculateStats('diff_2d'),
      pred_3d: calculateStats('diff_3d'),
      totalMeasurements: validData.length,
    };
  }, [filteredTableData]);

  const chartData = useMemo(() => {
    if (!filteredTableData || filteredTableData.length === 0) {
      return { waterLevelChartData: null, rainChartData: null };
    }

    if (viewMode === 'latest_vs_actual') {
      const sortedData = [...filteredTableData];
      const actualRecords = sortedData.filter(item => item.actual !== null);
      const recentActual = actualRecords.slice(-72);
      if (recentActual.length === 0) return { waterLevelChartData: null, rainChartData: null };
      const actualData = recentActual.map(item => item.actual);
      const actualLabels = recentActual.map(item => `${item.date} ${String(item.hour).padStart(2, '0')}:00`);
      const lastActualItem = recentActual[recentActual.length - 1];
      const lastDate = dayjs(`${lastActualItem.date} ${String(lastActualItem.hour).padStart(2, '0')}:00`);
      const predictionData = [];
      const predictionLabels = [];
      for (let hour = 1; hour <= 72; hour++) {
        const futureTime = lastDate.add(hour, 'hour');
        predictionLabels.push(futureTime.format('YYYY-MM-DD HH:00'));
        const hourRecord = sortedData.find(record => dayjs(`${record.date} ${String(record.hour).padStart(2, '0')}:00`).isSame(futureTime));
        let predValue = null;
        if (hourRecord) {
          if (hour <= 24) predValue = hourRecord.pred_1d;
          else if (hour <= 48) predValue = hourRecord.pred_2d;
          else predValue = hourRecord.pred_3d;
        }
        predictionData.push(predValue);
      }
      const allLabels = [...actualLabels, ...predictionLabels];
      const finalData = {
        labels: allLabels,
        datasets: [
          { label: 'Actual Water Level', data: [...actualData, ...new Array(72).fill(null)], borderColor: '#ff4d4f', borderWidth: 2, tension: 0.3, pointRadius: 2 },
          { label: 'Forecast (1d→2d→3d ahead)', data: [...new Array(actualData.length).fill(null), ...predictionData], borderColor: '#52c41a', borderDash: [5, 3], borderWidth: 2, tension: 0.3, pointRadius: 2 },
        ],
      };

      let rainChartData = null;
      if (showRainForecast) {
        const actualRainData = recentActual.map(item => {
          return item.rain_actual || item.rainfall || item.rain || item.rain_observed || item.actual_rain || 0;
        });
        const predictionRainData = [];
        for (let hour = 1; hour <= 72; hour++) {
          const futureTime = lastDate.add(hour, 'hour');
          const hourRecord = sortedData.find(record =>
            dayjs(`${record.date} ${String(record.hour).padStart(2, '0')}:00`).isSame(futureTime)
          );
          let rainPredValue = null;
          if (hourRecord) {
            if (hour <= 24) rainPredValue = hourRecord.rain_forecast_1d;
            else if (hour <= 48) rainPredValue = hourRecord.rain_forecast_2d;
            else rainPredValue = hourRecord.rain_forecast_3d;
          }
          predictionRainData.push(rainPredValue || 0);
        }
        rainChartData = {
          labels: allLabels,
          datasets: [
            {
              label: 'Actual Rainfall (72h)',
              data: [...actualRainData, ...new Array(72).fill(null)],
              backgroundColor: 'rgba(64, 169, 255, 0.6)',
              type: 'bar'
            },
            {
              label: 'Rain Forecast (72h)',
              data: [...new Array(actualData.length).fill(null), ...predictionRainData],
              backgroundColor: 'rgba(135, 208, 104, 0.6)',
              type: 'bar'
            },
          ],
        };
      }
      return { waterLevelChartData: finalData, rainChartData };
    }

    if (viewMode === 'error_analysis') {
      const dateTimeLabels = [];
      const error1dData = [], error2dData = [], error3dData = [];
      filteredTableData.forEach(item => {
        if (item.actual !== null && item.diff_1d !== null) {
          dateTimeLabels.push(`${item.date} ${String(item.hour).padStart(2, '0')}:00`);
          error1dData.push(Math.abs(item.diff_1d) * 100);
          error2dData.push(item.diff_2d !== null ? Math.abs(item.diff_2d) * 100 : null);
          error3dData.push(item.diff_3d !== null ? Math.abs(item.diff_3d) * 100 : null);
        }
      });
      const finalData = {
        labels: dateTimeLabels,
        datasets: [
          { label: '1-Day Forecast Error', data: error1dData, backgroundColor: (ctx) => ctx.parsed.y <= 20 ? 'rgba(115, 209, 61, 0.8)' : 'rgba(255, 120, 117, 0.8)', order: 1 },
          { label: '2-Day Forecast Error', data: error2dData, backgroundColor: (ctx) => ctx.parsed.y <= 20 ? 'rgba(250, 173, 20, 0.8)' : 'rgba(255, 158, 158, 0.8)', order: 2 },
          { label: '3-Day Forecast Error', data: error3dData, backgroundColor: (ctx) => ctx.parsed.y <= 20 ? 'rgba(135, 208, 104, 0.8)' : 'rgba(255, 189, 189, 0.8)', order: 3 },
          { label: 'Green Zone Threshold (≤20cm)', data: new Array(dateTimeLabels.length).fill(20), type: 'line', borderColor: '#52c41a', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: 'origin', order: 0 },
        ],
      };
      return { waterLevelChartData: finalData, rainChartData: null };
    }

    if (viewMode === 'historical_forecasts') {
      const labels = filteredTableData.map(item => `${item.date} ${String(item.hour).padStart(2, '0')}:00`);
      const waterLevelChartData = {
        labels,
        datasets: [
          { label: 'Actual Water Level', data: filteredTableData.map(d => d.actual), borderColor: '#ffffff', borderWidth: 4, pointRadius: 2, tension: 0.3, order: 1 },
          { label: '1-Day Forecast', data: filteredTableData.map(d => d.pred_1d), borderColor: 'rgba(115, 209, 61, 0.8)', showLine: false, pointRadius: 2, order: 2 },
          { label: '2-Day Forecast', data: filteredTableData.map(d => d.pred_2d), borderColor: 'rgba(250, 173, 20, 0.8)', showLine: false, pointRadius: 2, order: 3 },
          { label: '3-Day Forecast', data: filteredTableData.map(d => d.pred_3d), borderColor: 'rgba(255, 120, 117, 0.8)', showLine: false, pointRadius: 2, order: 4 },
        ]
      };
      let rainDatasets = [];
      if (showRainForecast) {
        const rain1d = filteredTableData.map(d => d.rain_forecast_1d);
        const rain2d = filteredTableData.map(d => d.rain_forecast_2d);
        const rain3d = filteredTableData.map(d => d.rain_forecast_3d);
        const actualRain = filteredTableData.map(d => d.rain_actual || d.rainfall || d.rain || d.rain_observed || d.actual_rain || null);

        if (rainForecastMode === '1d') {
          rainDatasets.push({ label: '1-Day Rain Forecast', data: rain1d, type: 'bar', backgroundColor: 'rgba(64, 169, 255, 0.5)' });
          rainDatasets.push({ label: 'Actual Rain', data: actualRain, type: 'bar', backgroundColor: 'rgba(255, 77, 79, 0.7)' });
        }
        else if (rainForecastMode === '2d') {
          rainDatasets.push({ label: '2-Day Rain Forecast', data: rain2d, type: 'bar', backgroundColor: 'rgba(135, 208, 104, 0.5)' });
          rainDatasets.push({ label: 'Actual Rain', data: actualRain, type: 'bar', backgroundColor: 'rgba(255, 77, 79, 0.7)' });
        }
        else if (rainForecastMode === '3d') {
          rainDatasets.push({ label: '3-Day Rain Forecast', data: rain3d, type: 'bar', backgroundColor: 'rgba(255, 195, 18, 0.5)' });
          rainDatasets.push({ label: 'Actual Rain', data: actualRain, type: 'bar', backgroundColor: 'rgba(255, 77, 79, 0.7)' });
        }
        else if (rainForecastMode === 'all') {
          rainDatasets.push({ label: 'Actual Rain', data: actualRain, type: 'bar', backgroundColor: 'rgba(255, 77, 79, 0.7)' });
          rainDatasets.push({ label: '1-Day Rain', data: rain1d, type: 'bar', backgroundColor: 'rgba(64, 169, 255, 0.6)' });
          rainDatasets.push({ label: '2-Day Rain', data: rain2d, type: 'bar', backgroundColor: 'rgba(135, 208, 104, 0.6)' });
          rainDatasets.push({ label: '3-Day Rain', data: rain3d, type: 'bar', backgroundColor: 'rgba(255, 195, 18, 0.6)' });
        }
      }
      const rainChartData = { labels, datasets: rainDatasets };
      return { waterLevelChartData, rainChartData };
    }

    return { waterLevelChartData: null, rainChartData: null };
  }, [filteredTableData, viewMode, showRainForecast, rainForecastMode]);

  const getChartOptions = useCallback(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { color: '#ffffff', usePointStyle: true, padding: 20 } },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          callbacks: {
            title: (ctx) => dayjs(ctx[0].label).format('MMM DD, YYYY HH:mm'),
            label: (ctx) => {
              const label = ctx.dataset.label || '';
              const value = ctx.parsed.y;
              if (value === null || value === undefined) return null;
              const unit = viewMode === 'error_analysis' ? 'cm' : 'm';
              return `${label}: ${value.toFixed(2)} ${unit}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#ffffff',
            maxTicksLimit: 8,
            callback: function (value, index, values) {
              const label = this.getLabelForValue(value);
              if (viewMode === 'latest_vs_actual') {
                if (index % 12 === 0) {
                  return dayjs(label).format('MMM DD HH:mm');
                }
                return '';
              }
              if (index % 6 === 0) {
                return dayjs(label).format('MMM DD HH:mm');
              }
              return '';
            }
          },
          grid: { color: '#3a3a3a' }
        },
        y: {
          title: { display: true, text: viewMode === 'error_analysis' ? 'Absolute Prediction Error (cm)' : 'Water Level (m)', color: '#ffffff' },
          ticks: { color: '#ffffff' },
          grid: { color: '#3a3a3a' },
          beginAtZero: viewMode === 'error_analysis',
        }
      }
    };
  }, [viewMode]);

  const getHistoricalRainOptions = useCallback(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { color: '#ffffff', usePointStyle: true } },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const value = ctx.parsed.y;
              if (value === null || value === undefined) return null;
              return `${ctx.dataset.label}: ${value.toFixed(2)} mm`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#ffffff',
            maxTicksLimit: 8,
            callback: function (value, index, values) {
              const label = this.getLabelForValue(value);
              if (index % 6 === 0) {
                return dayjs(label).format('MMM DD HH:mm');
              }
              return '';
            }
          },
          grid: { color: '#3a3a3a' }
        },
        y: {
          title: { display: true, text: 'Rainfall (mm)', color: '#ffffff' },
          ticks: { color: '#ffffff' },
          grid: { color: '#3a3a3a' },
          beginAtZero: true,
        }
      }
    };
  }, []);

  const getChartTitle = () => {
    switch (viewMode) {
      case 'latest_vs_actual':
        return 'Continuous Forecast Timeline';
      case 'historical_forecasts':
        return 'Historical Forecast Analysis';
      case 'error_analysis':
        return 'Forecast Error Analysis';
      default:
        return 'Water Level Analysis';
    }
  };

  const getChartDescription = () => {
    switch (viewMode) {
      case 'latest_vs_actual':
        return 'Real-time forecast showing the last 72 hours of actual measurements connected to the next 72 hours of dynamic predictions.';
      case 'historical_forecasts':
        return 'Historical comparison of all forecast horizons (1-day, 2-day, 3-day predictions) against actual water levels.';
      case 'error_analysis':
        return 'Analyze prediction errors in centimeters. Lower values indicate better forecast accuracy.';
      default:
        return 'Comprehensive water level analysis and forecasting system.';
    }
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrophyOutlined style={{ color: '#1890ff' }} />
              {getChartTitle()}
              <Tooltip title="Advanced forecast performance analysis with multiple viewing modes">
                <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 16 }} />
              </Tooltip>
            </Title>
            <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
              {getChartDescription()}
            </Text>
          </div>
          <Space wrap align="end">
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>Date Range:</Text>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                format="YYYY-MM-DD"
                allowClear={false}
                size="small"
                style={{ width: 240 }}
                disabledDate={(current) => current && (current.isBefore(availableDateRange.minDate, 'day') || current.isAfter(availableDateRange.maxDate, 'day'))}
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>Analysis Mode:</Text>
              <Segmented
                options={[
                  { label: 'Latest vs Actual', value: 'latest_vs_actual', icon: <AimOutlined /> },
                  { label: 'Historical', value: 'historical_forecasts', icon: <LineChartOutlined /> },
                  { label: 'Error Analysis', value: 'error_analysis', icon: <BarChartOutlined /> },
                ]}
                value={viewMode}
                onChange={setViewMode}
                size="small"
              />
            </div>
            {(viewMode === 'historical_forecasts' || viewMode === 'latest_vs_actual') && (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Rain Forecast:</Text>
                <Button.Group size="small">
                  <Button
                    type={!showRainForecast ? "primary" : "default"}
                    onClick={() => setShowRainForecast(false)}
                  >
                    Hide
                  </Button>
                  {viewMode === 'historical_forecasts' && (
                    <>
                    <Button type={showRainForecast && rainForecastMode === '1d' ? "primary" : "default"} onClick={() => { setShowRainForecast(true); setRainForecastMode('1d'); }}>1D</Button>
                    <Button type={showRainForecast && rainForecastMode === '2d' ? "primary" : "default"} onClick={() => { setShowRainForecast(true); setRainForecastMode('2d'); }}>2D</Button>
                    <Button type={showRainForecast && rainForecastMode === '3d' ? "primary" : "default"} onClick={() => { setShowRainForecast(true); setRainForecastMode('3d'); }}>3D</Button>
                    <Button type={showRainForecast && rainForecastMode === 'all' ? "primary" : "default"} onClick={() => { setShowRainForecast(true); setRainForecastMode('all'); }}>All</Button>
                    </>
                  )}
                   {viewMode === 'latest_vs_actual' && (
                     <Button type={showRainForecast ? "primary" : "default"} onClick={() => setShowRainForecast(true)}>Show</Button>
                   )}
                </Button.Group>
              </div>
            )}
          </Space>
        </div>

        {Object.keys(performanceStats).length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 24
          }}>
            <Row gutter={[24, 16]} align="middle">
              <Col xs={24} sm={6}>
                <div style={{ textAlign: 'center', color: '#ffffff' }}>
                  <div style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 4 }}>
                    {performanceStats.totalMeasurements || 0}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.9 }}>Total Comparisons</div>
                </div>
              </Col>
              <Col xs={24} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#52c41a' }}></div>
                    <span style={{ color: '#ffffff', fontSize: 12 }}>1-Day Forecast</span>
                  </div>
                  <div style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>
                    {performanceStats.pred_1d?.mae || '0'} cm
                  </div>
                  <div style={{ color: '#ffffff', fontSize: 11, opacity: 0.8 }}>
                    {performanceStats.pred_1d?.withinGreenZone || '0'}% in green zone
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#faad14' }}></div>
                    <span style={{ color: '#ffffff', fontSize: 12 }}>2-Day Forecast</span>
                  </div>
                  <div style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>
                    {performanceStats.pred_2d?.mae || '0'} cm
                  </div>
                  <div style={{ color: '#ffffff', fontSize: 11, opacity: 0.8 }}>
                    {performanceStats.pred_2d?.withinGreenZone || '0'}% in green zone
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff7875' }}></div>
                    <span style={{ color: '#ffffff', fontSize: 12 }}>3-Day Forecast</span>
                  </div>
                  <div style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>
                    {performanceStats.pred_3d?.mae || '0'} cm
                  </div>
                  <div style={{ color: '#ffffff', fontSize: 11, opacity: 0.8 }}>
                    {performanceStats.pred_3d?.withinGreenZone || '0'}% in green zone
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}

        <Collapse bordered={false} style={{ marginBottom: 24, backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(24, 144, 255, 0.3)', borderRadius: 8 }}>
            <Panel header={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <QuestionCircleOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                    <Title level={5} style={{ color: '#ffffff', margin: 0 }}>
                        What do 1-Day, 2-Day, and 3-Day forecasts mean?
                    </Title>
                </div>
            } key="1" style={{ border: 'none' }}>
                <Row gutter={[24, 16]}>
                    <Col xs={24} md={8}>
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}>1D</div>
                            <Title level={5} style={{ color: '#52c41a', margin: 0 }}>1-Day Forecast</Title>
                        </div>
                        <Text style={{ color: '#ffffff', display: 'block', textAlign: 'center' }}>
                            Weather prediction made <strong>1 day prior</strong> to the actual measurement time. This is the most recent and typically most accurate forecast.
                        </Text>
                    </Col>
                    <Col xs={24} md={8}>
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#faad14', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}>2D</div>
                            <Title level={5} style={{ color: '#faad14', margin: 0 }}>2-Day Forecast</Title>
                        </div>
                        <Text style={{ color: '#ffffff', display: 'block', textAlign: 'center' }}>
                            Weather prediction made <strong>2 days prior</strong> to the actual measurement time. Medium-range forecast with moderate accuracy.
                        </Text>
                    </Col>
                    <Col xs={24} md={8}>
                         <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#ff7875', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 18, fontWeight: 'bold', color: '#ffffff' }}>3D</div>
                            <Title level={5} style={{ color: '#ff7875', margin: 0 }}>3-Day Forecast</Title>
                        </div>
                        <Text style={{ color: '#ffffff', display: 'block', textAlign: 'center' }}>
                           Weather prediction made <strong>3 days prior</strong> to the actual measurement time. Long-range forecast with higher uncertainty.
                        </Text>
                    </Col>
                </Row>
                <div style={{ marginTop: 20, padding: 16, backgroundColor: 'rgba(24, 144, 255, 0.1)', borderRadius: 6, border: '1px solid rgba(24, 144, 255, 0.2)' }}>
                    <Text style={{ color: '#1890ff', fontWeight: 500, display: 'block', marginBottom: 8 }}>💡 How it works:</Text>
                    <Text style={{ color: '#ffffff', fontSize: 14 }}>
                        For example, if we're analyzing rainfall on January 15th at 12:00 PM:
                        <br />• <strong>1-Day forecast</strong> = Prediction made on January 14th for January 15th
                        <br />• <strong>2-Day forecast</strong> = Prediction made on January 13th for January 15th
                        <br />• <strong>3-Day forecast</strong> = Prediction made on January 12th for January 15th
                        <br /><br />
                        Generally, shorter-term forecasts (1-Day) are more accurate than longer-term forecasts (3-Day).
                    </Text>
                </div>
            </Panel>
        </Collapse>

        <div style={{ height: 450, padding: '0 8px' }}>
          {chartData.waterLevelChartData && chartData.waterLevelChartData.labels?.length > 0 ? (
            viewMode === 'error_analysis' ? (
              <Bar data={chartData.waterLevelChartData} options={getChartOptions()} />
            ) : (
              <Line data={chartData.waterLevelChartData} options={getChartOptions()} />
            )
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text type="secondary">No data for selected period.</Text>
            </div>
          )}
        </div>

        {(viewMode === 'historical_forecasts' || viewMode === 'latest_vs_actual') && showRainForecast && chartData.rainChartData && chartData.rainChartData.datasets.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <Title level={5} style={{ padding: '0 8px' }}>🌧️ Rainfall Forecast</Title>
            <div style={{ height: 250, padding: '0 8px' }}>
              <Bar data={chartData.rainChartData} options={getHistoricalRainOptions()} />
            </div>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default V3PerformanceChart;

