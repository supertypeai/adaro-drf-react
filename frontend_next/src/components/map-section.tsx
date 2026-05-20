"use client";

import { useEffect, useState } from "react";
import { APIProvider, Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { useRouter } from "next/navigation";
import { Circle } from "lucide-react";
import { Location, titleToSlug } from "@/services/api";
import { useLocations } from "@/providers/location-provider";

/** Pulsing dot — used for active sensor locations */
const SensorMarker = ({ color }: { color: string }) => (
  <div style={{ position: "relative", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div
      className="map-pulse-ring"
      style={{ backgroundColor: color }}
    />
    <div style={{
      width: "18px",
      height: "18px",
      backgroundColor: color,
      borderRadius: "50%",
      border: "3px solid white",
      boxShadow: "0 0 10px rgba(0,0,0,0.55)",
      position: "relative",
      zIndex: 1,
    }} />
  </div>
);

/** Glassmorphic chip — used for named non-sensor locations */
const StatusChip = ({ title, color }: { title: string; color: string }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.88)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    padding: "4px 10px",
    borderRadius: "20px",
    border: `2px solid ${color}`,
    fontSize: "11px",
    fontWeight: 700,
    color: "#111",
    whiteSpace: "nowrap",
    boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
    gap: "6px",
    letterSpacing: "0.01em",
  }}>
    <span style={{ width: "8px", height: "8px", backgroundColor: color, borderRadius: "50%", flexShrink: 0 }} />
    {title}
  </div>
);

interface CoordinatePoint {
  id: number;
  latitude: number;
  longitude: number;
  rowIndex: number;
  colIndex: number;
}

function parseCoordinatesCsv(csvText: string): CoordinatePoint[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const idIndex = headers.indexOf("id");
  const latitudeIndex = headers.indexOf("actual_y");
  const longitudeIndex = headers.indexOf("actual_x");
  const rowIndex = headers.indexOf("row_index");
  const colIndex = headers.indexOf("col_index");

  if (
    idIndex === -1
    || latitudeIndex === -1
    || longitudeIndex === -1
    || rowIndex === -1
    || colIndex === -1
  ) {
    return [];
  }

  return lines
    .slice(1)
    .map((line) => line.split(",").map((v) => v.trim()))
    .map((values) => ({
      id: Number(values[idIndex]),
      latitude: Number(values[latitudeIndex]),
      longitude: Number(values[longitudeIndex]),
      rowIndex: Number(values[rowIndex]),
      colIndex: Number(values[colIndex]),
    }))
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
}

function WatershedOverlay() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    let isMounted = true;
    const addedFeatures: unknown[] = [];

    const loadGeoJson = async () => {
      try {
        const response = await fetch("/tuhup_watershed.geojson");
        if (!response.ok) {
          throw new Error(`Failed to fetch GeoJSON: ${response.status}`);
        }

        const geoJson = await response.json();
        if (!isMounted) return;

        const features = map.data.addGeoJson(geoJson as never);
        addedFeatures.push(...features);
        map.data.setStyle({
          fillColor: "#58d68d",
          fillOpacity: 0.2,
          strokeColor: "#2ecc71",
          strokeOpacity: 0.9,
          strokeWeight: 2,
        });
      } catch (error) {
        console.error("Failed to load watershed GeoJSON", error);
      }
    };

    loadGeoJson();

    return () => {
      isMounted = false;
      addedFeatures.forEach((feature) => map.data.remove(feature as never));
    };
  }, [map]);

  return null;
}

export function MapSection() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const router = useRouter();
  const { locations } = useLocations();
  const [coordinatePoints, setCoordinatePoints] = useState<CoordinatePoint[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadCoordinates = async () => {
      try {
        const response = await fetch("/coordinates.csv");
        if (!response.ok) {
          throw new Error(`Failed to fetch coordinates CSV: ${response.status}`);
        }

        const csvText = await response.text();
        if (!isMounted) return;

        setCoordinatePoints(parseCoordinatesCsv(csvText));
      } catch (error) {
        console.error("Failed to load coordinate points", error);
      }
    };

    loadCoordinates();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleClick = (loc: Location) => {
    router.push(`/${titleToSlug(loc.title)}`);
  };

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        style={{ width: "100%", height: "100%" }}
        defaultCenter={{ lat: -1, lng: 114.89 }}
        defaultZoom={10}
        mapId="b83c2252d6cb7543"
        mapTypeId="satellite"
      >
        <WatershedOverlay />
        {locations.map((loc) => (
          <AdvancedMarker
            key={loc.id}
            title={loc.sensor ? `${loc.title} - Sensor` : loc.title}
            onClick={() => handleClick(loc)}
            position={{ lat: loc.latitude, lng: loc.longitude }}
          >
            {loc.sensor
              ? <SensorMarker color="#3b82f6" />
              : <StatusChip title={loc.title} color="#38bdf8" />}
          </AdvancedMarker>
        ))}

        {coordinatePoints.map((point) => (
          <AdvancedMarker
            key={`coord-${point.id}`}
            title={`Grid (${point.rowIndex}, ${point.colIndex})`}
            position={{ lat: point.latitude, lng: point.longitude }}
            collisionBehavior="OPTIONAL_AND_HIDES_LOWER_PRIORITY"
          >
            <div style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.6))" }}>
              <Circle size={13} fill="#2ebfcc" color="#2ecc71" strokeWidth={2} />
            </div>
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}
