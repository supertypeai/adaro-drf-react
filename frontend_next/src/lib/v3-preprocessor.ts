import dayjs, { type Dayjs } from "dayjs";
import { type V3TableRecord } from "@/services/api";

export type EnrichedRecord = V3TableRecord & {
  ts: Dayjs;
  label: Dayjs;
};

export interface PreprocessedV3Data {
  records: EnrichedRecord[];
  minDate: Dayjs;
  maxDate: Dayjs;
}

export function toOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function preprocessV3Data(
  data: V3TableRecord[],
  backendMinDate?: string,
  backendMaxDate?: string
): PreprocessedV3Data {
  const now = dayjs();
  
  // Use backend dates if available, otherwise fallback to reasonable defaults
  const parsedMin = backendMinDate ? dayjs(backendMinDate) : now.subtract(7, "day");
  const parsedMax = backendMaxDate ? dayjs(backendMaxDate) : now;

  if (!data || data.length === 0) {
    return {
      records: [],
      minDate: parsedMin,
      maxDate: parsedMax,
    };
  }

  const records: EnrichedRecord[] = [];

  for (const row of data) {
    const hour = toOptionalNumber(row.hour) ?? 0;
    const parsedTs = dayjs(
      `${row.date} ${String(Math.trunc(hour)).padStart(2, "0")}:00`,
      "YYYY-MM-DD HH:mm",
      true
    );

    if (!parsedTs.isValid()) continue;

    records.push({
      ...row,
      ts: parsedTs,
      label: parsedTs,
    });
  }

  // Sort by timestamp
  const sortedRecords = records.sort((a, b) => a.ts.valueOf() - b.ts.valueOf());

  return {
    records: sortedRecords,
    minDate: backendMinDate ? dayjs(backendMinDate) : (sortedRecords[0]?.ts ?? parsedMin),
    maxDate: backendMaxDate ? dayjs(backendMaxDate) : (sortedRecords[sortedRecords.length - 1]?.ts ?? parsedMax),
  };
}
