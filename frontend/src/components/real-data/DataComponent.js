import React, { useState, useEffect } from "react";
import { Skeleton, Space, Grid, DatePicker, Button } from "antd";
import { useLogin } from "../../contexts/UserContext";

import DataGraph from "./DataGraph";
import AddData from "../AddData";
import APIService from "../../APIService";

import "./DataComponent.css";
import EditableTable from "./EditableTable";

const DataComponent = ({ loc, locId, locTitle, locCategory }) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filterDate, setFilterDate] = useState(null);
  const [loading, setLoading] = useState(true);

  const { useBreakpoint } = Grid;
  const { md } = useBreakpoint();
  const { authTokens } = useLogin();

  useEffect(() => {
    setLoading(true);
    APIService.GetData(locId, authTokens.access)
      .then((response) => {
        setData(response);
        setFilteredData(response);
        setLoading(false);
      })
      .catch((error) => console.log(error));
  }, [locId, loc, authTokens]);

  const handleDate = (_, dateString) => {
    setFilterDate(dateString);
  };

  const handleFilter = () => {
    setFilteredData(data.filter((d) => d.date.includes(filterDate)));
  };

  const handleReset = () => {
    setFilteredData(data);
    console.log(data);
    console.log(filteredData);
  };

  return (
    <>
      {loading ? (
        <Skeleton active={true} />
      ) : (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Hides graph when the screen is too small */}
          {md ? (
            <DataGraph
              data={filteredData}
              loc={loc}
              locCategory={locCategory}
            />
          ) : null}

          <div className="button-wrapper">
            <div className="left">
              <AddData
                locId={locId}
                locTitle={locTitle}
                locCategory={locCategory}
                data={data}
                setData={setData}
                filteredData={filteredData}
                setFilteredData={setFilteredData}
              />
            </div>
            <div className="right">
              <DatePicker
                picker="month"
                onChange={handleDate}
                style={{
                  backgroundColor: "#2d3539",
                  width: "200px",
                }}
              />
              <Button key="submit" type="primary" onClick={handleFilter}>
                Filter Date
              </Button>
              <Button key="reset" type="primary" onClick={handleReset} danger>
                Reset
              </Button>
            </div>
          </div>

          {/* <DataTable data={filteredData} setData={setData} loc={loc} locCategory={locCategory} /> */}
          <EditableTable
            filteredData={filteredData}
            setFilteredData={setFilteredData}
            data={data}
            setData={setData}
            loc={loc}
            locCategory={locCategory}
          ></EditableTable>
        </Space>
      )}
    </>
  );
};

export default DataComponent;
