import React, { useContext, useState, useEffect, createContext } from "react";
import APIService from "./APIService";

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [locations, setLocations] = useState([]);
  useEffect(() => {
    APIService.GetLocations().then((response) => {
      setLocations(response);
    });
  }, []);
  return (
    <LocationContext.Provider
      value={{
        locations,
        setLocations,
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
