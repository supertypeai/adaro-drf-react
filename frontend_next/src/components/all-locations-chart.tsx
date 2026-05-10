"use client";

import { useEffect, useState, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Location, APIService, DataRecord } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTooltip, Filler);

const RANGES = [
  { label: "1D", hours: 24 },
  { label: "2D", hours: 48 },
  { label: "3D", hours: 72 },
  { label: "5D", hours: 120 },
  { label: "7D", hours: 168 },
] as const;

type RangeLabel = (typeof RANGES)[number]["label"];

const COLORS = [
  "#537EC5",
  "#52c41a",
  "#ff4d4f",
  "#faad14",
  "#722ed1",
  "#13c2c2",
  "#eb2f96",
  "#1890ff",
];

interface LocationChartData {
  loc: Location;
  allData: DataRecord[];
  color: string;
}

interface AllLocationsChartProps {
  locations: Location[];
}

export function AllLocationsChart({ locations }: AllLocationsChartProps) {
  const [chartsData, setChartsData] = useState<LocationChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<RangeLabel>("1D");

  useEffect(() => {
    if (locations.length === 0) return;

    const fetchAll = async () => {
      setLoading(true);
      const results = await Promise.allSettled(
        locations.map((loc, i) =>
          APIService.getData(loc.id, loc.sensor, loc.name).then((data) => ({
            loc,
            allData: data,
            color: COLORS[i % COLORS.length],
          }))
        )
      );

      const newData: LocationChartData[] = [];
      results.forEach((res) => {
        if (res.status === "fulfilled") newData.push(res.value);
      });
      setChartsData(newData);
      setLoading(false);
    };

    fetchAll();
  }, [locations]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const rangeHours = RANGES.find((r) => r.label === selectedRange)?.hours ?? 24;
  const cutoff = dayjs().subtract(rangeHours, "hour");

  return (
    <div className="space-y-3">
      {/* Range selector */}
      <div className="flex gap-1">
        {RANGES.map((r) => (
          <Button
            key={r.label}
            size="sm"
            variant={selectedRange === r.label ? "default" : "outline"}
            className={cn("h-6 px-2 text-xs flex-1")}
            onClick={() => setSelectedRange(r.label)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {/* One small chart per location */}
      <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1">
        {chartsData.map(({ loc, allData, color }) => {
          // Filter to selected time range
          const filtered = allData
            .filter((d) => {
              const dt = dayjs(`${d.date}T${String(d.hour).padStart(2, "0")}:00:00`);
              return dt.isAfter(cutoff);
            })
            .sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);

          const labels = filtered.map((d) =>
            dayjs(`${d.date}T${String(d.hour).padStart(2, "0")}:00:00`).format("MM/DD HH:mm")
          );
          const values = filtered.map((d) => d.measurement);
          const latest = values[values.length - 1];

          return (
            <div key={loc.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium truncate" style={{ color }}>
                  {loc.title}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {latest != null ? `${Number(latest).toFixed(2)} m` : "N/A"}
                </span>
              </div>
              <div className="h-[80px]">
                <Line
                  data={{
                    labels,
                    datasets: [
                      {
                        data: values,
                        borderColor: color,
                        backgroundColor: color + "20",
                        borderWidth: 1.5,
                        tension: 0.3,
                        pointRadius: 0,
                        fill: true,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: "rgba(0,0,0,0.85)",
                        titleFont: { size: 9 },
                        bodyFont: { size: 9 },
                        callbacks: {
                          label: (ctx) => `${Number(ctx.parsed.y).toFixed(2)} m`,
                        },
                      },
                    },
                    scales: {
                      x: {
                        ticks: {
                          color: "#555",
                          maxTicksLimit: 4,
                          font: { size: 8 },
                        },
                        grid: { display: false },
                      },
                      y: {
                        ticks: { color: "#555", font: { size: 8 }, maxTicksLimit: 3 },
                        grid: { color: "rgba(255,255,255,0.04)" },
                      },
                    },
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
