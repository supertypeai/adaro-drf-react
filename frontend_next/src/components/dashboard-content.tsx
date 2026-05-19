"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Location, APIService, titleToSlug } from "@/services/api";
import { MapSection } from "./map-section";
import { AllLocationsChart } from "./all-locations-chart";
import { V3PerformanceChart } from "./v3-performance-chart";
import { V3PerformanceTable } from "./v3-performance-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { V3TableRecord } from "@/services/api";

interface DashboardContentProps {
  locations: Location[];
}

export function DashboardContent({ locations }: DashboardContentProps) {
  const [v3TableData, setV3TableData] = useState<V3TableRecord[]>([]);
  const [v3Loading, setV3Loading] = useState(true);

  useEffect(() => {
    APIService.getV3ForecastData("muara_tuhup")
      .then((resp) => {
        if (resp.response === "success") {
          setV3TableData(resp.data_wide || []);
        }
      })
      .catch(console.error)
      .finally(() => setV3Loading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Row 1: Map (70%) + Line Chart (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
        <Card className="lg:col-span-7 overflow-hidden p-0">
          {/* <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Monitoring Locations</CardTitle>
          </CardHeader> */}
          <CardContent className="p-0">
            <div className="h-[500px]">
              <MapSection locations={locations} />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 bg-background border-none ring-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 font-semibold">
              <span> Real-Time Water Levels </span>
            </CardTitle>
            <CardDescription className="text-xs">
              <p>Last measured: {new Date().toLocaleDateString('en-CA')}</p>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AllLocationsChart locations={locations} />
          </CardContent>
        </Card>
      </div>

      {/* Row 2: V3 Performance Chart */}
      <Card className="bg-background ring-0">
        <CardContent className="p-0">
          {v3Loading ? (
            <Skeleton className="h-[450px] w-full" />
          ) : (
            <V3PerformanceChart v3TableData={v3TableData} />
          )}
        </CardContent>
      </Card>

      {/* Row 3: V3 Performance Table */}
      <Card>
        <CardContent className="p-4 md:p-6">
          {v3Loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <V3PerformanceTable v3TableData={v3TableData} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
