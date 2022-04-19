import { useState, useEffect } from "react";
import "./App.css";
import "antd/dist/antd.css";

const App = () => {
  const [locations, setLocations] = useState([]);

  const fetchData = async () => {
    try {
      fetch("http://127.0.0.1:8000/api/locs/", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => response.json())
        .then((resp) => {
          setLocations(resp);
        });
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      {locations.map((location) => {
        return (
          <div className="location-card" key={location.id}>
            <h2>{location.name}</h2>
            <p>{location.longitude}</p>
            <p>{location.latitude}</p>
          </div>
        );
      })}
    </>
  );
};

export default App;
