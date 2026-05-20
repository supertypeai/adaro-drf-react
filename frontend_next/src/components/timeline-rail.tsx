interface TimelineRailProps {
  isFirst?: boolean;
  isLast?: boolean;
  markerTop?: string;
}

export function TimelineRail({ 
  isFirst = false, 
  isLast = false, 
  markerTop = "2.25rem" 
}: TimelineRailProps) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {!isFirst && (
        <span
          className="absolute left-1/2 w-0.5 -translate-x-1/2 bg-gradient-to-b from-blue-500/20 to-blue-500/80"
          style={{
            top: 0,
            bottom: `calc(100% - ${markerTop})`,
          }}
        />
      )}
      {!isLast && (
        <span
          className="absolute left-1/2 w-0.5 -translate-x-1/2 bg-gradient-to-b from-blue-500/80 to-blue-500/20"
          style={{
            top: markerTop,
            bottom: 0,
          }}
        />
      )}
      <span
        className="absolute left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full border border-blue-400/70 bg-background shadow-[0_0_0_3px_hsl(221_83%_53%_/_0.15)]"
        style={{ top: `calc(${markerTop} - 0.5rem)` }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
      </span>
    </div>
  );
}
