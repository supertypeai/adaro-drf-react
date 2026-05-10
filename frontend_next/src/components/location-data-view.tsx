"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { APIService, Location, DataRecord } from "@/services/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, ChartTooltip, Legend);

interface LocationDataViewProps {
  location: Location;
}

export function LocationDataView({ location }: LocationDataViewProps) {
  const [data, setData] = useState<DataRecord[]>([]);
  const [filteredData, setFilteredData] = useState<DataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  useEffect(() => {
    setLoading(true);
    APIService.getData(location.id, location.sensor, location.name)
      .then((resp) => {
        setData(resp);
        setFilteredData(resp);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [location]);

  const handleFilter = () => {
    if (filterMonth) {
      setFilteredData(data.filter((d) => d.date.includes(filterMonth)));
    }
    setPage(0);
  };

  const handleReset = () => {
    setFilteredData(data);
    setFilterMonth("");
    setPage(0);
  };

  if (loading) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  const sortedForChart = [...filteredData].sort(
    (a, b) => a.date.localeCompare(b.date) || a.hour - b.hour
  );

  const paginatedData = filteredData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Water Level Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <Line
              data={{
                labels: sortedForChart.map((d) => d.DateHour),
                datasets: [
                  {
                    label: "Measurement",
                    data: sortedForChart.map((d) => d.measurement),
                    borderColor: "#537EC5",
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: "#fff", font: { size: 11 } } },
                  tooltip: { backgroundColor: "rgba(0,0,0,0.85)" },
                },
                scales: {
                  x: {
                    ticks: {
                      color: "#888",
                      maxTicksLimit: 8,
                      font: { size: 10 },
                      callback: function (value: string | number) {
                        const label = this.getLabelForValue(Number(value));
                        const parts = label.split("-");
                        return parts.length >= 4 ? `${parts[1]}/${parts[2]} H${parts[3]}` : label;
                      },
                    },
                    grid: { color: "rgba(255,255,255,0.05)" },
                  },
                  y: {
                    title: { display: true, text: "Measurement", color: "#888" },
                    ticks: { color: "#888" },
                    grid: { color: "rgba(255,255,255,0.05)" },
                  },
                },
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <input
          type="month"
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        />
        <Button variant="default" size="sm" className="h-8 text-xs" onClick={handleFilter}>Filter</Button>
        <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={handleReset}>Reset</Button>
      </div>

      {/* Data table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Hour</TableHead>
                  <TableHead>Measurement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, i) => (
                  <TableRow key={`${row.date}-${row.hour}-${i}`}>
                    <TableCell className="text-xs">{row.date}</TableCell>
                    <TableCell className="text-xs">{String(row.hour).padStart(2, "0")}:00</TableCell>
                    <TableCell className="text-xs font-mono">{row.measurement}</TableCell>
                  </TableRow>
                ))}
                {paginatedData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredData.length)} of {filteredData.length}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
