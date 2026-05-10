"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { APIService, Location, titleToSlug } from "@/services/api";
import { useAuth } from "./auth-provider";

interface LocationContextValue {
  locations: Location[];
  getLocationBySlug: (slug: string) => Location | undefined;
  isLoading: boolean;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { authTokens } = useAuth();

  useEffect(() => {
    if (!authTokens) {
      setIsLoading(false);
      return;
    }

    const cached = localStorage.getItem("locations");
    if (cached) {
      try {
        setLocations(JSON.parse(cached));
        setIsLoading(false);
        return;
      } catch { /* fall through */ }
    }

    APIService.getLocations()
      .then((data) => {
        setLocations(data);
        localStorage.setItem("locations", JSON.stringify(data));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [authTokens]);

  const getLocationBySlug = (slug: string): Location | undefined =>
    locations.find((loc) => titleToSlug(loc.title) === slug);

  return (
    <LocationContext.Provider value={{ locations, getLocationBySlug, isLoading }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocations() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocations must be used within LocationProvider");
  return ctx;
}
