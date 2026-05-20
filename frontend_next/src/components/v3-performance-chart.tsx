"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "./ui/badge";
import type { DateRange } from "react-day-picker";
import dayjs from "dayjs";
import { APIService } from "@/services/api";
import {
  type PreprocessedV3Data,
} from "@/lib/v3-preprocessor";
import { processJoloiData } from "@/lib/water-level-processor";
import { V3ChartDisplay } from "./v3-chart-display";
import { V3JoloiChartDisplay, type JoloiChartRecord } from "./v3-joloi-chart-display";
import { V3PerformanceStats } from "./v3-performance-stats";
import { TimelineRail } from "./timeline-rail";
import { V3ChartToolbar, type ViewMode, type RainForecastMode } from "./v3-chart-toolbar";

interface V3PerformanceChartProps {
  preprocessedData: PreprocessedV3Data | null;
}

function filterByDateRange<T extends { ts: dayjs.Dayjs }>(
  records: T[],
  dateRange?: DateRange
): T[] {
  if (!dateRange?.from || !dateRange?.to) return records;
  const from = dayjs(dateRange.from).startOf("day");
  const to = dayjs(dateRange.to).endOf("day");
  return records.filter((row) => row.ts.isAfter(from) && row.ts.isBefore(to));
}

export function V3PerformanceChart({ preprocessedData }: V3PerformanceChartProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>("latest_vs_actual");
  const [showRainChart, setShowRainChart] = useState(true);
  const [rainForecastMode, setRainForecastMode] = useState<RainForecastMode>("latest");
  const [joloiRecords, setJoloiRecords] = useState<JoloiChartRecord[]>([]);
  const [isJoloiLoading, setIsJoloiLoading] = useState(false);

  // Use a key to reset the state when preprocessedData changes
  // or use an effect that only runs when data is available
  useEffect(() => {
    if (!preprocessedData) return;

    const { minDate, maxDate } = preprocessedData;
    const defaultFrom = maxDate.subtract(14, "day");
    const start = defaultFrom.isAfter(minDate) ? defaultFrom : minDate;

    setDateRange({
      from: start.toDate(),
      to: maxDate.toDate()
    });
  }, [preprocessedData]);

  useEffect(() => {
    let cancelled = false;

    const fetchJoloiData = async () => {
      setIsJoloiLoading(true);

      try {
        const joloiData = await APIService.getJoloiData();
        if (cancelled) return;

        setJoloiRecords(processJoloiData(joloiData));
      } catch (error) {
        console.error("Failed to fetch Joloi data", error);
        if (!cancelled) setJoloiRecords([]);
      } finally {
        if (!cancelled) setIsJoloiLoading(false);
      }
    };

    fetchJoloiData();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    return filterByDateRange(preprocessedData?.records ?? [], dateRange);
  }, [preprocessedData, dateRange]);

  const filteredJoloiRecords = useMemo(() => {
    return filterByDateRange(joloiRecords, dateRange);
  }, [joloiRecords, dateRange]);

  const sharedXAxisLabels = useMemo(() => {
    // Find start of latest pred_1d run: locate last pred_1d record, then walk back to its 6AM anchor
    const today6AM = (() => {
      let foundPred = false;
      for (let i = filteredRecords.length - 1; i >= 0; i--) {
        const r = filteredRecords[i];
        if (!foundPred && r.pred_1d != null) foundPred = true;
        if (foundPred && r.ts.hour() === 6) return r.ts;
      }
      return dayjs().startOf("day").add(6, "hour");
    })();

    if (viewMode === "historical_forecasts") {
      return filteredRecords.map((r) => r.label.format("YYYY-MM-DD HH:00"));
    }

    const pre6AM = filteredRecords
      .filter((r) => r.ts.isBefore(today6AM))
      .slice(-72);

    const forecastSeries = filteredRecords
      .filter((r) => !r.ts.isBefore(today6AM))
      .slice(0, 72);

    return [
      ...pre6AM.map((r) => r.label.format("YYYY-MM-DD HH:00")),
      ...forecastSeries.map((r) => r.label.format("YYYY-MM-DD HH:00")),
    ];
  }, [filteredRecords, viewMode]);

  return (
    <div className="space-y-4">
      <V3ChartToolbar
        dateRange={dateRange}
        setDateRange={setDateRange}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showRainChart={showRainChart}
        setShowRainChart={setShowRainChart}
        rainForecastMode={rainForecastMode}
        setRainForecastMode={setRainForecastMode}
        hasRainForecastToolbar={viewMode === "historical_forecasts"}
      />

      <Card className="overflow-hidden bg-background shadow-sm ring-0 gap-0 py-0">
        {showRainChart && (
          <div className="relative m-0">
            <div className="absolute inset-y-0 left-0 w-12">
              <TimelineRail isFirst={true} isLast={false} />
            </div>
            <div className="ml-12 grid grid-cols-[minmax(150px,8%)_minmax(0,1fr)] bg-card rounded-lg">
              <div className="px-4 py-4 md:px-5">
                <CardTitle className="text-base flex flex-col items-start gap-2 mt-2">
                  <Badge className="py-3 rounded-md font-bold bg-slate-700">Rainfall</Badge>
                </CardTitle>
                <p className="mt-3 text-xs text-muted-foreground">
                  Historical rainfall and rain forecast on shared x-axis.
                </p>
              </div>
              <div className="px-2 py-3 md:px-4 md:py-4">
                <div style={{ height: "220px" }} className="w-full">
                  <V3ChartDisplay
                    filteredRecords={filteredRecords}
                    viewMode={viewMode}
                    rainForecastMode={rainForecastMode}
                    displayMode="rainfall"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="relative m-0">
          <div className="absolute inset-y-0 left-0 w-12">
            <TimelineRail isFirst={!showRainChart} isLast={false} />
          </div>
          <div className="ml-12 grid grid-cols-[minmax(150px,8%)_minmax(0,1fr)] bg-card rounded-lg">
            <div className="px-4 py-4 md:px-5">
              <CardTitle className="text-base flex flex-col items-start gap-2 mt-2">
                <Badge className="py-3 rounded-md font-bold bg-teal-600">Joloi</Badge>
              </CardTitle>
              <p className="mt-3 text-xs text-muted-foreground">
                Historical upstream water level (no forecast).
              </p>
            </div>
            <div className="px-2 py-3 md:px-4 md:py-4">
              <div style={{ height: "220px" }} className="w-full">
                <V3JoloiChartDisplay
                  records={filteredJoloiRecords}
                  isLoading={isJoloiLoading}
                  viewMode={viewMode}
                  xAxisLabels={sharedXAxisLabels}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative m-0">
          <div className="absolute inset-y-0 left-0 w-12">
            <TimelineRail isFirst={false} isLast={true} />
          </div>
          <div className="ml-12 grid grid-cols-[minmax(150px,8%)_minmax(0,1fr)] bg-card rounded-lg">
            <div className="px-4 py-4 md:px-5">
              <CardTitle className="text-base flex flex-col items-start gap-2 mt-2">
                <Badge className="py-3 rounded-md font-bold bg-cyan-700">
                  Muara Tuhup
                </Badge>
              </CardTitle>
              <p className="mt-3 text-xs text-muted-foreground">
                {viewMode === "error_analysis"
                  ? "Error analysis with green-zone threshold."
                  : "Historical and forecast on shared x-axis."}
              </p>
              {/* <V3PerformanceStats records={filteredRecords} /> */}
            </div>
            <div className="px-2 py-3 md:px-4 md:py-4">
              <div style={{ height: "360px" }} className="w-full">
                <V3ChartDisplay
                  filteredRecords={filteredRecords}
                  viewMode={viewMode}
                  rainForecastMode={rainForecastMode}
                  displayMode="water_level"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <V3PerformanceStats
        records={preprocessedData?.records ?? []}
        joloiRecords={joloiRecords}
      />
    </div>
  );
}
