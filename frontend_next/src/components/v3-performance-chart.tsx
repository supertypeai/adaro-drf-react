"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { APIService, type V3TableRecord } from "@/services/api";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import dayjs, { type Dayjs } from "dayjs";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { CloudRain, Settings2, Waves, MapPinned } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "./ui/badge";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import type { DateRange } from "react-day-picker";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  ChartTooltip,
  Legend,
  Filler
);

dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(customParseFormat);

interface V3PerformanceChartProps {
  v3TableData: V3TableRecord[];
}

type ViewMode = "latest_vs_actual" | "historical_forecasts" | "error_analysis";
type RainForecastMode = "1d" | "2d" | "3d" | "all";
type PanelKey = "rainfall" | "puruk" | "tuhup" | "joloi";

type EnrichedRecord = V3TableRecord & {
  ts: Dayjs;
  label: string;
  locationId: number | undefined;
  locationName: string | undefined;
};

function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  return undefined;
}

function normalizeLocationName(name?: string): string {
  if (!name) return "";
  return name.toLowerCase().replace(/[\s-]+/g, "_");
}

function getObservedRain(record?: V3TableRecord): number | null {
  if (!record) return null;
  const candidates = [
    record.rain_actual,
    record.rainfall,
    record.rain,
    record.rain_observed,
    record.actual_rain,
  ];

  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }

  return null;
}

function buildLookup(records: EnrichedRecord[]): Map<string, EnrichedRecord> {
  const lookup = new Map<string, EnrichedRecord>();
  for (const record of records) {
    lookup.set(record.label, record);
  }
  return lookup;
}

interface TimelineRailProps {
  isFirst: boolean;
  isLast: boolean;
}

function TimelineRail({ isFirst, isLast }: TimelineRailProps) {
  const markerTop = "2.25rem";

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {!isFirst && (
        <span
          className="absolute left-1/2 w-0.5 -translate-x-1/2 bg-gradient-to-b from-blue-500/20 to-blue-500/80"
          style={{
            top: 0,
            bottom: `calc(100% - ${markerTop})`,
          }}
        />
      )}
      {!isLast && (
        <span
          className="absolute left-1/2 w-0.5 -translate-x-1/2 bg-gradient-to-b from-blue-500/80 to-blue-500/20"
          style={{
            top: markerTop,
            bottom: 0,
          }}
        />
      )}
      <span
        className="absolute left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border border-blue-400/70 bg-background shadow-[0_0_0_3px_hsl(221_83%_53%_/_0.15)]"
        style={{ top: `calc(${markerTop} - 0.5rem)` }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
      </span>
    </div>
  );
}

export function V3PerformanceChart({ v3TableData }: V3PerformanceChartProps) {
  const normalizedRecords = useMemo<EnrichedRecord[]>(() => {
    if (!v3TableData || v3TableData.length === 0) return [];

    const parsedRecords: EnrichedRecord[] = [];

    for (const row of v3TableData) {
        const hour = toOptionalNumber(row.hour) ?? 0;
        const parsedTs = dayjs(
          `${row.date} ${String(Math.trunc(hour)).padStart(2, "0")}:00`,
          "YYYY-MM-DD HH:mm",
          true
        );

        if (!parsedTs.isValid()) continue;

        const locationId =
          toOptionalNumber(row.location_id) ??
          toOptionalNumber(row.locationId) ??
          toOptionalNumber(row.loc_id) ??
          toOptionalNumber(row.locId);

        const locationName =
          toOptionalString(row.location_name) ??
          toOptionalString(row.location) ??
          toOptionalString(row.loc_name) ??
          toOptionalString(row.name);

        parsedRecords.push({
          ...row,
          ts: parsedTs,
          label: parsedTs.format("YYYY-MM-DD HH:00"),
          locationId,
          locationName,
        });
    }

    return parsedRecords.sort((a, b) => a.ts.valueOf() - b.ts.valueOf());
  }, [v3TableData]);

  const hasLocationMetadata = useMemo(
    () =>
      normalizedRecords.some(
        (row) => row.locationId !== undefined || !!normalizeLocationName(row.locationName)
      ),
    [normalizedRecords]
  );

  const availableDateRange = useMemo(() => {
    if (normalizedRecords.length === 0) {
      return { minDate: dayjs().subtract(7, "day"), maxDate: dayjs() };
    }

    return {
      minDate: normalizedRecords[0].ts,
      maxDate: normalizedRecords[normalizedRecords.length - 1].ts,
    };
  }, [normalizedRecords]);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const defaultFrom = availableDateRange.maxDate.subtract(14, "day");
    const start = defaultFrom.isAfter(availableDateRange.minDate)
      ? defaultFrom
      : availableDateRange.minDate;

    return {
      from: start.toDate(),
      to: availableDateRange.maxDate.toDate(),
    };
  });

  const [viewMode, setViewMode] = useState<ViewMode>("latest_vs_actual");
  const [showRainChart, setShowRainChart] = useState(true);
  const [rainForecastMode, setRainForecastMode] = useState<RainForecastMode>("all");
  const [joloiExternalRecords, setJoloiExternalRecords] = useState<EnrichedRecord[]>([]);
  const [pulsePhase, setPulsePhase] = useState(0);
  const pulseAlpha = 0.55 + ((Math.sin(pulsePhase) + 1) / 2) * 0.65;

  useEffect(() => {
    const defaultFrom = availableDateRange.maxDate.subtract(14, "day");
    const start = defaultFrom.isAfter(availableDateRange.minDate)
      ? defaultFrom
      : availableDateRange.minDate;

    setDateRange({
      from: start.toDate(),
      to: availableDateRange.maxDate.toDate(),
    });
  }, [availableDateRange]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPulsePhase((prev) => prev + 0.35);
    }, 80);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchJoloiData = async () => {
      try {
        const locations = await APIService.getLocations();
        const joloiLocation = locations.find((loc) => {
          if (loc.id === 11) return true;
          const normalizedName = normalizeLocationName(loc.name);
          return normalizedName.includes("joloi");
        });

        if (!joloiLocation) {
          if (!cancelled) setJoloiExternalRecords([]);
          return;
        }

        const joloiData = await APIService.getData(
          joloiLocation.id,
          joloiLocation.sensor,
          joloiLocation.name
        );

        if (cancelled) return;

        const parsed = joloiData
          .map((row) => {
            const hour = toOptionalNumber(row.hour) ?? 0;
            const measurement = toOptionalNumber(row.measurement);
            const ts = dayjs(
              `${row.date} ${String(Math.trunc(hour)).padStart(2, "0")}:00`,
              "YYYY-MM-DD HH:mm",
              true
            );

            if (!ts.isValid()) return null;

            return {
              date: row.date,
              hour: Math.trunc(hour),
              actual: measurement ?? null,
              pred_1d: null,
              pred_2d: null,
              pred_3d: null,
              diff_1d: null,
              diff_2d: null,
              diff_3d: null,
              ts,
              label: ts.format("YYYY-MM-DD HH:00"),
              locationId: joloiLocation.id,
              locationName: joloiLocation.name,
            } as EnrichedRecord;
          })
          .filter((row): row is EnrichedRecord => row !== null)
          .sort((a, b) => a.ts.valueOf() - b.ts.valueOf());

        setJoloiExternalRecords(parsed);
      } catch (error) {
        console.error("Failed to fetch Joloi historical data", error);
        if (!cancelled) setJoloiExternalRecords([]);
      }
    };

    fetchJoloiData();

    return () => {
      cancelled = true;
    };
  }, []);

  const recordsInDateRange = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return normalizedRecords;

    const from = dayjs(dateRange.from).startOf("day");
    const to = dayjs(dateRange.to).endOf("day");

    return normalizedRecords.filter((row) => row.ts.isAfter(from) && row.ts.isBefore(to));
  }, [normalizedRecords, dateRange]);

  const isPurukRecord = useCallback((record: EnrichedRecord) => {
    if (record.locationId === 9) return true;

    const name = normalizeLocationName(record.locationName);
    return name.includes("puruk_cahu");
  }, []);

  const isTuhupRecord = useCallback((record: EnrichedRecord) => {
    const name = normalizeLocationName(record.locationName);
    if (name.includes("muara_tuhup")) return true;

    if (record.locationId === 9) return false;

    return false;
  }, []);

  const isJoloiRecord = useCallback((record: EnrichedRecord) => {
    if (record.locationId === 11) return true;

    const name = normalizeLocationName(record.locationName);
    return name.includes("joloi");
  }, []);

  const purukRecords = useMemo(
    () => recordsInDateRange.filter((record) => isPurukRecord(record)),
    [recordsInDateRange, isPurukRecord]
  );

  const tuhupRecords = useMemo(() => {
    if (!hasLocationMetadata) {
      return recordsInDateRange;
    }
    return recordsInDateRange.filter((record) => isTuhupRecord(record));
  }, [recordsInDateRange, hasLocationMetadata, isTuhupRecord]);

  const joloiV3Records = useMemo(
    () => recordsInDateRange.filter((record) => isJoloiRecord(record)),
    [recordsInDateRange, isJoloiRecord]
  );

  const joloiExternalInDateRange = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return joloiExternalRecords;

    const from = dayjs(dateRange.from).startOf("day");
    const to = dayjs(dateRange.to).endOf("day");

    return joloiExternalRecords.filter((row) => row.ts.isAfter(from) && row.ts.isBefore(to));
  }, [joloiExternalRecords, dateRange]);

  const joloiRecords = useMemo(
    () => (joloiV3Records.length > 0 ? joloiV3Records : joloiExternalInDateRange),
    [joloiV3Records, joloiExternalInDateRange]
  );

  const performanceStats = useMemo(() => {
    const validData = tuhupRecords.filter(
      (r) =>
        toOptionalNumber(r.actual) !== undefined &&
        toOptionalNumber(r.diff_1d) !== undefined
    );
    if (validData.length === 0) return null;
    const calcStats = (key: "diff_1d" | "diff_2d" | "diff_3d") => {
      const diffs = validData
        .map((r) => toOptionalNumber(r[key]))
        .filter((d): d is number => d !== undefined);
      if (diffs.length === 0) return null;
      const mae = (diffs.reduce((s, d) => s + Math.abs(d), 0) / diffs.length) * 100;
      const withinGreenZone =
        (diffs.filter((d) => Math.abs(d) * 100 <= 20).length / diffs.length) * 100;
      return { mae: mae.toFixed(2), withinGreenZone: withinGreenZone.toFixed(1) };
    };
    return {
      pred_1d: calcStats("diff_1d"),
      pred_2d: calcStats("diff_2d"),
      pred_3d: calcStats("diff_3d"),
      totalMeasurements: validData.length,
    };
  }, [tuhupRecords]);

  const composedData = useMemo(() => {
    const fallbackEmpty = {
      labels: [] as string[],
      rainfall: null as any,
      puruk: null as any,
      joloi: null as any,
      tuhup: null as any,
    };

    if (normalizedRecords.length === 0 && joloiRecords.length === 0) return fallbackEmpty;

    const tuhupAllLookup = buildLookup(tuhupRecords);
    const purukLookup = buildLookup(purukRecords);
    const joloiLookup = buildLookup(joloiRecords);

    if (viewMode === "latest_vs_actual") {
      const actualRecords = [...tuhupRecords]
        .filter((row) => row.actual !== null)
        .sort((a, b) => a.ts.valueOf() - b.ts.valueOf());

      const recentActual = actualRecords.slice(-72);
      if (recentActual.length === 0) {
        const joloiLabels = [...new Set(joloiRecords.map((row) => row.label))].sort(
          (a, b) => dayjs(a).valueOf() - dayjs(b).valueOf()
        );

        if (joloiLabels.length === 0) return fallbackEmpty;

        return {
          labels: joloiLabels,
          rainfall: null,
          puruk: null,
          joloi: {
            labels: joloiLabels,
            datasets: [
              {
                label: "Joloi Historical Water Level",
                data: joloiLabels.map((label) => joloiLookup.get(label)?.actual ?? null),
                borderColor: "#b45309",
                backgroundColor: "rgba(180, 83, 9, 0.12)",
                borderWidth: 2,
                pointRadius: 1.5,
                tension: 0.25,
                fill: true,
              },
            ],
          },
          tuhup: null,
        };
      }

      const lastActualTs = recentActual[recentActual.length - 1].ts;
      const labels = recentActual.map((row) => row.label);
      const phaseByLabel = new Map<string, "historical" | "forecast">();
      const horizonByLabel = new Map<string, 1 | 2 | 3>();

      for (const row of recentActual) {
        phaseByLabel.set(row.label, "historical");
      }

      for (let hour = 1; hour <= 72; hour += 1) {
        const futureTs = lastActualTs.add(hour, "hour");
        const label = futureTs.format("YYYY-MM-DD HH:00");
        labels.push(label);
        phaseByLabel.set(label, "forecast");
        if (hour <= 24) horizonByLabel.set(label, 1);
        else if (hour <= 48) horizonByLabel.set(label, 2);
        else horizonByLabel.set(label, 3);
      }

      const muaraActual = labels.map((label) => {
        if (phaseByLabel.get(label) !== "historical") return null;
        return tuhupAllLookup.get(label)?.actual ?? null;
      });

      const muaraForecast = labels.map((label) => {
        if (phaseByLabel.get(label) !== "forecast") return null;
        const row = tuhupAllLookup.get(label);
        if (!row) return null;

        const horizon = horizonByLabel.get(label);
        if (horizon === 1) return row.pred_1d ?? null;
        if (horizon === 2) return row.pred_2d ?? null;
        return row.pred_3d ?? null;
      });

      const purukHistorical = labels.map((label) => purukLookup.get(label)?.actual ?? null);
      const joloiHistorical = labels.map((label) => joloiLookup.get(label)?.actual ?? null);

      const rainActual = labels.map((label) => {
        if (phaseByLabel.get(label) !== "historical") return null;
        return getObservedRain(tuhupAllLookup.get(label));
      });

      const rainForecast = labels.map((label) => {
        if (phaseByLabel.get(label) !== "forecast") return null;
        const row = tuhupAllLookup.get(label);
        if (!row) return null;

        const horizon = horizonByLabel.get(label);
        if (horizon === 1) return row.rain_forecast_1d ?? null;
        if (horizon === 2) return row.rain_forecast_2d ?? null;
        return row.rain_forecast_3d ?? null;
      });

      return {
        labels,
        rainfall: {
          labels,
          datasets: [
            {
              label: "Historical Rainfall",
              data: rainActual,
              type: "bar" as const,
              backgroundColor: "rgba(56, 189, 248, 0.55)",
            },
            {
              label: "Forecast Rainfall",
              data: rainForecast,
              type: "bar" as const,
              backgroundColor: "rgba(34, 197, 94, 0.55)",
            },
          ],
        },
        puruk: {
          labels,
          datasets: [
            {
              label: "Puruk Cahu Historical Water Level",
              data: purukHistorical,
              borderColor: "#f59e0b",
              backgroundColor: "rgba(245, 158, 11, 0.12)",
              borderWidth: 2,
              pointRadius: 1.5,
              tension: 0.25,
              fill: true,
            },
          ],
        },
        joloi: {
          labels,
          datasets: [
            {
              label: "Joloi Historical Water Level",
              data: joloiHistorical,
              borderColor: "#b45309",
              backgroundColor: "rgba(180, 83, 9, 0.12)",
              borderWidth: 2,
              pointRadius: 1.5,
              tension: 0.25,
              fill: true,
            },
          ],
        },
        tuhup: {
          labels,
          datasets: [
            {
              label: "Muara Tuhup Historical",
              data: muaraActual,
              borderColor: "#38bdf8",
              backgroundColor: "rgba(56, 189, 248, 0.12)",
              borderWidth: 2,
              tension: 0.25,
              pointRadius: 1.5,
              fill: true,
            },
            {
              label: "Muara Tuhup Forecast (1d to 3d)",
              data: muaraForecast,
              borderColor: "#22c55e",
              borderDash: [6, 4],
              borderWidth: 2,
              tension: 0.25,
              pointRadius: 1.5,
            },
          ],
        },
      };
    }

    const labelSet = new Set<string>();
    for (const row of purukRecords) labelSet.add(row.label);
    for (const row of joloiRecords) labelSet.add(row.label);
    for (const row of tuhupRecords) labelSet.add(row.label);

    const labels = [...labelSet].sort((a, b) => dayjs(a).valueOf() - dayjs(b).valueOf());

    if (labels.length === 0) return fallbackEmpty;

    const muaraLookup = buildLookup(tuhupRecords);

    const rainfallDatasets: any[] = [
      {
        label: "Historical Rainfall",
        data: labels.map((label) => getObservedRain(muaraLookup.get(label))),
        type: "bar" as const,
        backgroundColor: "rgba(56, 189, 248, 0.55)",
      },
    ];

    const rain1d = labels.map((label) => muaraLookup.get(label)?.rain_forecast_1d ?? null);
    const rain2d = labels.map((label) => muaraLookup.get(label)?.rain_forecast_2d ?? null);
    const rain3d = labels.map((label) => muaraLookup.get(label)?.rain_forecast_3d ?? null);

    if (rainForecastMode === "1d" || rainForecastMode === "all") {
      rainfallDatasets.push({
        label: "Forecast Rainfall 1D",
        data: rain1d,
        type: "bar" as const,
        backgroundColor: "rgba(82, 196, 26, 0.5)",
      });
    }
    if (rainForecastMode === "2d" || rainForecastMode === "all") {
      rainfallDatasets.push({
        label: "Forecast Rainfall 2D",
        data: rain2d,
        type: "bar" as const,
        backgroundColor: "rgba(250, 173, 20, 0.5)",
      });
    }
    if (rainForecastMode === "3d" || rainForecastMode === "all") {
      rainfallDatasets.push({
        label: "Forecast Rainfall 3D",
        data: rain3d,
        type: "bar" as const,
        backgroundColor: "rgba(255, 120, 117, 0.5)",
      });
    }

    const purukData = {
      labels,
      datasets: [
        {
          label: "Puruk Cahu Historical Water Level",
          data: labels.map((label) => purukLookup.get(label)?.actual ?? null),
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.12)",
          borderWidth: 2,
          pointRadius: 1.5,
          tension: 0.25,
          fill: true,
        },
      ],
    };

    const joloiData = {
      labels,
      datasets: [
        {
          label: "Joloi Historical Water Level",
          data: labels.map((label) => joloiLookup.get(label)?.actual ?? null),
          borderColor: "#b45309",
          backgroundColor: "rgba(180, 83, 9, 0.12)",
          borderWidth: 2,
          pointRadius: 1.5,
          tension: 0.25,
          fill: true,
        },
      ],
    };

    const muaraHistoricalData = {
      labels,
      datasets: [
        {
          label: "Muara Tuhup Historical",
          data: labels.map((label) => muaraLookup.get(label)?.actual ?? null),
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.12)",
          borderWidth: 2,
          pointRadius: 1.5,
          tension: 0.25,
          fill: true,
        },
        {
          label: "Muara Tuhup Forecast 1D",
          data: labels.map((label) => muaraLookup.get(label)?.pred_1d ?? null),
          borderColor: "rgba(82, 196, 26, 0.9)",
          borderDash: [4, 3],
          borderWidth: 2,
          pointRadius: 1,
          tension: 0.25,
        },
        {
          label: "Muara Tuhup Forecast 2D",
          data: labels.map((label) => muaraLookup.get(label)?.pred_2d ?? null),
          borderColor: "rgba(250, 173, 20, 0.9)",
          borderDash: [4, 3],
          borderWidth: 2,
          pointRadius: 1,
          tension: 0.25,
        },
        {
          label: "Muara Tuhup Forecast 3D",
          data: labels.map((label) => muaraLookup.get(label)?.pred_3d ?? null),
          borderColor: "rgba(255, 120, 117, 0.9)",
          borderDash: [4, 3],
          borderWidth: 2,
          pointRadius: 1,
          tension: 0.25,
        },
      ],
    };

    const muaraErrorData = {
      labels,
      datasets: [
        {
          label: "1-Day Error",
          data: labels.map((label) => {
            const diff = muaraLookup.get(label)?.diff_1d;
            return diff === null || diff === undefined ? null : Math.abs(diff) * 100;
          }),
          backgroundColor: "rgba(82, 196, 26, 0.7)",
          order: 1,
        },
        {
          label: "2-Day Error",
          data: labels.map((label) => {
            const diff = muaraLookup.get(label)?.diff_2d;
            return diff === null || diff === undefined ? null : Math.abs(diff) * 100;
          }),
          backgroundColor: "rgba(250, 173, 20, 0.7)",
          order: 2,
        },
        {
          label: "3-Day Error",
          data: labels.map((label) => {
            const diff = muaraLookup.get(label)?.diff_3d;
            return diff === null || diff === undefined ? null : Math.abs(diff) * 100;
          }),
          backgroundColor: "rgba(255, 120, 117, 0.7)",
          order: 3,
        },
        {
          label: "Green Zone (<=20 cm)",
          data: new Array(labels.length).fill(20),
          type: "line" as const,
          borderColor: "#22c55e",
          borderWidth: 2,
          borderDash: [8, 4],
          pointRadius: 0,
          order: 0,
        },
      ],
    };

    return {
      labels,
      rainfall: {
        labels,
        datasets: rainfallDatasets,
      },
      puruk: purukData,
      joloi: joloiData,
      tuhup: viewMode === "error_analysis" ? muaraErrorData : muaraHistoricalData,
    };
  }, [normalizedRecords, purukRecords, joloiRecords, tuhupRecords, viewMode, rainForecastMode]);

  const getTickStep = useCallback(
    (labelCount: number) => {
      if (viewMode === "latest_vs_actual") return 12;
      if (labelCount > 240) return 24;
      if (labelCount > 120) return 12;
      if (labelCount > 60) return 6;
      return 3;
    },
    [viewMode]
  );

  const makeLineOptions = useCallback(
    (
      yTitle: string,
      unit: "m" | "mm" | "cm",
      showXAxisTicks: boolean,
      beginAtZero = false
    ) => {
      const tickStep = getTickStep(composedData.labels.length);

      return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index" as const, intersect: false },
        plugins: {
          legend: {
            position: "top" as const,
            labels: { color: "#888", usePointStyle: true, padding: 16, filter: (item: any) => item.text !== "_pulse" },
          },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.85)",
            callbacks: {
              title: (ctx: any[]) => dayjs(ctx[0]?.label).format("MMM DD, YYYY HH:mm"),
              label: (ctx: any) => {
                const value = ctx.parsed?.y;
                if (value === null || value === undefined) return undefined;
                return `${ctx.dataset.label}: ${value.toFixed(2)} ${unit}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#888",
              maxTicksLimit: 10,
              callback: function (this: any, value: unknown, index: number) {
                if (!showXAxisTicks) return "";
                const label = this.getLabelForValue(value);
                if (index % tickStep === 0) return dayjs(label).format("MMM DD HH:mm");
                return "";
              },
              autoSkip: false,
            },
            grid: { color: "rgba(255,255,255,0.05)" },
          },
          y: {
            title: { display: true, text: yTitle, color: "#888" },
            ticks: { color: "#888" },
            grid: { color: "rgba(255,255,255,0.05)" },
            beginAtZero,
          },
        },
      };
    },
    [composedData.labels.length, getTickStep]
  );

  const renderPanel = (
    key: PanelKey,
    title: string,
    description: string,
    isFirst: boolean,
    isLast: boolean,
    icon: React.ReactNode,
    chartNode: React.ReactNode,
    badgeColor: string = "bg-slate-700"
  ) => {
    return (
      <div key={key} className={`relative m-0 ${isLast ? "" : "border-b border-border"}`}>
        <div className="absolute inset-y-0 left-0 w-12">
          <TimelineRail isFirst={isFirst} isLast={isLast} />
        </div>

        <div className="ml-12 grid grid-cols-[minmax(150px,8%)_minmax(0,1fr)] bg-card rounded-lg">
          <div className="px-4 py-4 md:px-5">
            <CardTitle className="text-base flex items-center gap-2 mt-2">
              <Badge className={`py-3 rounded-md font-bold ${badgeColor}`}>
                {icon}
                {title}
              </Badge>
            </CardTitle>
            <p className="mt-3 text-xs text-muted-foreground">{description}</p>
          </div>

          <div className="px-2 py-3 md:px-4 md:py-4">
            <div className="h-[280px] w-full">{chartNode}</div>
          </div>
        </div>
      </div>
    );
  };

  const buildWithPulse = (base: any, datasetIdx: number, rgb: string) => {
    if (!base) return base;
    const vals = (base.datasets[datasetIdx]?.data ?? []) as (number | null)[];
    let li = -1;
    for (let i = vals.length - 1; i >= 0; i--) {
      if (vals[i] != null) { li = i; break; }
    }
    if (li === -1) return base;
    return {
      ...base,
      datasets: [
        ...base.datasets,
        {
          label: "_pulse",
          data: vals.map((v, i) => (i === li ? v : null)),
          pointBackgroundColor: `rgba(${rgb},${pulseAlpha.toFixed(2)})`,
          pointBorderColor: "transparent",
          pointRadius: 5,
          pointHoverRadius: 5,
          showLine: false,
        },
      ],
    };
  };

  const hasAnyLabels = composedData.labels.length > 0 || joloiRecords.length > 0;
  const hasRainForecastToolbar = showRainChart && viewMode !== "latest_vs_actual";

  return (
    <div className="space-y-4">
      <Card className="shadow-md w-fit mx-auto px-1 py-1">
        <CardContent className="px-0 py-0">
          {/* Primary toolbar row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DatePickerWithRange
              date={dateRange}
              setDate={setDateRange}
              className="w-[240px] sm:w-[260px]"
            />

            <div className="flex items-center gap-2">
              {/* Segmented view-mode control */}
              <div className="flex rounded-lg border border-input bg-muted/40 p-0.5 shadow-inner">
                {([
                  "latest_vs_actual",
                  "historical_forecasts",
                  "error_analysis",
                ] as ViewMode[]).map((mode) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? "default" : "ghost"}
                    size="sm"
                    className="rounded-md h-8 px-3 text-xs"
                    onClick={() => setViewMode(mode)}
                  >
                    {mode === "latest_vs_actual"
                      ? "Latest vs Actual"
                      : mode === "historical_forecasts"
                        ? "Historical"
                        : "Error Analysis"}
                  </Button>
                ))}
              </div>

              {/* Divider */}
              <span className="h-6 w-px bg-border shrink-0" />

              {/* Rain toggle */}
              <Button
                variant={showRainChart ? "default" : "outline"}
                size="sm"
                className="h-8 gap-1.5 px-3 text-xs"
                onClick={() => setShowRainChart((prev) => !prev)}
              >
                <CloudRain className="h-3.5 w-3.5" />
                Rain
              </Button>

              {/* Divider */}
              <span className="h-6 w-px bg-border shrink-0" />

              {/* Forecast horizon — always visible, disabled when not applicable */}
              <div className={`flex items-center gap-2 transition-opacity ${hasRainForecastToolbar ? "opacity-100" : "opacity-35 pointer-events-none"}`}>
                <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                  Horizon
                </span>
                <div className="flex rounded-lg border border-input bg-muted/40 p-0.5 shadow-inner">
                  {(["1d", "2d", "3d", "all"] as RainForecastMode[]).map((mode) => (
                    <Button
                      key={mode}
                      variant={rainForecastMode === mode ? "default" : "ghost"}
                      size="sm"
                      className="rounded-md h-8 px-3 text-xs"
                      onClick={() => setRainForecastMode(mode)}
                    >
                      {mode === "all" ? "All" : mode.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden bg-background shadow-sm ring-0 gap-0 py-0">
        {showRainChart &&
          renderPanel(
            "rainfall",
            "Rainfall",
            "Rainfall aligned to water-level timeline.",
            true,
            false,
            <></>, // Icon disabled
            hasAnyLabels && composedData.rainfall ? (
              <Bar data={composedData.rainfall as any} options={makeLineOptions("Rainfall (mm)", "mm", true, true) as any} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-lg bg-muted/30 text-sm">
                No rainfall data for selected filters.
              </div>
            ),
            "bg-blue-700"
          )}

        {renderPanel(
          "joloi",
          "Joloi",
          "Upstream historical water-level (location_id: 11)",
          !showRainChart,
          false,
          <></>, // <MapPinned className="h-4 w-4 text-pink-500" />
          hasAnyLabels && composedData.joloi ? (
            <Line data={buildWithPulse(composedData.joloi, 0, "180,83,9") as any} options={makeLineOptions("Water Level (m)", "m", true, false) as any} />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-lg bg-muted/30 text-sm">
              No Joloi historical data found in this range.
            </div>
          ),
          "bg-amber-700"
        )}

        {renderPanel(
          "tuhup",
          "Muara Tuhup",
          viewMode === "error_analysis"
            ? "Error analysis with green-zone threshold."
            : "Historical and forecast on shared x-axis.",
          false,
          true,
          <></>, // <Waves className="h-4 w-4 text-cyan-500" />
          hasAnyLabels && composedData.tuhup ? (
            viewMode === "error_analysis" ? (
              <Bar data={composedData.tuhup as any} options={makeLineOptions("Absolute Error (cm)", "cm", true, true) as any} />
            ) : (
              <Line data={buildWithPulse(composedData.tuhup, 0, "56,189,248") as any} options={makeLineOptions("Water Level (m)", "m", true, false) as any} />
            )
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-lg bg-muted/30 text-sm">
              No Muara Tuhup data for selected filters.
            </div>
          ),
          "bg-cyan-700"
        )}

        {performanceStats && (
          <div className="ml-12 border-t border-border px-4 py-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Forecast Performance — Muara Tuhup
            </p>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold tabular-nums">
                  {performanceStats.totalMeasurements}
                </div>
                <div className="text-xs text-muted-foreground">Total Samples</div>
              </div>
              {[
                { key: "pred_1d" as const, label: "1-Day MAE", color: "text-green-400" },
                { key: "pred_2d" as const, label: "2-Day MAE", color: "text-amber-400" },
                { key: "pred_3d" as const, label: "3-Day MAE", color: "text-rose-400" },
              ].map(({ key, label, color }) => {
                const s = performanceStats[key];
                return s ? (
                  <div key={key}>
                    <div className={`text-xl font-bold tabular-nums ${color}`}>
                      {s.mae} cm
                    </div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground/60">
                      {s.withinGreenZone}% ≤ 20 cm
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
