"use client";

import React, { useState, useMemo, useEffect } from "react";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Download, Info, Table as TableIcon, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import type { DateRange } from "react-day-picker";
import type { V3TableRecord } from "@/services/api";

// Configure dayjs plugins
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(customParseFormat);

interface V3PerformanceTableProps {
  v3TableData: V3TableRecord[];
}

export function V3PerformanceTable({ v3TableData }: V3PerformanceTableProps) {
  const availableDateRange = useMemo(() => {
    if (!v3TableData || v3TableData.length === 0) {
      return { minDate: dayjs().subtract(7, "days"), maxDate: dayjs() };
    }
    const dates = v3TableData.map((item) => dayjs(item.date)).filter((d) => d.isValid());
    if (dates.length === 0) return { minDate: dayjs().subtract(60, "days"), maxDate: dayjs().add(10, "days") };
    let minDate = dates[0];
    let maxDate = dates[0];
    dates.forEach((date) => {
      if (date.isBefore(minDate)) minDate = date;
      if (date.isAfter(maxDate)) maxDate = date;
    });
    return { minDate, maxDate };
  }, [v3TableData]);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const start = availableDateRange.minDate.isAfter(dayjs().subtract(7, "days"))
      ? availableDateRange.minDate
      : dayjs().subtract(7, "days");
    const end = availableDateRange.maxDate.isBefore(dayjs())
      ? availableDateRange.maxDate
      : dayjs();
    return { from: start.toDate(), to: end.toDate() };
  });

  const [sortConfig, setSortConfig] = useState<{ key: keyof V3TableRecord | string; direction: 'asc' | 'desc' }>({
    key: 'date_hour',
    direction: 'desc'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [hasAutoPaged, setHasAutoPaged] = useState(false);
  const pageSize = 20;

  // Filter data based on date range
  const filteredData = useMemo(() => {
    if (!v3TableData || !dateRange?.from || !dateRange?.to) return [];

    const startDate = dayjs(dateRange.from);
    const endDate = dayjs(dateRange.to);

    return v3TableData.filter(item => {
      const itemDate = dayjs(item.date);
      return itemDate.isAfter(startDate.subtract(1, 'day')) &&
        itemDate.isBefore(endDate.add(1, 'day'));
    });
  }, [v3TableData, dateRange]);

  // Sort data
  const sortedData = useMemo(() => {
    const sortableItems = [...filteredData];
    sortableItems.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortConfig.key === 'date_hour') {
        const dateCompare = a.date.localeCompare(b.date);
        return sortConfig.direction === 'asc'
          ? (dateCompare !== 0 ? dateCompare : a.hour - b.hour)
          : (dateCompare !== 0 ? -dateCompare : b.hour - a.hour);
      }

      aValue = a[sortConfig.key as keyof V3TableRecord];
      bValue = b[sortConfig.key as keyof V3TableRecord];

      if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortableItems;
  }, [filteredData, sortConfig]);

  // Auto-navigate to today's date at 06:00 on initial data load
  useEffect(() => {
    if (sortedData.length > 0 && !hasAutoPaged) {
      const todayStr = dayjs().format("YYYY-MM-DD");
      const targetIndex = sortedData.findIndex(
        (item) => item.date === todayStr && item.hour === 6
      );

      if (targetIndex !== -1) {
        setCurrentPage(Math.floor(targetIndex / pageSize) + 1);
      } else {
        const todayIndex = sortedData.findIndex((item) => item.date === todayStr);
        if (todayIndex !== -1) {
          setCurrentPage(Math.floor(todayIndex / pageSize) + 1);
        }
      }
      setHasAutoPaged(true);
    }
  }, [sortedData, hasAutoPaged, pageSize]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getAccuracyColor = (diff: number | null | undefined) => {
    if (diff === undefined || diff === null) return 'secondary';
    if (diff <= 0.25) return 'default';      // default (black/primary in shadcn but usually we'd want custom colors. Let's use custom tailwind classes below)
    return 'outline';
  };

  const renderAccuracyBadge = (diff: number | null | undefined) => {
    if (diff === undefined || diff === null) return <span className="text-muted-foreground">N/A</span>;

    let colorClass = "border-emerald-200/60 bg-emerald-50/50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400";
    if (diff > 0.25 && diff <= 0.5) colorClass = "border-blue-200/60 bg-blue-50/50 text-blue-600 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-400";
    else if (diff > 0.5 && diff <= 1.0) colorClass = "border-amber-200/60 bg-amber-50/50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400";
    else if (diff > 1.0) colorClass = "border-rose-200/60 bg-rose-50/50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-400";

    return (
      <Badge variant="outline" className={`font-medium ${colorClass} transition-colors`}>
        {(diff * 100).toFixed(0)}cm
      </Badge>
    );
  };

  const exportData = () => {
    const csvContent = [
      // Header
      ['Date', 'Hour', 'Actual', 'Pred_1d', 'Error_1d_cm', 'Pred_2d', 'Error_2d_cm', 'Pred_3d', 'Error_3d_cm'].join(','),
      // Data rows
      ...filteredData.map(row => [
        row.date,
        row.hour,
        row.actual?.toFixed(2) || '',
        row.pred_1d?.toFixed(2) || '',
        row.diff_1d !== null && row.diff_1d !== undefined ? (row.diff_1d * 100).toFixed(0) : '',
        row.pred_2d?.toFixed(2) || '',
        row.diff_2d !== null && row.diff_2d !== undefined ? (row.diff_2d * 100).toFixed(0) : '',
        row.pred_3d?.toFixed(2) || '',
        row.diff_3d !== null && row.diff_3d !== undefined ? (row.diff_3d * 100).toFixed(0) : '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `v3_performance_${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const SortableHead = ({ label, sortKey, tooltip }: { label: string, sortKey: string, tooltip?: string }) => (
    <TableHead>
      <div
        className="flex items-center gap-1 cursor-pointer hover:text-foreground group whitespace-nowrap"
        onClick={() => requestSort(sortKey)}
      >
        {label}
        {tooltip && (
          <TooltipProvider delay={300}>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <ArrowUpDown className={`h-3 w-3 ${sortConfig.key === sortKey ? 'text-foreground' : 'text-transparent group-hover:text-muted-foreground'}`} />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      <Card className="shadow-md w-fit ml-auto px-1 py-1">
        <CardContent className="px-0 py-0">
          {/* Primary toolbar row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DatePickerWithRange
              date={dateRange}
              setDate={setDateRange}
              className="w-[260px]"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
              disabled={!filteredData.length}
              className="gap-2 h-8 rounded-lg"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-t-2 border-t-primary/20 overflow-hidden pt-2">
        <CardHeader className="bg-muted/10 !pb-1 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardDescription className="text-sm flex flex-wrap items-center gap-x-2 gap-y-1 py-0">
              <span>Accuracy variance thresholds:</span>
              <span className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400/80"></span>≤25cm</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-400/80"></span>≤50cm</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400/80"></span>≤100cm</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400/80"></span>&gt;100cm</span>
              </span>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-x-auto text-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <SortableHead label="Date" sortKey="date_hour" />
                  <SortableHead label="Hour" sortKey="hour" />
                  <SortableHead label="Actual (m)" sortKey="actual" />
                  <SortableHead label="1-Day Pred" sortKey="pred_1d" />
                  <SortableHead label="1D Error" sortKey="diff_1d" tooltip="Absolute difference between actual and 1-day prediction" />
                  <SortableHead label="2-Day Pred" sortKey="pred_2d" />
                  <SortableHead label="2D Error" sortKey="diff_2d" tooltip="Absolute difference between actual and 2-day prediction" />
                  <SortableHead label="3-Day Pred" sortKey="pred_3d" />
                  <SortableHead label="3D Error" sortKey="diff_3d" tooltip="Absolute difference between actual and 3-day prediction" />
                  <TableHead>Best Prediction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                      No data available for the selected date range.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((record) => {
                    const hasValues = record.actual !== null && (record.diff_1d !== null || record.diff_2d !== null || record.diff_3d !== null);

                    let bestKey = '';
                    let bestVal = Infinity;
                    if (hasValues) {
                      const diffs = [
                        { key: '1D', val: record.diff_1d },
                        { key: '2D', val: record.diff_2d },
                        { key: '3D', val: record.diff_3d },
                      ].filter(d => d.val !== null && d.val !== undefined) as { key: string, val: number }[];

                      if (diffs.length > 0) {
                        const best = diffs.reduce((min, curr) => curr.val < min.val ? curr : min);
                        bestKey = best.key;
                        bestVal = best.val;
                      }
                    }

                    return (
                      <TableRow key={`${record.date}-${record.hour}`}>
                        <TableCell className="whitespace-nowrap font-medium">{record.date}</TableCell>
                        <TableCell>{String(record.hour).padStart(2, '0')}:00</TableCell>
                        <TableCell>{record.actual?.toFixed(2) || 'N/A'}</TableCell>
                        <TableCell>{record.pred_1d?.toFixed(2) || 'N/A'}</TableCell>
                        <TableCell>{renderAccuracyBadge(record.diff_1d)}</TableCell>
                        <TableCell>{record.pred_2d?.toFixed(2) || 'N/A'}</TableCell>
                        <TableCell>{renderAccuracyBadge(record.diff_2d)}</TableCell>
                        <TableCell>{record.pred_3d?.toFixed(2) || 'N/A'}</TableCell>
                        <TableCell>{renderAccuracyBadge(record.diff_3d)}</TableCell>
                        <TableCell>
                          {bestKey ? (
                            <Badge variant="outline" className="bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 font-medium whitespace-nowrap">
                              {bestKey} ({(bestVal * 100).toFixed(0)}cm)
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} items
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="text-sm font-medium w-[60px] text-center">
                  {currentPage} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}