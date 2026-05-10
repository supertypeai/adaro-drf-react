"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { V3TableRecord } from "@/services/api";
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
} from 'chart.js';
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Trophy, Info } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import type { DateRange } from "react-day-picker";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  ChartTooltip,
  Legend
);

// Configure dayjs plugins
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(customParseFormat);

interface V3PerformanceChartProps {
  v3TableData: V3TableRecord[];
}

type ViewMode = 'latest_vs_actual' | 'historical_forecasts' | 'error_analysis';

export function V3PerformanceChart({ v3TableData }: V3PerformanceChartProps) {
  const availableDateRange = useMemo(() => {
    if (!v3TableData || v3TableData.length === 0) {
      return { minDate: dayjs().subtract(7, 'days'), maxDate: dayjs() };
    }
    const dates = v3TableData.map(item => dayjs(item.date)).filter(date => date.isValid());
    if (dates.length === 0) {
      return { minDate: dayjs().subtract(60, 'days'), maxDate: dayjs().add(10, 'days') };
    }
    let minDate = dates[0];
    let maxDate = dates[0];
    dates.forEach(date => {
      if (date.isBefore(minDate)) minDate = date;
      if (date.isAfter(maxDate)) maxDate = date;
    });
    return { minDate, maxDate };
  }, [v3TableData]);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const start = availableDateRange.minDate.isAfter(dayjs().subtract(7, 'days')) ?
      availableDateRange.minDate : dayjs().subtract(7, 'days');
    const end = availableDateRange.maxDate.isBefore(dayjs()) ?
      availableDateRange.maxDate : dayjs();
    return { from: start.toDate(), to: end.toDate() };
  });

  const [viewMode, setViewMode] = useState<ViewMode>('latest_vs_actual');
  const [showRainForecast, setShowRainForecast] = useState(true);
  const [rainForecastMode, setRainForecastMode] = useState('1d');

  useEffect(() => {
    const start = availableDateRange.minDate.isAfter(dayjs().subtract(7, 'days')) ?
      availableDateRange.minDate : dayjs().subtract(7, 'days');
    const end = availableDateRange.maxDate.isBefore(dayjs()) ?
      availableDateRange.maxDate : dayjs();
    setDateRange({ from: start.toDate(), to: end.toDate() });
  }, [availableDateRange]);

  const filteredTableData = useMemo(() => {
    if (!v3TableData || !dateRange?.from || !dateRange?.to) return [];
    
    const startDate = dayjs(dateRange.from);
    const endDate = dayjs(dateRange.to);
    
    return v3TableData.filter(item => {
      if (viewMode === 'latest_vs_actual') return true;
      const itemDate = dayjs(item.date);
      return itemDate.isAfter(startDate.subtract(1, 'day')) && itemDate.isBefore(endDate.add(1, 'day'));
    }).sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      return dateCompare !== 0 ? dateCompare : a.hour - b.hour;
    });
  }, [v3TableData, dateRange, viewMode]);

  const performanceStats = useMemo(() => {
    if (!filteredTableData.length) return null;
    const validData = filteredTableData.filter(item =>
      item.actual !== null && item.pred_1d !== null && item.pred_2d !== null && item.pred_3d !== null
    );
    if (!validData.length) return null;
    
    const calculateStats = (diffKey: keyof V3TableRecord) => {
      const diffs = validData.map(item => item[diffKey] as number).filter(d => d !== undefined && d !== null);
      if (!diffs.length) return { mae: "0", accuracy: "0", withinGreenZone: "0" };
      const mae = diffs.reduce((sum, diff) => sum + Math.abs(diff), 0) / diffs.length * 100; // in cm
      const accuracy = diffs.filter(diff => Math.abs(diff) <= 0.5).length / diffs.length * 100;
      const withinGreenZone = diffs.filter(diff => Math.abs(diff) * 100 <= 20).length / diffs.length * 100;
      return { mae: mae.toFixed(2), accuracy: accuracy.toFixed(1), withinGreenZone: withinGreenZone.toFixed(1) };
    };
    
    return {
      pred_1d: calculateStats('diff_1d'),
      pred_2d: calculateStats('diff_2d'),
      pred_3d: calculateStats('diff_3d'),
      totalMeasurements: validData.length,
    };
  }, [filteredTableData]);

  const chartData = useMemo(() => {
    if (!filteredTableData || filteredTableData.length === 0) {
      return { waterLevelChartData: null, rainChartData: null };
    }

    if (viewMode === 'latest_vs_actual') {
      const sortedData = [...filteredTableData];
      const actualRecords = sortedData.filter(item => item.actual !== null);
      const recentActual = actualRecords.slice(-72);
      if (recentActual.length === 0) return { waterLevelChartData: null, rainChartData: null };
      
      const actualData = recentActual.map(item => item.actual);
      const actualLabels = recentActual.map(item => `${item.date} ${String(item.hour).padStart(2, '0')}:00`);
      const lastActualItem = recentActual[recentActual.length - 1];
      const lastDate = dayjs(`${lastActualItem.date} ${String(lastActualItem.hour).padStart(2, '0')}:00`);
      
      const predictionData: (number | null)[] = [];
      const predictionLabels: string[] = [];
      
      for (let hour = 1; hour <= 72; hour++) {
        const futureTime = lastDate.add(hour, 'hour');
        predictionLabels.push(futureTime.format('YYYY-MM-DD HH:00'));
        const hourRecord = sortedData.find(record => dayjs(`${record.date} ${String(record.hour).padStart(2, '0')}:00`).isSame(futureTime));
        let predValue: number | null = null;
        if (hourRecord) {
          if (hour <= 24) predValue = hourRecord.pred_1d;
          else if (hour <= 48) predValue = hourRecord.pred_2d;
          else predValue = hourRecord.pred_3d;
        }
        predictionData.push(predValue ?? null);
      }
      
      const allLabels = [...actualLabels, ...predictionLabels];
      const finalData = {
        labels: allLabels,
        datasets: [
          { label: 'Actual Water Level', data: [...actualData, ...new Array(72).fill(null)], borderColor: '#ff4d4f', borderWidth: 2, tension: 0.3, pointRadius: 2 },
          { label: 'Forecast (1d→2d→3d ahead)', data: [...new Array(actualData.length).fill(null), ...predictionData], borderColor: '#52c41a', borderDash: [5, 3], borderWidth: 2, tension: 0.3, pointRadius: 2 },
        ],
      };

      let rainChartData: any = null;
      if (showRainForecast) {
        const actualRainData = recentActual.map(item => {
          return item.rain_actual || item.rainfall || item.rain || item.rain_observed || item.actual_rain || 0;
        });
        const predictionRainData: number[] = [];
        for (let hour = 1; hour <= 72; hour++) {
          const futureTime = lastDate.add(hour, 'hour');
          const hourRecord = sortedData.find(record =>
            dayjs(`${record.date} ${String(record.hour).padStart(2, '0')}:00`).isSame(futureTime)
          );
          let rainPredValue: number | null = null;
          if (hourRecord) {
            if (hour <= 24) rainPredValue = hourRecord.rain_forecast_1d ?? null;
            else if (hour <= 48) rainPredValue = hourRecord.rain_forecast_2d ?? null;
            else rainPredValue = hourRecord.rain_forecast_3d ?? null;
          }
          predictionRainData.push(rainPredValue || 0);
        }
        rainChartData = {
          labels: allLabels,
          datasets: [
            {
              label: 'Actual Rainfall (72h)',
              data: [...actualRainData, ...new Array(72).fill(null)],
              backgroundColor: 'rgba(64, 169, 255, 0.6)',
              type: 'bar' as const
            },
            {
              label: 'Rain Forecast (72h)',
              data: [...new Array(actualData.length).fill(null), ...predictionRainData],
              backgroundColor: 'rgba(135, 208, 104, 0.6)',
              type: 'bar' as const
            },
          ],
        };
      }
      return { waterLevelChartData: finalData, rainChartData };
    }

    if (viewMode === 'error_analysis') {
      const dateTimeLabels: string[] = [];
      const error1dData: number[] = [], error2dData: (number | null)[] = [], error3dData: (number | null)[] = [];
      
      filteredTableData.forEach(item => {
        if (item.actual !== null && item.diff_1d !== null) {
          dateTimeLabels.push(`${item.date} ${String(item.hour).padStart(2, '0')}:00`);
          error1dData.push(Math.abs(item.diff_1d) * 100);
          error2dData.push(item.diff_2d !== null ? Math.abs(item.diff_2d) * 100 : null);
          error3dData.push(item.diff_3d !== null ? Math.abs(item.diff_3d) * 100 : null);
        }
      });
      
      const finalData = {
        labels: dateTimeLabels,
        datasets: [
          { label: '1-Day Forecast Error', data: error1dData, backgroundColor: (ctx: any) => ctx.parsed?.y <= 20 ? 'rgba(115, 209, 61, 0.8)' : 'rgba(255, 120, 117, 0.8)', order: 1 },
          { label: '2-Day Forecast Error', data: error2dData, backgroundColor: (ctx: any) => ctx.parsed?.y <= 20 ? 'rgba(250, 173, 20, 0.8)' : 'rgba(255, 158, 158, 0.8)', order: 2 },
          { label: '3-Day Forecast Error', data: error3dData, backgroundColor: (ctx: any) => ctx.parsed?.y <= 20 ? 'rgba(135, 208, 104, 0.8)' : 'rgba(255, 189, 189, 0.8)', order: 3 },
          { label: 'Green Zone Threshold (≤20cm)', data: new Array(dateTimeLabels.length).fill(20), type: 'line' as const, borderColor: '#52c41a', borderWidth: 3, borderDash: [8, 4], pointRadius: 0, fill: 'origin', order: 0 },
        ],
      };
      return { waterLevelChartData: finalData, rainChartData: null };
    }

    if (viewMode === 'historical_forecasts') {
      const labels = filteredTableData.map(item => `${item.date} ${String(item.hour).padStart(2, '0')}:00`);
      const waterLevelChartData = {
        labels,
        datasets: [
          { label: 'Actual Water Level', data: filteredTableData.map(d => d.actual), borderColor: '#ffffff', borderWidth: 4, pointRadius: 2, tension: 0.3, order: 1 },
          { label: '1-Day Forecast', data: filteredTableData.map(d => d.pred_1d), borderColor: 'rgba(115, 209, 61, 0.8)', showLine: false, pointRadius: 2, order: 2 },
          { label: '2-Day Forecast', data: filteredTableData.map(d => d.pred_2d), borderColor: 'rgba(250, 173, 20, 0.8)', showLine: false, pointRadius: 2, order: 3 },
          { label: '3-Day Forecast', data: filteredTableData.map(d => d.pred_3d), borderColor: 'rgba(255, 120, 117, 0.8)', showLine: false, pointRadius: 2, order: 4 },
        ]
      };
      
      const rainDatasets: any[] = [];
      if (showRainForecast) {
        const rain1d = filteredTableData.map(d => d.rain_forecast_1d);
        const rain2d = filteredTableData.map(d => d.rain_forecast_2d);
        const rain3d = filteredTableData.map(d => d.rain_forecast_3d);
        const actualRain = filteredTableData.map(d => d.rain_actual || d.rainfall || d.rain || d.rain_observed || d.actual_rain || null);

        if (rainForecastMode === '1d') {
          rainDatasets.push({ label: '1-Day Rain Forecast', data: rain1d, type: 'bar' as const, backgroundColor: 'rgba(64, 169, 255, 0.5)' });
          rainDatasets.push({ label: 'Actual Rain', data: actualRain, type: 'bar' as const, backgroundColor: 'rgba(255, 77, 79, 0.7)' });
        }
        else if (rainForecastMode === '2d') {
          rainDatasets.push({ label: '2-Day Rain Forecast', data: rain2d, type: 'bar' as const, backgroundColor: 'rgba(135, 208, 104, 0.5)' });
          rainDatasets.push({ label: 'Actual Rain', data: actualRain, type: 'bar' as const, backgroundColor: 'rgba(255, 77, 79, 0.7)' });
        }
        else if (rainForecastMode === '3d') {
          rainDatasets.push({ label: '3-Day Rain Forecast', data: rain3d, type: 'bar' as const, backgroundColor: 'rgba(255, 195, 18, 0.5)' });
          rainDatasets.push({ label: 'Actual Rain', data: actualRain, type: 'bar' as const, backgroundColor: 'rgba(255, 77, 79, 0.7)' });
        }
        else if (rainForecastMode === 'all') {
          rainDatasets.push({ label: 'Actual Rain', data: actualRain, type: 'bar' as const, backgroundColor: 'rgba(255, 77, 79, 0.7)' });
          rainDatasets.push({ label: '1-Day Rain', data: rain1d, type: 'bar' as const, backgroundColor: 'rgba(64, 169, 255, 0.6)' });
          rainDatasets.push({ label: '2-Day Rain', data: rain2d, type: 'bar' as const, backgroundColor: 'rgba(135, 208, 104, 0.6)' });
          rainDatasets.push({ label: '3-Day Rain', data: rain3d, type: 'bar' as const, backgroundColor: 'rgba(255, 195, 18, 0.6)' });
        }
      }
      const rainChartData = { labels, datasets: rainDatasets };
      return { waterLevelChartData, rainChartData };
    }

    return { waterLevelChartData: null, rainChartData: null };
  }, [filteredTableData, viewMode, showRainForecast, rainForecastMode]);

  const getChartOptions = useCallback(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index' as const, intersect: false },
      plugins: {
        legend: { position: 'top' as const, labels: { color: '#888', usePointStyle: true, padding: 20 } },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.85)',
          callbacks: {
            title: (ctx: any) => dayjs(ctx[0].label).format('MMM DD, YYYY HH:mm'),
            label: (ctx: any) => {
              const label = ctx.dataset.label || '';
              const value = ctx.parsed.y;
              if (value === null || value === undefined) return undefined;
              const unit = viewMode === 'error_analysis' ? 'cm' : 'm';
              return `${label}: ${value.toFixed(2)} ${unit}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#888',
            maxTicksLimit: 8,
            callback: function (this: any, value: any, index: number) {
              const label = this.getLabelForValue(value);
              if (viewMode === 'latest_vs_actual') {
                if (index % 12 === 0) return dayjs(label).format('MMM DD HH:mm');
                return '';
              }
              if (index % 6 === 0) return dayjs(label).format('MMM DD HH:mm');
              return '';
            }
          },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        y: {
          title: { display: true, text: viewMode === 'error_analysis' ? 'Absolute Prediction Error (cm)' : 'Water Level (m)', color: '#888' },
          ticks: { color: '#888' },
          grid: { color: 'rgba(255,255,255,0.05)' },
          beginAtZero: viewMode === 'error_analysis',
        }
      }
    };
  }, [viewMode]);

  const getHistoricalRainOptions = useCallback(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index' as const, intersect: false },
      plugins: {
        legend: { position: 'top' as const, labels: { color: '#888', usePointStyle: true } },
        tooltip: {
          callbacks: {
            label: (ctx: any) => {
              const value = ctx.parsed.y;
              if (value === null || value === undefined) return undefined;
              return `${ctx.dataset.label}: ${value.toFixed(2)} mm`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#888',
            maxTicksLimit: 8,
            callback: function (this: any, value: any, index: number) {
              const label = this.getLabelForValue(value);
              if (index % 6 === 0) return dayjs(label).format('MMM DD HH:mm');
              return '';
            }
          },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        y: {
          title: { display: true, text: 'Rainfall (mm)', color: '#888' },
          ticks: { color: '#888' },
          grid: { color: 'rgba(255,255,255,0.05)' },
          beginAtZero: true,
        }
      }
    };
  }, []);

  const getChartTitle = () => {
    switch (viewMode) {
      case 'latest_vs_actual': return 'Continuous Forecast Timeline';
      case 'historical_forecasts': return 'Historical Forecast Analysis';
      case 'error_analysis': return 'Forecast Error Analysis';
      default: return 'Water Level Analysis';
    }
  };

  const getChartDescription = () => {
    switch (viewMode) {
      case 'latest_vs_actual': return 'Real-time forecast showing the last 72 hours of actual measurements connected to the next 72 hours of dynamic predictions.';
      case 'historical_forecasts': return 'Historical comparison of all forecast horizons (1-day, 2-day, 3-day predictions) against actual water levels.';
      case 'error_analysis': return 'Analyze prediction errors in centimeters. Lower values indicate better forecast accuracy.';
      default: return 'Comprehensive water level analysis and forecasting system.';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5 text-blue-500" />
                {getChartTitle()}
                <TooltipProvider delay={300}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Advanced forecast performance analysis with multiple viewing modes</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                {getChartDescription()}
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <DatePickerWithRange 
                date={dateRange}
                setDate={setDateRange}
                className="w-full sm:w-[260px]"
              />

              <div className="flex rounded-md border border-input shadow-sm">
                {(['latest_vs_actual', 'historical_forecasts', 'error_analysis'] as ViewMode[]).map((mode) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none first:rounded-l-md last:rounded-r-md h-9 text-xs flex-1 sm:flex-none"
                    onClick={() => setViewMode(mode)}
                  >
                    {mode === 'latest_vs_actual' ? 'Latest vs Actual' : mode === 'historical_forecasts' ? 'Historical' : 'Error Analysis'}
                  </Button>
                ))}
              </div>

              {(viewMode === 'historical_forecasts' || viewMode === 'latest_vs_actual') && (
                <Button 
                  variant={showRainForecast ? "default" : "outline"} 
                  size="sm" 
                  className="h-9 w-full sm:w-auto mt-2 sm:mt-0"
                  onClick={() => setShowRainForecast(!showRainForecast)}
                >
                  <span className="mr-2">🌧️</span> Rain
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {performanceStats && (
            <div className="rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 p-4 mb-6 shadow-md">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center text-white border-r border-white/20 last:border-0 md:last:border-r-0">
                  <div className="text-2xl sm:text-3xl font-bold">{performanceStats.totalMeasurements}</div>
                  <div className="text-xs sm:text-sm font-medium opacity-85 mt-1">Total Measurements</div>
                  <div className="text-[10px] opacity-70">Complete comparisons</div>
                </div>
                
                {([
                  { key: 'pred_1d', label: '1-Day Error', color: '#52c41a' },
                  { key: 'pred_2d', label: '2-Day Error', color: '#faad14' },
                  { key: 'pred_3d', label: '3-Day Error', color: '#ff7875' }
                ] as const).map(({ key, label, color }) => (
                  <div key={key} className="text-center text-white border-r border-white/20 last:border-0">
                    <div className="flex items-center justify-center gap-1.5 mb-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color, boxShadow: '0 0 4px rgba(255,255,255,0.5)' }} />
                      <span className="text-xs font-semibold">{label}</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold tracking-tight">
                      {performanceStats[key]?.mae || '0'} cm
                    </div>
                    <div className="text-[10px] sm:text-xs mt-1 bg-white/10 mx-auto px-2 py-0.5 rounded-full w-fit">
                      {performanceStats[key]?.withinGreenZone || '0'}% green zone
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="h-[400px] w-full">
            {chartData.waterLevelChartData && chartData.waterLevelChartData.labels?.length > 0 ? (
              viewMode === 'error_analysis' ? (
                <Bar data={chartData.waterLevelChartData as any} options={getChartOptions() as any} />
              ) : (
                <Line data={chartData.waterLevelChartData as any} options={getChartOptions() as any} />
              )
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground border border-dashed rounded-lg bg-muted/30">
                <div className="text-center">
                  <p>No valid data for selected period.</p>
                  <p className="text-xs mt-1">Try adjusting the date range or selecting a different view mode.</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showRainForecast && chartData.rainChartData && (chartData.rainChartData as any).datasets && (chartData.rainChartData as any).datasets.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-xl">🌧️</span> Rainfall Context
              </CardTitle>
              {viewMode === 'historical_forecasts' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground mr-1">Forecast Mode:</span>
                  <div className="flex rounded-md border border-input text-xs">
                     {['1d', '2d', '3d', 'all'].map(mode => (
                       <Button
                         key={mode}
                         variant={rainForecastMode === mode ? "default" : "ghost"}
                         size="sm"
                         className="h-7 px-2.5 rounded-none first:rounded-l-md last:rounded-r-md text-xs"
                         onClick={() => setRainForecastMode(mode)}
                       >
                         {mode.toUpperCase()}
                       </Button>
                     ))}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <Bar data={chartData.rainChartData as any} options={getHistoricalRainOptions() as any} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
