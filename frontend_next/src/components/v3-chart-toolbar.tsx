"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { CloudRain } from "lucide-react";
import type { DateRange } from "react-day-picker";

export type ViewMode = "latest_vs_actual" | "historical_forecasts" | "error_analysis";
export type RainForecastMode = "latest" | "1d" | "2d" | "3d" | "all";

interface V3ChartToolbarProps {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  showRainChart: boolean;
  setShowRainChart: (show: boolean) => void;
  rainForecastMode: RainForecastMode;
  setRainForecastMode: (mode: RainForecastMode) => void;
  hasRainForecastToolbar?: boolean;
}

export function V3ChartToolbar({
  dateRange,
  setDateRange,
  viewMode,
  setViewMode,
  showRainChart,
  setShowRainChart,
  rainForecastMode,
  setRainForecastMode,
  hasRainForecastToolbar = true,
}: V3ChartToolbarProps) {
  return (
    <Card className="shadow-md w-fit mx-auto px-1 py-1">
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DatePickerWithRange
            date={dateRange}
            setDate={setDateRange}
            className="w-[240px] sm:w-[260px]"
          />

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-input bg-muted/40 p-0.5 shadow-inner">
              {(["latest_vs_actual", "historical_forecasts", "error_analysis"] as ViewMode[]).map(
                (mode) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? "default" : "ghost"}
                    size="sm"
                    className="rounded-md h-8 px-3 text-xs cursor-pointer"
                    onClick={() => setViewMode(mode)}
                  >
                    {mode === "latest_vs_actual"
                      ? "Latest vs Actual"
                      : mode === "historical_forecasts"
                      ? "Historical"
                      : "Error Analysis"}
                  </Button>
                )
              )}
            </div>

            <span className="h-6 w-px bg-border shrink-0" />

            <Button
              variant={showRainChart ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1.5 px-3 text-xs cursor-pointer"
              onClick={() => setShowRainChart(!showRainChart)}
            >
              <CloudRain className="h-3.5 w-3.5" />
              Rain
            </Button>

            <span className="h-6 w-px bg-border shrink-0" />

            <div
              className={`flex items-center gap-2 transition-opacity ${
                hasRainForecastToolbar ? "opacity-100" : "opacity-35 pointer-events-none"
              }`}
            >
              <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                Horizon
              </span>
              <div className="flex rounded-lg border border-input bg-muted/40 p-0.5 shadow-inner">
              {(["latest", "1d", "2d", "3d", "all"] as RainForecastMode[]).map((mode) => (
                  <Button
                    key={mode}
                    variant={rainForecastMode === mode ? "default" : "ghost"}
                    size="sm"
                    className="rounded-md h-8 px-3 text-xs cursor-pointer"
                    onClick={() => setRainForecastMode(mode)}
                  >
                    {mode === "all" ? "All" : mode === "latest" ? "Latest" : mode.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
