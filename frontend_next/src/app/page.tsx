"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { APIService, type V3TableRecord, type V3ForecastResponse } from "@/services/api";
import { type PreprocessedV3Data } from "@/lib/v3-preprocessor";
import { MapSection } from "@/components/map-section";
import { AllLocationsChart } from "@/components/all-locations-chart";
import { V3PerformanceChart } from "@/components/v3-performance-chart";
import { V3PerformanceTable } from "@/components/v3-performance-table";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const [v3Preprocessed, setV3Preprocessed] = useState<PreprocessedV3Data | null>(null);
  const [v3TableData, setV3TableData] = useState<V3TableRecord[]>([]);
  const [v3Loading, setV3Loading] = useState(true);

  useEffect(() => {
    APIService.getV3ForecastData("muara_tuhup")
      .then((resp: V3ForecastResponse) => {
        if (resp.response === "success" && resp.preprocessed) {
          setV3Preprocessed(resp.preprocessed);
          if (resp.data_wide) {
            setV3TableData(resp.data_wide);
          }
        }
      })
      .catch(console.error)
      .finally(() =>
        setV3Loading(false)
      );
  }, []);

  return (
    <main className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      <div className="space-y-6">
        {/* Row 1: Map (70%) + Line Chart (30%) */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
          <Card className="lg:col-span-7 overflow-hidden p-0">
            {/* <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">Monitoring Locations</CardTitle>
            </CardHeader> */}
            <CardContent className="p-0">
              <div className="h-[500px]">
                <MapSection />
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
              <AllLocationsChart />
            </CardContent>
          </Card>
        </div>

        {/* Row 2: V3 Performance Chart */}
        <Card className="bg-background ring-0">
          <CardContent className="p-0">
            {v3Loading ? (
              <Skeleton className="h-[450px] w-full" />
            ) : (
              <V3PerformanceChart preprocessedData={v3Preprocessed} />
            )}
          </CardContent>
        </Card>

        {/* Row 3: V3 Performance Table */}
        <Card className="p-0 ring-0 bg-background">
          <CardContent className="p-0">
            {v3Loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <V3PerformanceTable v3TableData={v3TableData} />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
