"use client";

import { useState, useRef, useEffect } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, AlertCircle } from "lucide-react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<DateRange | undefined>(value);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync pending when parent value resets (e.g. data loads)
  useEffect(() => {
    setPending(value);
    setError(null);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setError(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleSelect = (range: DateRange | undefined) => {
    setError(null);

    // react-day-picker resets to { from: newDate } when user clicks a new start;
    // keep that pending so the user can now pick an end date.
    if (!range?.from || !range?.to) {
      setPending(range);
      return;
    }

    // Both dates selected — validate
    const from = dayjs(range.from).startOf("day");
    const to = dayjs(range.to).startOf("day");

    if (!from.isBefore(to) && !from.isSame(to)) {
      setError("Date range is not valid: start date must be before end date.");
      setPending({ from: range.from, to: undefined });
      return;
    }

    // Valid range — commit and close
    setPending(range);
    onChange(range);
    setOpen(false);
  };

  const label = value?.from
    ? value.to
      ? `${dayjs(value.from).format("MMM D, YYYY")} → ${dayjs(value.to).format("MMM D, YYYY")}`
      : dayjs(value.from).format("MMM D, YYYY")
    : "Select date range";

  // Hint shown at the bottom of the calendar
  const hint = error ? null : pending?.from && !pending?.to
    ? "Now click an end date"
    : "Pick a start date";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs font-normal"
        onClick={() => { setOpen((o) => !o); setError(null); }}
        type="button"
      >
        <CalendarIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
        <span className={cn(!value?.from && "text-muted-foreground")}>{label}</span>
      </Button>

      {open && (
        <div
          className={cn(
            "absolute left-0 z-50 mt-1 rounded-lg border border-border bg-popover shadow-xl",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
          )}
        >
          <Calendar
            mode="range"
            selected={pending}
            onSelect={handleSelect}
            numberOfMonths={2}
            initialFocus
          />
          <div className="flex flex-col gap-1 border-t border-border px-3 py-2">
            {error ? (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">{hint}</span>
            )}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setPending(undefined);
                  setError(null);
                  onChange(undefined);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
