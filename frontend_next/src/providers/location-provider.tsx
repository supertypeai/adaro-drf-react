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
        const usedLocations = [11, 9, 7, 8, 10];
        const filteredLocations = usedLocations
          .map((id) => data.find(item => item.id == id))
          .filter((item) => item !== undefined);
        setLocations(filteredLocations);
        localStorage.setItem("locations", JSON.stringify(filteredLocations));
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
