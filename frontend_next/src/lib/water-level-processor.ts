import dayjs from "dayjs";
import { type JoloiChartRecord } from "@/components/v3-joloi-chart-display";
import { type DataRecord } from "@/services/api";

export function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function processJoloiData(data: DataRecord[]): JoloiChartRecord[] {
  if (!data || data.length === 0) return [];

  return data
    .map((row) => {
      const hour = toOptionalNumber(row.hour) ?? 0;
      const actual = toOptionalNumber(row.measurement);

      const ts = dayjs(`${row.date}T${String(Math.trunc(hour)).padStart(2, "0")}:00:00`);

      if (!ts.isValid()) return null;

      return {
        ts,
        label: ts,
        actual: actual ?? null,
        is_peak: row.is_peak,
      } as JoloiChartRecord;
    })
    .filter((row): row is JoloiChartRecord => row !== null)
    .sort((a, b) => a.ts.valueOf() - b.ts.valueOf());
}
