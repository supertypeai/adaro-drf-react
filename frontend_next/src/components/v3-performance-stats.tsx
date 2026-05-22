"use client";

import { useMemo } from "react";
import dayjs from "dayjs";
import { type EnrichedRecord, toOptionalNumber } from "@/lib/v3-preprocessor";
import { type JoloiChartRecord } from "./v3-joloi-chart-display";
import { Highlight } from "@/components/ui/typography";
import { Activity, Waves, CloudRain, ChevronDown } from "lucide-react";

interface V3PerformanceStatsProps {
  records: EnrichedRecord[];
  joloiRecords: JoloiChartRecord[];
}

export function V3PerformanceStats({ records, joloiRecords }: V3PerformanceStatsProps) {
  const stats = useMemo(() => {
    if (!records || records.length === 0) return null;

    // We get the latest data point from records that has an actual value
    const validRecords = records.filter(r => toOptionalNumber(r.actual) !== undefined);
    if (validRecords.length === 0) return null;

    // Sort by ts
    validRecords.sort((a, b) => a.ts.valueOf() - b.ts.valueOf());
    const latest = validRecords[validRecords.length - 1];
    const latestActual = toOptionalNumber(latest.actual)!;

    // 1-month baseline average for actual_rain
    const oneMonthAgo = latest.ts.subtract(1, "month");
    const pastMonthRecords = records.filter(r =>
      r.ts.isAfter(oneMonthAgo) && r.ts.isBefore(latest.ts.add(1, 'minute'))
    );
    const pastMonthRain = pastMonthRecords
      .map(r => toOptionalNumber(r.actual_rain))
      .filter((r): r is number => r !== undefined);

    const oneMonthAvgRain = pastMonthRain.length > 0
      ? pastMonthRain.reduce((a, b) => a + b, 0) / pastMonthRain.length
      : null;

    // Helper to get past value
    const getPastRecord = (days: number) => {
      const targetTime = latest.ts.subtract(days, "day");
      let closest = validRecords[0];
      let minDiff = Math.abs(validRecords[0].ts.diff(targetTime));
      for (const r of validRecords) {
        const diff = Math.abs(r.ts.diff(targetTime));
        if (diff < minDiff) {
          minDiff = diff;
          closest = r;
        }
      }
      return closest;
    };

    const getPastJoloiRecord = (targetTime: dayjs.Dayjs) => {
      if (!joloiRecords || joloiRecords.length === 0) return null;
      const validJoloi = joloiRecords.filter(r => toOptionalNumber(r.actual) !== undefined);
      if (validJoloi.length === 0) return null;

      let closest = validJoloi[0];
      let minDiff = Math.abs(validJoloi[0].ts.diff(targetTime));
      for (const r of validJoloi) {
        const diff = Math.abs(r.ts.diff(targetTime));
        if (diff < minDiff) {
          minDiff = diff;
          closest = r;
        }
      }
      return closest;
    };

    const latestJoloiRecord = getPastJoloiRecord(latest.ts);
    const latestJoloiActual = latestJoloiRecord ? toOptionalNumber(latestJoloiRecord.actual) : null;

    const generateSummary = (days: number, label: string) => {
      const pastRecord = getPastRecord(days);
      const pastJoloiRecord = getPastJoloiRecord(latest.ts.subtract(days, "day"));

      const tuhupChange = latestActual - toOptionalNumber(pastRecord.actual)!;
      let tuhupTrendStr = "stable";
      if (Math.abs(tuhupChange) > 0.05) {
        tuhupTrendStr = tuhupChange > 0 ? "increasing" : "decreasing";
      }

      // Calculate Rate (cm/hour)
      const hoursDiff = latest.ts.diff(pastRecord.ts, "hour");
      const changeRate = hoursDiff > 0 ? (Math.abs(tuhupChange) / hoursDiff * 100).toFixed(1) : "0.0";

      let joloiSummaryText = "Joloi data is not available.";
      let hasJoloiHighlight = false;
      if (latestJoloiActual !== null && latestJoloiActual !== undefined && pastJoloiRecord && toOptionalNumber(pastJoloiRecord.actual) !== undefined) {
        const joloiChange = latestJoloiActual - toOptionalNumber(pastJoloiRecord.actual)!;
        let joloiTrend = "stable";
        if (Math.abs(joloiChange) > 0.05) {
          joloiTrend = joloiChange > 0 ? "increasing" : "decreasing";
        }

        const followsJoloi = (tuhupTrendStr === joloiTrend && tuhupTrendStr !== "stable") || (Math.abs(tuhupChange) <= 0.05 && Math.abs(joloiChange) <= 0.05);

        if (followsJoloi) {
          joloiSummaryText = `This follows Joloi's ${joloiTrend} trend.`;
        } else {
          joloiSummaryText = `This diverges from Joloi, which is ${joloiTrend}. `;
          hasJoloiHighlight = true;
        }
      }

      const joloiSummary = (
        <span className="flex-1 block">
          {joloiSummaryText}
          {hasJoloiHighlight && (
            <Highlight>Muara Tuhup is expected to follow Joloi's trend soon.</Highlight>
          )}
        </span>
      );

      // Rain and Average Actual for this period
      const periodRecords = records.filter(r => r.ts.isAfter(latest.ts.subtract(days, "day")) && r.ts.isBefore(latest.ts.add(1, 'minute')));
      const periodRain = periodRecords.map(r => toOptionalNumber(r.actual_rain)).filter((r): r is number => r !== undefined);
      const periodAvgRain = periodRain.length > 0 ? periodRain.reduce((a, b) => a + b, 0) / periodRain.length : null;

      const periodActuals = periodRecords.map(r => toOptionalNumber(r.actual)).filter((r): r is number => r !== undefined);
      const periodAvgActual = periodActuals.length > 0 ? periodActuals.reduce((a, b) => a + b, 0) / periodActuals.length : null;

      const startActualRaw = toOptionalNumber(pastRecord.actual)!;
      const startActual = startActualRaw.toFixed(2);
      const endActual = latestActual.toFixed(2);
      const startTime = pastRecord.ts.format("MMM DD, HH:mm");
      const endTime = latest.ts.format("MMM DD, HH:mm");
      const periodLabel = days === 1 ? "1-day" : days === 3 ? "3-day" : "1-week";

      const calcPeriodError = (key: "diff_1d" | "diff_2d" | "diff_3d") => {
        const errors = periodRecords.map(r => toOptionalNumber(r[key])).filter((r): r is number => r !== undefined);
        return errors.length > 0 ? (errors.reduce((a, b) => a + Math.abs(b), 0) / errors.length).toFixed(2) + "m" : "N/A";
      };

      const avgError1d = calcPeriodError("diff_1d");
      const avgError2d = calcPeriodError("diff_2d");
      const avgError3d = calcPeriodError("diff_3d");

      const peakCount = periodRecords.filter(r => r.is_peak).length;
      const peakSummary = peakCount > 0 ? (
        <>Fluctuates with <Highlight>{peakCount} peak(s)</Highlight> detected.</>
      ) : (
        <>Stable with <Highlight>0 peaks</Highlight> detected.</>
      );

      let rainSummary = "Rainfall data unavailable.";
      if (periodAvgRain !== null && oneMonthAvgRain !== null) {
        if (periodAvgRain > oneMonthAvgRain * 1.1) {
          rainSummary = "Rainfall has been above the 1-month average.";
        } else if (periodAvgRain < oneMonthAvgRain * 0.9) {
          rainSummary = "Rainfall has been below the 1-month average.";
        } else {
          rainSummary = "Rainfall has been around the 1-month average.";
        }
      }

      // Loadable structured blocks
      const loadableHours = periodActuals.filter(v => v >= 19.6 && v <= 28.0).length;
      const nonLoadableHours = periodActuals.filter(v => v < 19.6 || v > 28.0).length;

      const blocks: { start: string; end: string; startVal: string; endVal: string; loadable: boolean }[] = [];
      if (periodRecords.length > 0) {
        const safeRecords = periodRecords.filter(r => toOptionalNumber(r.actual) !== undefined);
        if (safeRecords.length > 0) {
          let currentStatus = (toOptionalNumber(safeRecords[0].actual) ?? 0) >= 19.6 && (toOptionalNumber(safeRecords[0].actual) ?? 0) <= 28.0;
          let startTs = safeRecords[0].ts;
          let startVal = toOptionalNumber(safeRecords[0].actual) ?? 0;

          for (let i = 1; i < safeRecords.length; i++) {
            const val = toOptionalNumber(safeRecords[i].actual)!;
            const isLoadable = val >= 19.6 && val <= 28.0;
            if (isLoadable !== currentStatus) {
              const endTs = safeRecords[i - 1].ts;
              const endVal = toOptionalNumber(safeRecords[i - 1].actual)!;
              blocks.push({
                start: startTs.format("MMM DD, HH:mm"),
                end: endTs.format("MMM DD, HH:mm"),
                startVal: startVal.toFixed(2),
                endVal: endVal.toFixed(2),
                loadable: currentStatus
              });
              currentStatus = isLoadable;
              startTs = safeRecords[i].ts;
              startVal = val;
            }
          }
          const endTs = safeRecords[safeRecords.length - 1].ts;
          const endVal = toOptionalNumber(safeRecords[safeRecords.length - 1].actual)!;
          blocks.push({
            start: startTs.format("MMM DD, HH:mm"),
            end: endTs.format("MMM DD, HH:mm"),
            startVal: startVal.toFixed(2),
            endVal: endVal.toFixed(2),
            loadable: currentStatus
          });
        }
      }

      return {
        label: label.replace(" Day", "-Day").replace(" Week", "-Week"),
        tuhupTrendStr,
        tuhupChange,
        changeRate,
        startActual,
        startTime,
        endActual,
        endTime,
        periodLabel,
        avgError1d,
        avgError2d,
        avgError3d,
        peakSummary,
        joloiSummary,
        rainSummary,
        avgActual: periodAvgActual !== null ? periodAvgActual.toFixed(2) : "N/A",
        loadableHours,
        nonLoadableHours,
        blocks
      };
    };

    return {
      latest: {
        value: latestActual.toFixed(2),
        time: latest.ts.format("MMM DD, YYYY HH:mm"),
        isLoadable: latestActual >= 19.6 && latestActual <= 28.0
      },
      cards: [
        generateSummary(1, "1 Day Summary"),
        generateSummary(3, "3 Days Summary"),
        generateSummary(7, "1 Week Summary")
      ]
    };
  }, [records, joloiRecords]);

  const historicalStats = useMemo(() => {
    if (!records) return null;
    const validData = records.filter(
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
  }, [records]);

  if (!stats) return null;

  return (
    <div className="mt-8 space-y-5">
      {/* ── Top Bar ── */}
      {/* <div className="flex items-center justify-between gap-4 px-1">
        <div className="flex items-baseline gap-3">
          <span className="text-[13px] text-[#94A3B8] tracking-wide">
            Latest measurement
          </span>
          <span className="text-white text-xl font-semibold tabular-nums tracking-tight">
            {stats.latest.value}<span className="text-[#94A3B8] text-sm ml-0.5">m</span>
          </span>
          <span className="text-[12px] text-[#94A3B8]/70">
            {stats.latest.time}
          </span>
        </div>
        <span className={`text-[11px] font-medium tracking-widest uppercase ${stats.latest.isLoadable ? "text-emerald-400" : "text-rose-400"}`}>
          {stats.latest.isLoadable ? "● Loadable" : "● Non-loadable"}
        </span>
      </div> */}

      {/* ── Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.cards.map((s, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#222530] bg-card overflow-hidden"
          >
            {/* ═══ ZONE 1: Hero Metric ═══ */}
            <div className="px-5 pt-5 pb-4">
              <span className="text-[10px] p-3 w-fit rounded-xl text-white/90 font-semibold uppercase tracking-[0.2em] block mb-10 border-l-2 border-b-1 border-teal-700"
                style={{ backgroundColor: "#1A1B22" }}
              >
                {s.label}
              </span>

              {/* From → To */}
              <div className="flex items-end gap-3 mb-3">
                <div className="flex flex-col">
                  <span className="text-white/80 text-[20px] font-semibold tabular-nums leading-none">
                    {s.startActual}<span className="text-[#94A3B8]/40 text-xs ml-0.5">m</span>
                  </span>
                  <span className="text-[10px] text-[#94A3B8]/50 mt-1 tabular-nums">{s.startTime}</span>
                </div>

                <svg width="28" height="12" viewBox="0 0 28 12" fill="none" className="mb-2.5 shrink-0 opacity-30">
                  <line x1="0" y1="6" x2="22" y2="6" stroke="#94A3B8" strokeWidth="1.5" />
                  <polyline points="20,2 26,6 20,10" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                </svg>

                <div className="flex flex-col">
                  <span className="text-white/50 text-[20px] font-semibold tabular-nums leading-none">
                    {s.endActual}<span className="text-[#94A3B8]/50 text-sm ml-0.5">m</span>
                  </span>
                  <span className="text-[10px] text-[#94A3B8]/50 mt-1 tabular-nums">{s.endTime}</span>
                </div>
              </div>

              {/* Trend & Average */}
              <p className="text-[12.5px] text-[#94A3B8] leading-relaxed">
                <span className={s.tuhupTrendStr === "increasing" ? "text-emerald-400" : s.tuhupTrendStr === "decreasing" ? "text-rose-400" : "text-[#94A3B8]"}>
                  {s.tuhupTrendStr === "increasing" ? "▲" : s.tuhupTrendStr === "decreasing" ? "▼" : "—"}
                </span>
                Tuhup is
                {" "}
                {s.tuhupTrendStr === "stable" ? (
                  "Stable"
                ) : (
                  <>
                    {s.tuhupTrendStr.charAt(0).toUpperCase() + s.tuhupTrendStr.slice(1)} at{" "}
                    <Highlight>{s.changeRate}</Highlight> cm/hr
                  </>
                )}
                <span className="text-[#94A3B8]/40 mx-1.5">·</span>
                {s.periodLabel} avg: <span className="text-white/80 font-medium">{s.avgActual}m</span>
              </p>
            </div>

            <div className="h-px" style={{ backgroundColor: "#222530" }} />

            {/* ═══ ZONE 2: Loadability ═══ */}
            <div className="mx-4 my-4 rounded-lg border border-[#222530]" style={{ backgroundColor: "#1A1B22" }}>
              <details open className="group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]/50">
                      Loadability Status
                    </span>
                    <div className="flex items-center gap-3 text-[12px] tabular-nums">
                      <span className="text-emerald-400/80 font-medium">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400/60 mr-1.5 align-middle" />
                        {s.loadableHours}h Loadable
                      </span>
                      <span className="text-[#94A3B8]/20">│</span>
                      <span className="text-rose-400/80 font-medium">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400/60 mr-1.5 align-middle" />
                        {s.nonLoadableHours}h Unloadable
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8]/30 transition duration-300 group-open:-rotate-180 shrink-0" />
                </summary>

                <div className="border-t border-[#222530] max-h-40 overflow-y-auto px-4 py-2.5" style={{ backgroundColor: "#15161C" }}>
                  <table className="w-full text-[10.5px] tabular-nums text-[#94A3B8]/70">
                    <tbody>
                      {s.blocks.map((b, idx) => (
                        <tr key={idx} className="leading-6">
                          <td className="pr-2 whitespace-nowrap font-mono">{b.start} — {b.end}</td>
                          <td className="px-2 whitespace-nowrap text-[#94A3B8]/40">│</td>
                          {/* <td className="px-2 whitespace-nowrap font-mono">{b.startVal}m – {b.endVal}m</td>
                          <td className="px-2 whitespace-nowrap text-[#94A3B8]/40">│</td> */}
                          <td className={`pl-2 whitespace-nowrap font-medium ${b.loadable ? "text-emerald-400/70" : "text-rose-400/70"}`}>
                            {b.loadable ? "Loadable" : "Unloadable"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>

            <div className="h-px" style={{ backgroundColor: "#222530" }} />

            {/* ═══ ZONE 3: Errors & Insights ═══ */}
            <div className="px-5 pt-4 pb-5">
              {/* Error row */}
              <div className="flex items-center justify-between text-[11px] text-[#94A3B8]/60 tabular-nums mb-4">
                <span>1D Error: <span className="text-[#94A3B8] font-medium">{s.avgError1d}</span></span>
                <span className="text-[#94A3B8]/20">•</span>
                <span>2D Error: <span className="text-[#94A3B8] font-medium">{s.avgError2d}</span></span>
                <span className="text-[#94A3B8]/20">•</span>
                <span>3D Error: <span className="text-[#94A3B8] font-medium">{s.avgError3d}</span></span>
              </div>

              <div className="h-px mb-3.5" style={{ backgroundColor: "#222530" }} />

              {/* Insights */}
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]/50 block mb-3">
                Insights
              </span>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-[12.5px] text-[#94A3B8] leading-relaxed">
                  <Activity className="w-[14px] h-[14px] shrink-0 mt-[3px] opacity-40" strokeWidth={1.5} />
                  <span>
                    {s.peakSummary}
                  </span>
                </div>
                <div className="flex items-start gap-3 text-[12.5px] text-[#94A3B8] leading-relaxed">
                  <Waves className="w-[14px] h-[14px] shrink-0 mt-[3px] opacity-40" strokeWidth={1.5} />
                  {s.joloiSummary}
                </div>
                <div className="flex items-start gap-3 text-[12.5px] text-[#94A3B8] leading-relaxed">
                  <CloudRain className="w-[14px] h-[14px] shrink-0 mt-[3px] opacity-40" strokeWidth={1.5} />
                  <span>{s.rainSummary}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Historical MAE ── */}
      {/* {historicalStats && (
        <div className="rounded-xl border border-[#222530] px-5 py-4" style={{ backgroundColor: "#16171D" }}>
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#94A3B8]/50 block mb-3">
            Historical Forecast Accuracy (MAE) · N={historicalStats.totalMeasurements}
          </span>
          <div className="flex items-center gap-6 text-[12px] tabular-nums text-[#94A3B8]">
            {historicalStats.pred_1d && (
              <span>1D: <span className="text-white/80 font-medium">{historicalStats.pred_1d.mae}%</span> <span className="text-[#94A3B8]/40 text-[11px]">(Green: {historicalStats.pred_1d.withinGreenZone}%)</span></span>
            )}
            {historicalStats.pred_2d && (
              <span>2D: <span className="text-white/80 font-medium">{historicalStats.pred_2d.mae}%</span> <span className="text-[#94A3B8]/40 text-[11px]">(Green: {historicalStats.pred_2d.withinGreenZone}%)</span></span>
            )}
            {historicalStats.pred_3d && (
              <span>3D: <span className="text-white/80 font-medium">{historicalStats.pred_3d.mae}%</span> <span className="text-[#94A3B8]/40 text-[11px]">(Green: {historicalStats.pred_3d.withinGreenZone}%)</span></span>
            )}
          </div>
        </div>
      )} */}
    </div>
  );
}

