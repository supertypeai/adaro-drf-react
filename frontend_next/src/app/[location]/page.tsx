"use client";

import { useParams, useRouter } from "next/navigation";
import { useLocations } from "@/providers/location-provider";
import { LocationDataView } from "@/components/location-data-view";
import { LocationForecastView } from "@/components/location-forecast-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function LocationPage() {
  const params = useParams();
  const router = useRouter();
  const { getLocationBySlug } = useLocations();
  const slug = params.location as string;

  const location = getLocationBySlug(slug);

  if (!location) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Location Not Found</h2>
          <p className="text-muted-foreground">No location matches &quot;{slug}&quot;</p>
          <button
            onClick={() => router.push("/")}
            className="text-primary hover:underline"
          >
            ← Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto w-full">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{location.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{location.title}</h1>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            location.sensor
              ? "bg-red-500/15 text-red-400"
              : "bg-blue-500/15 text-blue-400"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${location.sensor ? "bg-red-500" : "bg-blue-400"}`} />
          {location.sensor ? "Sensor" : "Manual"}
        </span>
      </div>

      {/* Tabs merging Data + Forecast into one page */}
      <Tabs defaultValue="data" className="w-full">
        <TabsList>
          <TabsTrigger value="data">Real Data</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>
        <TabsContent value="data" className="mt-4">
          <LocationDataView location={location} />
        </TabsContent>
        <TabsContent value="forecast" className="mt-4">
          <LocationForecastView location={location} />
        </TabsContent>
      </Tabs>
    </main>
  );
}
