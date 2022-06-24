import React, { useContext, useState, useEffect, createContext } from "react";
import APIService from "../APIService";
import { useLogin } from "./UserContext";

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [locations, setLocations] = useState([]);
  const { authTokens } = useLogin();

  useEffect(() => {
    APIService.GetLocations(authTokens.access).then((response) => {
      setLocations(response);
    });
  }, [authTokens]);
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
