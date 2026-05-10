"use client";

import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { useRouter } from "next/navigation";
import { Location, titleToSlug } from "@/services/api";

interface MapSectionProps {
  locations: Location[];
}

export function MapSection({ locations }: MapSectionProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const router = useRouter();

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
      />
      {locations.map((loc) => (
        <AdvancedMarker
          key={loc.id}
          title={loc.sensor ? `${loc.title} - Sensor` : loc.title}
          onClick={() => handleClick(loc)}
          position={{ lat: loc.latitude, lng: loc.longitude }}
        >
          <Pin
            background={loc.sensor ? "#f40707" : "#07a4f4"}
            glyphColor="#000"
            borderColor="#000"
          />
        </AdvancedMarker>
      ))}
    </APIProvider>
  );
}
