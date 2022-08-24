import React, { useEffect, useState } from "react";
import { Table } from "antd";
import './ThreeMonthsTable.css';

function ThreeMonthsTable({ monthlyData }) {
    const dataSource = [];
    Object.entries(monthlyData).forEach(([year, values]) => {
        let temp = {
            key: year,
            year: year,
            ...values
        };
        dataSource.push(temp);
    });

    const columns = [{
        title: 'Year',
        dataIndex: 'year',
        key: 'year'
    }];

    Object.keys(monthlyData['2018']).forEach((key) => {
        let temp = {
            title: key,
            dataIndex: key,
        }
        columns.push(temp)
    })

    console.log(columns)
    console.log(dataSource)

    return (
        <Table rowClassName={(record, index) => index === Object.keys(monthlyData).length - 1 ? 'table-row-highlighted' : ''} dataSource={dataSource} columns={columns} bordered />
    )
}

export default ThreeMonthsTable