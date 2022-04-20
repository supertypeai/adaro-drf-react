import React, { useState, useEffect } from "react";
import { Skeleton } from "antd";

import DataTable from "./DataTable";
// import DataGraph from "./DataGraph";

const DataComponent = ({ path, loc, locId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/locs/${locId}`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((response) => {
        setData(response);
        setLoading(false);
      })
      .catch((error) => console.log(error));
  }, [path, locId]);
  return (
    <>
      {loading ? (
        <Skeleton active={true} />
      ) : (
        <>
          {/* <DataGraph data={data} loc={loc} /> */}
          <DataTable data={data} loc={loc} />
        </>
      )}{" "}
    </>
  );
};

export default DataComponent;
