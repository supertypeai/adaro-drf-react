"use client";

import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import "chartjs-adapter-dayjs-4";
import dayjs, { type Dayjs } from "dayjs";
import { type ViewMode } from "./v3-chart-toolbar";

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  ChartTitle,
  ChartTooltip,
  Legend,
  Filler
);

export interface JoloiChartRecord {
  ts: Dayjs;
  label: Dayjs;
  actual: number | null;
  is_peak?: boolean | string | null;
}

interface V3JoloiChartDisplayProps {
  records: JoloiChartRecord[];
  isLoading?: boolean;
  viewMode: ViewMode;
  xAxisLabels?: string[];
}

export function V3JoloiChartDisplay({
  records,
  isLoading = false,
  viewMode,
  xAxisLabels,
}: V3JoloiChartDisplayProps) {
  const [pulsePhase, setPulsePhase] = useState(0);
  const pulseAlpha = 0.55 + ((Math.sin(pulsePhase) + 1) / 2) * 0.65;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPulsePhase((prev) => prev + 0.35);
    }, 80);
    return () => window.clearInterval(interval);
  }, []);

  const chartData = useMemo(() => {
    if (records.length === 0) return null;

    const today6AM = dayjs().startOf("day").add(6, "hour");
    const isHistorical = viewMode === "historical_forecasts";

    const labelStrings: string[] =
      xAxisLabels ??
      (isHistorical
        ? records.map((r) => r.label.format("YYYY-MM-DD HH:00"))
        : [
          ...records
            .filter((r) => r.ts.isBefore(today6AM))
            .slice(-72)
            .map((r) => r.label.format("YYYY-MM-DD HH:00")),
          ...records
            .filter((r) => !r.ts.isBefore(today6AM))
            .slice(0, 72)
            .map((r) => r.label.format("YYYY-MM-DD HH:00")),
        ]);

    const labels: Date[] = labelStrings.map((s) => dayjs(s).toDate());

    const actualByLabel = new Map(
      records.map((r) => [r.label.format("YYYY-MM-DD HH:00"), r.actual ?? null])
    );
    const actualSeries = labelStrings.map((label) => actualByLabel.get(label) ?? null);
    const isPeakByLabel = new Map(
      records.map((r) => [r.label.format("YYYY-MM-DD HH:00"), r.is_peak === true || r.is_peak === "true"])
    );
    const isPeakSeries = labelStrings.map((label) => isPeakByLabel.get(label) ?? false);

    let latestIndex = -1;
    for (let i = actualSeries.length - 1; i >= 0; i--) {
      if (actualSeries[i] != null) {
        latestIndex = i;
        break;
      }
    }

    const datasets: any[] = [
      {
        label: "Joloi Actual",
        data: actualSeries,
        borderColor: "#0d9488",
        backgroundColor: "rgba(13, 148, 136, 0.12)",
        borderWidth: 2,
        pointRadius: (ctx: any) => {
          const index = ctx.dataIndex;
          return isPeakSeries[index] ? 0 : 1.5;
        },
        tension: 0.25,
        fill: true,
      },
    ];

    datasets.push({
      label: "Joloi Peak",
      data: actualSeries.map((v, i) =>
        isPeakSeries[i] && v != null ? (v as number) + 0.6 : null
      ),
      backgroundColor: "rgba(255, 255, 255, 0.5)",
      borderColor: "rgba(255, 255, 255, 0.8)",
      borderWidth: 1.5,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointStyle: "triangle",
      rotation: 180,
      showLine: false,
      order: -1,
    });

    if (latestIndex !== -1) {
      datasets.push({
        label: "_pulse",
        data: actualSeries.map((value: any, idx: number) => (idx === latestIndex ? value : null)),
        pointBackgroundColor: `rgba(13,148,136,${pulseAlpha.toFixed(2)})`,
        pointBorderColor: "transparent",
        pointRadius: 5,
        pointHoverRadius: 5,
        showLine: false,
      });
    }

    return { labels, datasets };
  }, [records, pulseAlpha, viewMode, xAxisLabels]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index" as const, intersect: false },
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            color: "#888",
            usePointStyle: true,
            padding: 16,
            boxWidth: 10,
            font: { size: 11 },
            filter: (item: any) => item.text !== "_pulse",
          },
        },
        tooltip: {
          usePointStyle: true,
          backgroundColor: "rgba(0,0,0,0.85)",
          callbacks: {
            title: (ctx: any[]) => ctx[0]?.parsed?.x != null ? dayjs(ctx[0].parsed.x).format("MMM DD, YYYY HH:mm") : "",
            label: (ctx: any) => {
              const value = ctx.parsed?.y;
              if (value === null || value === undefined) return undefined;
              return `${ctx.dataset.label}: ${value.toFixed(2)} m`;
            },
          },
        },
      },
      scales: {
        x: {
          type: "time" as const,
          time: {
            unit: "hour" as const,
            displayFormats: {
              hour: "HH:mm",
              day: "MM-DD",
            },
            tooltipFormat: "MMM DD YYYY HH:mm",
          },
          ticks: {
            color: "#888",
            maxTicksLimit: 16,
            major: { enabled: true },
            callback: function (value: any, index: number, ticks: any[]) {
              const tick = ticks[index];
              if (!tick) return "";
              if (tick.major) return dayjs(Number(value)).format("MMM-DD");
              return dayjs(Number(value)).format("HH:mm");
            },
          },
          grid: {
            color: (ctx: any) => {
              if (ctx.tick?.major) return "rgba(255,255,255,0.050)";
              return "rgba(255,255,255,0.04)";
            },
            lineWidth: (ctx: any) => ctx.tick?.major ? 2 : 0.5,
          },
        },
        y: {
          afterFit(scale: any) { scale.width = 70; },
          title: { display: true, text: "Water Level (m)", color: "#888" },
          ticks: { color: "#888" },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
      },
    }),
    []
  );

  if (!chartData) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-lg bg-muted/30 text-sm">
        {isLoading ? "Loading Joloi data..." : "No Joloi data for selected filters."}
      </div>
    );
  }

  return <Line data={chartData as any} options={chartOptions as any} />;
}
