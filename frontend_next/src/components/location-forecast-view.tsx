"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { APIService, Location, V3TableRecord, type V3ForecastResponse } from "@/services/api";
import { type PreprocessedV3Data } from "@/lib/v3-preprocessor";
import { V3PerformanceChart } from "@/components/v3-performance-chart";
import { V3PerformanceTable } from "@/components/v3-performance-table";
import { WeeklyForecastGraph } from "@/components/weekly-forecast-graph";

interface WeeklyRow {
  date: string;
  hour: number;
  variable: string;
  value: number;
  [key: string]: unknown;
}

interface LocationForecastViewProps {
  location: Location;
}

export function LocationForecastView({ location }: LocationForecastViewProps) {
  const [v3Preprocessed, setV3Preprocessed] = useState<PreprocessedV3Data | null>(null);
  const [v3TableData, setV3TableData] = useState<V3TableRecord[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasV3, setHasV3] = useState(false);
  const [hasV1, setHasV1] = useState(false);

  useEffect(() => {
    setLoading(true);
    setHasV3(false);
    setHasV1(false);

    const locName = location.name;

    if (locName === "muara_tuhup") {
      // Fetch both V3 and V1 for muara_tuhup (V3 takes priority)
      Promise.all([
        APIService.getV3ForecastData(locName),
        APIService.getForecastData(locName),
      ])
        .then(([v3Resp, v1Resp]) => {
          if (v3Resp.response === "success" && v3Resp.preprocessed) {
            setV3Preprocessed(v3Resp.preprocessed);
            setHasV3(true);
          }
          if (v3Resp.response === "success" && v3Resp.data_wide && v3Resp.data_wide.length > 0) {
            setV3TableData(v3Resp.data_wide);
          }
          if (v1Resp.response === "success" && v1Resp.data) {
            try {
              const parsed = JSON.parse(v1Resp.data as unknown as string) as WeeklyRow[];
              setWeeklyData(parsed);
              setHasV1(parsed.length > 0);
            } catch { /* ignore parse error */ }
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      // V1 only for all other locations
      APIService.getForecastData(locName)
        .then((resp) => {
          if (resp.response === "success" && resp.data) {
            try {
              const parsed = JSON.parse(resp.data as unknown as string) as WeeklyRow[];
              setWeeklyData(parsed);
              setHasV1(parsed.length > 0);
            } catch { /* ignore */ }
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [location]);

  if (loading) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  const noData = !hasV3 && !hasV1;

  if (noData) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground text-lg">
            No forecast data available for {location.title}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* V3 section — muara_tuhup only */}
      {hasV3 && (
        <>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm">
              <span className="font-semibold text-primary">🚀 V3 Neural Network Forecast</span>{" "}
              — Advanced multi-day ahead predictions with performance tracking for {location.title}.
            </p>
          </div>
          <Card>
            <CardContent className="p-4 md:p-6">
              <V3PerformanceChart preprocessedData={v3Preprocessed} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 md:p-6">
              <V3PerformanceTable v3TableData={v3TableData} />
            </CardContent>
          </Card>
        </>
      )}

      {/* V1 Weekly Forecast — shown for all locations */}
      {hasV1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              📈 {hasV3 ? "V1 Weekly Forecast" : "Forecast"} — {location.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[420px]">
              <WeeklyForecastGraph loc={location} weeklyData={weeklyData} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
