import React, { useContext, useState, useEffect, createContext } from "react";

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [locations, setLocations] = useState([]);
  useEffect(() => {
    async function fetchLocation() {
      fetch("http://localhost:8000/api/locs/")
        .then((resp) => resp.json())
        .then((data) => setLocations(data));
    }
    fetchLocation();
  }, []);
  return (
    <LocationContext.Provider
      value={{
        locations,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useAPI() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("Context must be used within a Provider");
  }
  return context;
}
