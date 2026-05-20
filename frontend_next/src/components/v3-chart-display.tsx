"use client";

import { useState, useEffect, useMemo } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import "chartjs-adapter-dayjs-4";
import dayjs from "dayjs";
import { type EnrichedRecord } from "@/lib/v3-preprocessor";
import { type ViewMode } from "./v3-chart-toolbar";

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  ChartTooltip,
  Legend,
  Filler
);

import { type RainForecastMode } from "./v3-chart-toolbar";

interface V3ChartDisplayProps {
  filteredRecords: EnrichedRecord[];
  viewMode: ViewMode;
  rainForecastMode: RainForecastMode;
  displayMode?: "water_level" | "rainfall";
}

// Helper: hide line segments that jump too much vertically (forecast run boundaries)
const hideJumpSegment = (defaultColor: string) => ({
  borderColor: (ctx: any) => {
    const y0 = ctx.p0?.parsed?.y;
    const y1 = ctx.p1?.parsed?.y;
    if (y0 != null && y1 != null && Math.abs(y1 - y0) > 0.3) {
      return "transparent";
    }
    return defaultColor;
  },
});

const midnightGridPlugin = {
  id: "midnightGrid",
  beforeDatasetsDraw(chart: any) {
    const { ctx, scales, chartArea } = chart;
    if (!scales.x || !chartArea) return;
    const xScale = scales.x;
    let d = dayjs(xScale.min).startOf("day");
    if (d.valueOf() < xScale.min) d = d.add(1, "day");
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 2;
    while (d.valueOf() <= xScale.max) {
      const x = xScale.getPixelForValue(d.valueOf());
      if (x >= chartArea.left && x <= chartArea.right) {
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
      }
      d = d.add(1, "day");
    }
    ctx.restore();
  },
};

const loadableLinesPlugin = {
  id: 'loadableLines',
  beforeDraw: (chart: any) => {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea || !scales.y) return;
    
    const { top, bottom, left, right } = chartArea;
    const yScale = scales.y;

    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
    
    const drawLine = (val: number, label: string) => {
       const datasetIndex = chart.data.datasets.findIndex((d: any) => d.label === label);
       if (datasetIndex !== -1 && !chart.isDatasetVisible(datasetIndex)) return;
       
       let yPos = yScale.getPixelForValue(val);
       if (yPos < top) yPos = top + 1.5; // Offset slightly to remain fully visible
       if (yPos > bottom) yPos = bottom - 1.5;
       
       ctx.beginPath();
       ctx.moveTo(left, yPos);
       ctx.lineTo(right, yPos);
       ctx.stroke();
    };

    drawLine(25.0, "Max Loadable (25m)");
    drawLine(19.8, "Min Loadable (19.8m)");
    ctx.restore();
  }
};

function getObservedRain(record?: EnrichedRecord): number | null {
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

export function V3ChartDisplay({
  filteredRecords,
  viewMode,
  rainForecastMode,
  displayMode = "water_level",
}: V3ChartDisplayProps) {
  const [pulsePhase, setPulsePhase] = useState(0);
  const pulseAlpha = 0.55 + ((Math.sin(pulsePhase) + 1) / 2) * 0.65;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPulsePhase((prev) => prev + 0.35);
    }, 80);
    return () => window.clearInterval(interval);
  }, []);

  const chartData = useMemo(() => {
    if (filteredRecords.length === 0) return null;

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
    const now = dayjs();

    // ── Rainfall chart ────────────────────────────────────────────────────────
    if (displayMode === "rainfall") {
      if (viewMode !== "historical_forecasts") {
        const pre6AM = filteredRecords
          .filter((r) => r.ts.isBefore(today6AM))
          .slice(-72);

        const forecastSeries = filteredRecords
          .filter((r) => !r.ts.isBefore(today6AM))
          .slice(0, 72);

        const labels = [
          ...pre6AM.map((r) => r.label.toDate()),
          ...forecastSeries.map((r) => r.label.toDate()),
        ];

        const nullPre = pre6AM.map(() => null);

        return {
          labels,
          datasets: [
            {
              label: "Historical Rainfall",
              data: [
                ...pre6AM.map((r) => getObservedRain(r)),
                ...forecastSeries.map(() => null),
              ],
              type: "bar" as const,
              backgroundColor: "#4398bcff",
            },
            {
              label: "Forecast Rainfall",
              data: [
                ...nullPre,
                ...forecastSeries.map((r) => {
                  const h = r.ts.diff(today6AM, "hour");
                  if (h <= 24) return r.rain_forecast_1d ?? null;
                  if (h <= 48) return r.rain_forecast_2d ?? null;
                  return r.rain_forecast_3d ?? null;
                }),
              ],
              type: "bar" as const,
              backgroundColor: "rgba(230, 145, 56, 0.45)",
            },
          ],
        };
      }

      const labels = filteredRecords.map((r) => r.label.toDate());
      const datasets: any[] = [
        {
          label: "Historical Rainfall",
          data: filteredRecords.map((r) => getObservedRain(r)),
          type: "bar" as const,
          backgroundColor: "#4398bcff",
        },
      ];

      if (rainForecastMode === "latest") {
        const preFutureCount = filteredRecords.filter((r) => r.ts.isBefore(today6AM)).length;
        const futurePart = filteredRecords.filter((r) => !r.ts.isBefore(today6AM));
        const nullPre = new Array(preFutureCount).fill(null);

        datasets.push({
          label: "Forecast Rainfall 1D",
          data: [
            ...nullPre,
            ...futurePart.map((r) =>
              r.ts.diff(today6AM, "hour") <= 24 ? (r.rain_forecast_1d ?? null) : null
            ),
          ],
          type: "bar" as const,
          backgroundColor: "rgba(230, 145, 56, 0.45)",
        });
        datasets.push({
          label: "Forecast Rainfall 2D",
          data: [
            ...nullPre,
            ...futurePart.map((r) => {
              const h = r.ts.diff(today6AM, "hour");
              return h > 23 && h <= 48 ? (r.rain_forecast_2d ?? null) : null;
            }),
          ],
          type: "bar" as const,
          backgroundColor: "rgba(210, 95, 50, 0.45)",
        });
        datasets.push({
          label: "Forecast Rainfall 3D",
          data: [
            ...nullPre,
            ...futurePart.map((r) =>
              r.ts.diff(today6AM, "hour") > 47 ? (r.rain_forecast_3d ?? null) : null
            ),
          ],
          type: "bar" as const,
          backgroundColor: "rgba(175, 60, 45, 0.45)",
        });
      } else {
        const show1d = rainForecastMode === "all" || rainForecastMode === "1d";
        const show2d = rainForecastMode === "all" || rainForecastMode === "2d";
        const show3d = rainForecastMode === "all" || rainForecastMode === "3d";

        if (show1d) {
          datasets.push({
            label: "Forecast Rainfall 1D",
            data: filteredRecords.map((r) => r.rain_forecast_1d ?? null),
            type: "bar" as const,
            backgroundColor: "rgba(230, 145, 56, 0.45)",
          });
        }
        if (show2d) {
          datasets.push({
            label: "Forecast Rainfall 2D",
            data: filteredRecords.map((r) => r.rain_forecast_2d ?? null),
            type: "bar" as const,
            backgroundColor: "rgba(210, 95, 50, 0.45)",
          });
        }
        if (show3d) {
          datasets.push({
            label: "Forecast Rainfall 3D",
            data: filteredRecords.map((r) => r.rain_forecast_3d ?? null),
            type: "bar" as const,
            backgroundColor: "rgba(175, 60, 45, 0.45)",
          });
        }
      }

      return { labels, datasets };
    }

    // ── Historical Forecasts view ────────────────────────────────────────────
    if (viewMode === "historical_forecasts") {
      const labels = filteredRecords.map((r) => r.label.toDate());
      const muaraActual = filteredRecords.map((r) => r.actual ?? null);
      const datasets: any[] = [];

      datasets.push({
        label: "Muara Tuhup Actual",
        data: muaraActual,
        borderColor: "#4398bcff",
        backgroundColor: "rgba(56, 189, 248, 0.15)",
        borderWidth: 2,
        tension: 0.25,
        pointRadius: 0,
        fill: true,
      });

      if (rainForecastMode === "latest") {
        // Time-gated: apply horizon buckets relative to today6AM (only future records)
        const preFutureCount = filteredRecords.filter((r) => r.ts.isBefore(today6AM)).length;
        const futurePart = filteredRecords.filter((r) => !r.ts.isBefore(today6AM));
        const nullPre = new Array(preFutureCount).fill(null);

        datasets.push({
          label: "1-Day Forecast",
          data: [...nullPre, ...futurePart.map((r) => r.ts.diff(today6AM, "hour") <= 24 ? (r.pred_1d ?? null) : null)],
          borderColor: "rgba(230, 145, 56, 0.7)",
          backgroundColor: "rgba(230, 145, 56, 0.15)",
          borderDash: [4, 3], borderWidth: 2, tension: 0.25, pointRadius: 1, spanGaps: false,
          segment: hideJumpSegment("rgba(230, 145, 56, 0.7)"),
        });
        datasets.push({
          label: "2-Day Forecast",
          data: [...nullPre, ...futurePart.map((r) => { const h = r.ts.diff(today6AM, "hour"); return h > 23 && h <= 48 ? (r.pred_2d ?? null) : null; })],
          borderColor: "rgba(210, 95, 50, 0.7)",
          backgroundColor: "rgba(210, 95, 50, 0.15)",
          borderDash: [4, 3], borderWidth: 2, tension: 0.25, pointRadius: 1, spanGaps: false,
          segment: hideJumpSegment("rgba(210, 95, 50, 0.7)"),
        });
        datasets.push({
          label: "3-Day Forecast",
          data: [...nullPre, ...futurePart.map((r) => r.ts.diff(today6AM, "hour") > 47 ? (r.pred_3d ?? null) : null)],
          borderColor: "rgba(175, 60, 45, 0.7)",
          backgroundColor: "rgba(175, 60, 45, 0.15)",
          borderDash: [4, 3], borderWidth: 2, tension: 0.25, pointRadius: 1, spanGaps: false,
          segment: hideJumpSegment("rgba(175, 60, 45, 0.7)"),
        });
      } else {
        // Full historical series — no time-gating
        const show1d = rainForecastMode === "all" || rainForecastMode === "1d";
        const show2d = rainForecastMode === "all" || rainForecastMode === "2d";
        const show3d = rainForecastMode === "all" || rainForecastMode === "3d";

        if (show1d) datasets.push({
          label: "1-Day Forecast",
          data: filteredRecords.map((r) => r.pred_1d ?? null),
          borderColor: "rgba(230, 145, 56, 0.7)",
          backgroundColor: "rgba(230, 145, 56, 0.15)",
          borderDash: [4, 3], borderWidth: 2, tension: 0.25, pointRadius: 0, spanGaps: false,
          segment: hideJumpSegment("rgba(230, 145, 56, 0.7)"),
        });
        if (show2d) datasets.push({
          label: "2-Day Forecast",
          data: filteredRecords.map((r) => r.pred_2d ?? null),
          borderColor: "rgba(210, 95, 50, 0.7)",
          backgroundColor: "rgba(210, 95, 50, 0.15)",
          borderDash: [4, 3], borderWidth: 2, tension: 0.25, pointRadius: 0, spanGaps: false,
          segment: hideJumpSegment("rgba(210, 95, 50, 0.7)"),
        });
        if (show3d) datasets.push({
          label: "3-Day Forecast",
          data: filteredRecords.map((r) => r.pred_3d ?? null),
          borderColor: "rgba(175, 60, 45, 0.7)",
          backgroundColor: "rgba(175, 60, 45, 0.15)",
          borderDash: [4, 3], borderWidth: 2, tension: 0.25, pointRadius: 0, spanGaps: false,
          segment: hideJumpSegment("rgba(175, 60, 45, 0.7)"),
        });
      }

      datasets.push({
        label: "Tuhup Peak",
        data: filteredRecords.map((r) =>
          r.is_peak && r.actual != null ? r.actual + 0.2 : null
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

      datasets.push({
        label: "Max Loadable (25m)",
        data: [],
        borderColor: "rgba(16, 185, 129, 0.4)",
        borderWidth: 1.5,
        borderDash: [5, 5],
      });
      datasets.push({
        label: "Min Loadable (19.8m)",
        data: [],
        borderColor: "rgba(16, 185, 129, 0.4)",
        borderWidth: 1.5,
        borderDash: [5, 5],
      });

      return { labels, datasets };
    }

    // ── Latest vs Actual & Error Analysis views ──────────────────────────────
    const pre6AM = filteredRecords
      .filter((r) => r.ts.isBefore(today6AM))
      .slice(-72);

    const forecastSeries = filteredRecords
      .filter((r) => !r.ts.isBefore(today6AM))
      .slice(0, 72);

    const labels = [
      ...pre6AM.map((r) => r.label.toDate()),
      ...forecastSeries.map((r) => r.label.toDate()),
    ];

    const muaraActual = [
      ...pre6AM.map((r) => r.actual ?? null),
      ...forecastSeries.map((r) =>
        r.ts.isBefore(now) || r.ts.isSame(now) ? (r.actual ?? null) : null
      ),
    ];

    const nullPre = pre6AM.map(() => null);
    const datasets: any[] = [];

    if (viewMode === "error_analysis") {
      const combinedSeries = [...pre6AM, ...forecastSeries];
      datasets.push({
        label: "1-Day Error",
        data: combinedSeries.map((r) => {
          const diff = r.diff_1d;
          return diff === null || diff === undefined ? null : Math.abs(diff) * 100;
        }),
        backgroundColor: "rgba(230, 145, 56, 0.5)",
        order: 1,
      });
      datasets.push({
        label: "2-Day Error",
        data: combinedSeries.map((r) => {
          const diff = r.diff_2d;
          return diff === null || diff === undefined ? null : Math.abs(diff) * 100;
        }),
        backgroundColor: "rgba(210, 95, 50, 0.5)",
        order: 2,
      });
      datasets.push({
        label: "3-Day Error",
        data: combinedSeries.map((r) => {
          const diff = r.diff_3d;
          return diff === null || diff === undefined ? null : Math.abs(diff) * 100;
        }),
        backgroundColor: "rgba(175, 60, 45, 0.5)",
        order: 3,
      });
      datasets.push({
        label: "Green Zone (<=20 cm)",
        data: new Array(labels.length).fill(20),
        type: "line" as const,
        borderColor: "#22c55e",
        borderWidth: 2,
        borderDash: [8, 4],
        pointRadius: 0,
        order: 0,
      });
    } else {
      // latest_vs_actual
      datasets.push({
        label: "Muara Tuhup Actual",
        data: muaraActual,
        borderColor: "#4398bcff",
        backgroundColor: "rgba(56, 189, 248, 0.2)",
        borderWidth: 2,
        tension: 0.25,
        pointRadius: 1.5,
        fill: true,
      });
      datasets.push({
        label: "1-Day Forecast",
        data: [...nullPre, ...forecastSeries.map((r) => r.ts.diff(today6AM, "hour") <= 24 ? (r.pred_1d ?? null) : null)],
        borderColor: "rgba(230, 145, 56, 0.7)",
        backgroundColor: "rgba(230, 145, 56, 0.15)",
        borderDash: [4, 3], borderWidth: 2, tension: 0.25, pointRadius: 1, spanGaps: false,
        segment: hideJumpSegment("rgba(230, 145, 56, 0.7)"),
      });
      datasets.push({
        label: "2-Day Forecast",
        data: [...nullPre, ...forecastSeries.map((r) => { const h = r.ts.diff(today6AM, "hour"); return h > 23 && h <= 48 ? (r.pred_2d ?? null) : null; })],
        borderColor: "rgba(210, 95, 50, 0.7)",
        backgroundColor: "rgba(210, 95, 50, 0.15)",
        borderDash: [4, 3], borderWidth: 2, tension: 0.25, pointRadius: 1, spanGaps: false,
        segment: hideJumpSegment("rgba(210, 95, 50, 0.7)"),
      });
      datasets.push({
        label: "3-Day Forecast",
        data: [...nullPre, ...forecastSeries.map((r) => r.ts.diff(today6AM, "hour") > 47 ? (r.pred_3d ?? null) : null)],
        borderColor: "rgba(175, 60, 45, 0.7)",
        backgroundColor: "rgba(175, 60, 45, 0.15)",
        borderDash: [4, 3], borderWidth: 2, tension: 0.25, pointRadius: 1, spanGaps: false,
        segment: hideJumpSegment("rgba(175, 60, 45, 0.7)"),
      });
      const combinedSeries = [...pre6AM, ...forecastSeries];
      datasets.push({
        label: "Tuhup Peak",
        data: combinedSeries.map((r, i) =>
          r.is_peak && muaraActual[i] != null
            ? (muaraActual[i] as number) + 0.2
            : null
        ),
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        borderColor: "rgba(255, 255, 255, 0.8)",
        borderWidth: 1.5, pointRadius: 4, pointHoverRadius: 6,
        pointStyle: "triangle", rotation: 180, showLine: false, order: -1,
      });
    }

    // Pulse dot on latest actual reading
    if (viewMode !== "error_analysis") {
      let li = -1;
      for (let i = muaraActual.length - 1; i >= 0; i--) {
        if (muaraActual[i] != null) { li = i; break; }
      }
      if (li !== -1) {
        datasets.push({
          label: "_pulse",
          data: muaraActual.map((v, i) => (i === li ? v : null)),
          pointBackgroundColor: `rgba(56,189,248,${pulseAlpha.toFixed(2)})`,
          pointBorderColor: "transparent",
          pointRadius: 5, pointHoverRadius: 5, showLine: false,
        });
      }
    }

    if (viewMode !== "error_analysis") {
      datasets.push({
        label: "Max Loadable (25m)",
        data: [],
        borderColor: "rgba(16, 185, 129, 0.4)",
        borderWidth: 1.5,
        borderDash: [5, 5],
      });
      datasets.push({
        label: "Min Loadable (19.8m)",
        data: [],
        borderColor: "rgba(16, 185, 129, 0.4)",
        borderWidth: 1.5,
        borderDash: [5, 5],
      });
    }

    return { labels, datasets };
  }, [displayMode, filteredRecords, viewMode, rainForecastMode, pulseAlpha]);

  const chartOptions = useMemo(() => {
    const isRainfall = displayMode === "rainfall";
    const isErrorAnalysis = viewMode === "error_analysis";
    const unit = isRainfall ? "mm" : isErrorAnalysis ? "cm" : "m";

    return {
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
              return `${ctx.dataset.label}: ${value.toFixed(2)} ${unit}`;
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
          offset: false,
          ticks: {
            color: "#888",
            maxTicksLimit: 16,
            major: { enabled: true },
            callback: function(value: any, index: number, ticks: any[]) {
              const tick = ticks[index];
              if (!tick) return "";
              if (tick.major) return dayjs(Number(value)).format("MMM-DD");
              return dayjs(Number(value)).format("HH:mm");
            },
          },
          grid: displayMode == "rainfall"
          ? {
                color: "rgba(255,255,255,0.04)",
                lineWidth: 0.5,
            }
          : {
            color: (ctx: any) => {
              if (ctx.tick?.major) return "rgba(255,255,255,0.050)";
              return "rgba(255,255,255,0.05)";
            },
            lineWidth: (ctx: any) => ctx.tick?.major ? 2 : 0.5,
          },
        },
        y: {
          afterFit(scale: any) { scale.width = 70; },
          title: {
            display: true,
            text: isRainfall ? "Rainfall (mm)" : isErrorAnalysis ? "Absolute Error (cm)" : "Water Level (m)",
            color: "#888",
          },
          ticks: { color: "#888" },
          grid: { color: "rgba(255,255,255,0.05)" },
          beginAtZero: isRainfall || isErrorAnalysis,
        },
      },
    };
  }, [displayMode, viewMode]);

  if (!chartData) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-lg bg-muted/30 text-sm">
        {displayMode === "rainfall"
          ? "No rainfall data for selected filters."
          : "No Muara Tuhup data for selected filters."}
      </div>
    );
  }

  if (displayMode === "rainfall") {
    return <Bar data={chartData as any} options={chartOptions as any} plugins={[midnightGridPlugin]} />;
  }

  if (viewMode === "error_analysis") {
    return <Bar data={chartData as any} options={chartOptions as any} plugins={[midnightGridPlugin]} />;
  }

  return <Line data={chartData as any} options={chartOptions as any} plugins={[loadableLinesPlugin]} />;
}
