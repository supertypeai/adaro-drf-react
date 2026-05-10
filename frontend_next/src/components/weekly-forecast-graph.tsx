"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { Location } from "@/services/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTooltip, Legend, Filler);

interface WeeklyRow {
  date: string;
  hour: number;
  variable: string;
  value: number;
  [key: string]: unknown;
}

interface WeeklyForecastGraphProps {
  loc: Location;
  weeklyData: WeeklyRow[];
}

export function WeeklyForecastGraph({ loc, weeklyData }: WeeklyForecastGraphProps) {
  const isSensor = loc.sensor;

  const enriched = weeklyData.map((x) => ({
    ...x,
    DateHour: `${x.date}-${x.hour}`,
  }));

  const filter = (variable: string) => enriched.filter((r) => r.variable === variable);

  const predictData = filter("predict");
  const low80 = filter("lower_80");
  const up80 = filter("upper_80");
  const low90 = filter("lower_90");
  const up90 = filter("upper_90");
  const low95 = filter("lower_95");
  const up95 = filter("upper_95");

  const labels = predictData.map((row) => {
    const parts = row.DateHour.split("-");
    if (isSensor) {
      return `${parts[0]}-${parts[1]}-${parts[2]}, ${parts[3]}-Hour`;
    }
    return `${parts[0]}-${parts[1]}-${parts[2]}`;
  });

  const chartData = {
    labels,
    datasets: [
      { label: "Lower_80%CI", data: low80.map((r) => r.value), borderColor: "transparent", backgroundColor: "rgba(75,192,255,0.3)", pointRadius: 0, fill: false, tension: 0 },
      { label: "80% CI", data: predictData.map((r) => r.value), borderColor: "rgb(75,192,255)", backgroundColor: "rgb(75,192,255)", pointRadius: 0, fill: false, tension: 0 },
      { label: "Upper_80%CI", data: up80.map((r) => r.value), borderColor: "transparent", backgroundColor: "rgba(75,192,255,0.3)", pointRadius: 0, fill: "-2" as unknown as boolean, tension: 0 },
      { label: "Lower_90%CI", data: low90.map((r) => r.value), borderColor: "transparent", backgroundColor: "rgba(255,75,75,0.3)", pointRadius: 0, fill: false, tension: 0 },
      { label: "90% CI", data: predictData.map((r) => r.value), borderColor: "rgb(255,75,75)", backgroundColor: "rgb(255,75,75)", pointRadius: 0, fill: false, tension: 0 },
      { label: "Upper_90%CI", data: up90.map((r) => r.value), borderColor: "transparent", backgroundColor: "rgba(255,75,75,0.3)", pointRadius: 0, fill: "-2" as unknown as boolean, tension: 0 },
      { label: "Lower_95%CI", data: low95.map((r) => r.value), borderColor: "transparent", backgroundColor: "rgba(255,246,75,0.3)", pointRadius: 0, fill: false, tension: 0 },
      { label: "95% CI", data: predictData.map((r) => r.value), borderColor: "rgb(255,246,75)", backgroundColor: "rgb(255,246,75)", pointRadius: 0, fill: false, tension: 0 },
      { label: "Upper_95%CI", data: up95.map((r) => r.value), borderColor: "transparent", backgroundColor: "rgba(255,246,75,0.3)", pointRadius: 0, fill: "-2" as unknown as boolean, tension: 0 },
    ],
  };

  return (
    <Line
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              color: "white",
              filter: (item) => !item.text.includes("_"),
            },
            onClick: (e, legendItem, legend) => {
              const idx = legendItem.datasetIndex ?? 0;
              const ci = legend.chart;
              const isHidden = ci.getDatasetMeta(idx).hidden;
              // Chart.js runtime accepts null to reset; TS types are narrower
              /* eslint-disable @typescript-eslint/ban-ts-comment */
              const newVal = isHidden ? null : true;
              // @ts-ignore
              ci.getDatasetMeta(idx - 1).hidden = newVal;
              // @ts-ignore
              ci.getDatasetMeta(idx).hidden = newVal;
              // @ts-ignore
              ci.getDatasetMeta(idx + 1).hidden = newVal;
              ci.update();
            },
          },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          x: {
            ticks: { color: "#888", maxTicksLimit: 7, maxRotation: 0 },
            grid: { color: "rgba(255,255,255,0.06)" },
          },
          y: {
            ticks: { color: "#888" },
            grid: { color: "rgba(255,255,255,0.06)" },
            title: { display: true, text: "Water Level (m)", color: "#888" },
          },
        },
      }}
    />
  );
}
