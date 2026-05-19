"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Filler,
  type Plugin,
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

interface LocationChartData {
  loc: Location;
  allData: DataRecord[];
  color: string;
}

interface AllLocationsChartProps {
  locations: Location[];
}

const latestValueLabelPlugin: Plugin<"line"> = {
  id: "latest-value-label",
  afterDatasetsDraw(chart) {
    const markerDatasetIndex = 1;
    const markerDataset = chart.data.datasets[markerDatasetIndex];
    if (!markerDataset) return;

    const markerData = markerDataset.data as (number | null)[];
    const latestIndex = markerData.findIndex((v) => v != null);
    if (latestIndex === -1) return;

    const latestValue = markerData[latestIndex];
    if (typeof latestValue !== "number") return;

    const point = chart.getDatasetMeta(markerDatasetIndex).data[latestIndex];
    if (!point) return;

    const { ctx, chartArea } = chart;
    const text = `${latestValue.toFixed(2)} m`;
    const padX = 6;
    const boxHeight = 16;
    const radius = 4;

    ctx.save();
    ctx.font = "600 10px sans-serif";
    ctx.textBaseline = "middle";

    const textWidth = ctx.measureText(text).width;
    const boxWidth = textWidth + padX * 2;

    const x = Math.min(point.x + 8, chartArea.right - boxWidth - 6);
    const y = Math.min(point.y - boxHeight / 2, chartArea.bottom - boxHeight - 2
    );

    // Draw filled rounded rectangle
    ctx.fillStyle = "rgba(27, 39, 59, 0.8)";
    ctx.strokeStyle = "rgba(137,168,220,0.65)";
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.roundRect(x, y, boxWidth, boxHeight, radius);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#89a8dc";
    ctx.fillText(text, x + padX, y + boxHeight / 2);
    ctx.restore();
  },
};

export function AllLocationsChart({ locations }: AllLocationsChartProps) {
  const [chartsData, setChartsData] = useState<LocationChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<RangeLabel>("1D");
  const [pulsePhase, setPulsePhase] = useState(0);

  const pulseAlpha = 0.55 + ((Math.sin(pulsePhase) + 1) / 2) * 0.65;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPulsePhase((prev) => prev + 0.35);
    }, 80);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (locations.length === 0) return;

    const fetchAll = async () => {
      setLoading(true);
      const results = await Promise.allSettled(
        locations.map((loc) =>
          APIService.getData(loc.id, loc.sensor, loc.name).then((data) => ({
            loc,
            allData: data,
            color: "#537EC5"
          }))
        )
      );
      // console.log(locations);
      // console.log(results);

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
            className={
              cn("bg-primary/40 h-8 px-3 text-xs border-none")
            }
            onClick={() => setSelectedRange(r.label)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {/* One small chart per location */}
      <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1 custom-scrollbar">
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
          const values: (number | null)[] = filtered.map((d) => d.measurement);

          // console.log(labels);

          // if (filtered.length > 0) {
          //   const last = filtered[filtered.length - 1];
          //   const lastTime = dayjs(`${last.date}T${String(last.hour).padStart(2, "0")}:00:00`);
          //   const endOfDay = lastTime.endOf("day");

          //   if (endOfDay.isAfter(lastTime)) {
          //     labels.push(endOfDay.format("MM/DD HH:mm"));
          //     values.push(null);
          //   }
          // }

          let latestIndex = -1;
          for (let i = values.length - 1; i >= 0; i -= 1) {
            if (values[i] != null) {
              latestIndex = i;
              break;
            }
          }

          const latest = latestIndex >= 0 ? values[latestIndex] : null;
          const latestMarker = values.map((_, idx) =>
            idx === latestIndex ? values[idx] : null
          );

          return (
            <div key={loc.id} className="space-y-1">
              <div className="flex items-center justify-between bg-background p-2 rounded-lg">
                <span className="text-xs font-medium truncate">
                  {loc.title}
                </span>
                {/* <span className="text-xs text-[#89a8dc] font-bold font-mono">
                  {latest != null ? `${Number(latest).toFixed(2)} m` : "N/A"}
                </span> */}
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
                        spanGaps: false,
                        fill: true,
                      },
                      {
                        data: latestMarker,
                        pointBackgroundColor: `rgba(137,168,220,${pulseAlpha})`,
                        pointRadius: 5,
                        pointHoverRadius: 5,
                        showLine: false,
                      },
                    ],
                  }}
                  plugins={[latestValueLabelPlugin]}
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
