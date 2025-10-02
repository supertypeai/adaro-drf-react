import React, { useState, useMemo } from "react";
import { Card, Table, Typography, Tag, Space, DatePicker, Button, Tooltip } from "antd";
import { DownloadOutlined, InfoCircleOutlined, TableOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";
import customParseFormat from "dayjs/plugin/customParseFormat";

// Configure dayjs plugins
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(customParseFormat);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const V3PerformanceTable = ({ v3TableData }) => {
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, 'days'),
    dayjs()
  ]);

  // Filter data based on date range
  const filteredData = useMemo(() => {
    if (!v3TableData || !dateRange) return [];
    
    const [startDate, endDate] = dateRange;
    return v3TableData.filter(item => {
      const itemDate = dayjs(item.date);
      return itemDate.isAfter(startDate.subtract(1, 'day')) && 
             itemDate.isBefore(endDate.add(1, 'day'));
    }).sort((a, b) => {
      // Sort by date desc, then hour desc (newest first)
      const dateCompare = b.date.localeCompare(a.date);
      return dateCompare !== 0 ? dateCompare : b.hour - a.hour;
    });
  }, [v3TableData, dateRange]);

  const getAccuracyColor = (diff) => {
    if (diff === undefined || diff === null) return 'default';
    if (diff <= 0.25) return 'green';      // Very good (≤ 25cm)
    if (diff <= 0.5) return 'blue';        // Good (≤ 50cm)
    if (diff <= 1.0) return 'orange';      // Fair (≤ 100cm)
    return 'red';                          // Poor (> 100cm)
  };



  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: 'Hour',
      dataIndex: 'hour',
      key: 'hour',
      width: 80,
      sorter: (a, b) => a.hour - b.hour,
      render: (hour) => String(hour).padStart(2, '0') + ':00',
    },
    {
      title: 'Actual (m)',
      dataIndex: 'actual',
      key: 'actual',
      width: 100,
      render: (value) => value?.toFixed(2) || 'N/A',
      sorter: (a, b) => (a.actual || 0) - (b.actual || 0),
    },
    {
      title: '1-Day Pred (m)',
      dataIndex: 'pred_1d',
      key: 'pred_1d',
      width: 120,
      render: (value) => value?.toFixed(2) || 'N/A',
      sorter: (a, b) => (a.pred_1d || 0) - (b.pred_1d || 0),
    },
    {
      title: (
        <Space>
          1D Error
          <Tooltip title="Absolute difference between actual and 1-day prediction">
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'diff_1d',
      key: 'diff_1d',
      width: 120,
      render: (diff) => (
        <Tag color={getAccuracyColor(diff)}>
          {diff !== undefined ? `${(diff * 100).toFixed(0)}cm` : 'N/A'}
        </Tag>
      ),
      sorter: (a, b) => (a.diff_1d || 0) - (b.diff_1d || 0),
    },
    {
      title: '2-Day Pred (m)',
      dataIndex: 'pred_2d',
      key: 'pred_2d',
      width: 120,
      render: (value) => value?.toFixed(2) || 'N/A',
      sorter: (a, b) => (a.pred_2d || 0) - (b.pred_2d || 0),
    },
    {
      title: (
        <Space>
          2D Error
          <Tooltip title="Absolute difference between actual and 2-day prediction">
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'diff_2d',
      key: 'diff_2d',
      width: 120,
      render: (diff) => (
        <Tag color={getAccuracyColor(diff)}>
          {diff !== undefined ? `${(diff * 100).toFixed(0)}cm` : 'N/A'}
        </Tag>
      ),
      sorter: (a, b) => (a.diff_2d || 0) - (b.diff_2d || 0),
    },
    {
      title: '3-Day Pred (m)',
      dataIndex: 'pred_3d',
      key: 'pred_3d',
      width: 120,
      render: (value) => value?.toFixed(2) || 'N/A',
      sorter: (a, b) => (a.pred_3d || 0) - (b.pred_3d || 0),
    },
    {
      title: (
        <Space>
          3D Error
          <Tooltip title="Absolute difference between actual and 3-day prediction">
            <InfoCircleOutlined />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'diff_3d',
      key: 'diff_3d',
      width: 120,
      render: (diff) => (
        <Tag color={getAccuracyColor(diff)}>
          {diff !== undefined ? `${(diff * 100).toFixed(0)}cm` : 'N/A'}
        </Tag>
      ),
      sorter: (a, b) => (a.diff_3d || 0) - (b.diff_3d || 0),
    },
    {
      title: 'Best Prediction',
      key: 'best_prediction',
      width: 120,
      render: (_, record) => {
        if (!record.actual || (!record.diff_1d && !record.diff_2d && !record.diff_3d)) {
          return <Text type="secondary">N/A</Text>;
        }
        
        const diffs = [
          { key: '1D', value: record.diff_1d },
          { key: '2D', value: record.diff_2d },
          { key: '3D', value: record.diff_3d },
        ].filter(d => d.value !== undefined);
        
        if (!diffs.length) return <Text type="secondary">N/A</Text>;
        
        const best = diffs.reduce((min, curr) => 
          curr.value < min.value ? curr : min
        );
        
        return (
          <Tag color="gold">
            {best.key} ({(best.value * 100).toFixed(0)}cm)
          </Tag>
        );
      },
    },
  ];

  const exportData = () => {
    const csvContent = [
      // Header
      ['Date', 'Hour', 'Actual', 'Pred_1d', 'Error_1d_cm', 'Pred_2d', 'Error_2d_cm', 'Pred_3d', 'Error_3d_cm'].join(','),
      // Data rows
      ...filteredData.map(row => [
        row.date,
        row.hour,
        row.actual?.toFixed(2) || '',
        row.pred_1d?.toFixed(2) || '',
        row.diff_1d ? (row.diff_1d * 100).toFixed(0) : '',
        row.pred_2d?.toFixed(2) || '',
        row.diff_2d ? (row.diff_2d * 100).toFixed(0) : '',
        row.pred_3d?.toFixed(2) || '',
        row.diff_3d ? (row.diff_3d * 100).toFixed(0) : '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `v3_performance_${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TableOutlined style={{ color: '#1890ff' }} />
              V3 Performance Data Table
              <Tooltip title="Detailed breakdown of forecast accuracy with error metrics">
                <InfoCircleOutlined style={{ color: '#8c8c8c', fontSize: 16 }} />
              </Tooltip>
            </Title>
            <Text type="secondary">
              Compare predictions with actual measurements • Color coding: Green (≤25cm), Blue (≤50cm), Orange (≤100cm), Red (&gt;100cm)
            </Text>
          </div>
          
          <Space>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="YYYY-MM-DD"
              allowClear={false}
              placeholder={['Start Date', 'End Date']}
            />
            <Button 
              icon={<DownloadOutlined />} 
              onClick={exportData}
              disabled={!filteredData.length}
            >
              Export CSV
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(record) => `${record.date}-${record.hour}`}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Space>
    </Card>
  );
};

export default V3PerformanceTable;