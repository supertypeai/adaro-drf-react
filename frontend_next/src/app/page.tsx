"use client";

import { useLocations } from "@/providers/location-provider";
import { DashboardContent } from "@/components/dashboard-content";

export default function HomePage() {
  const { locations } = useLocations();

  return (
    <main className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      <DashboardContent locations={locations} />
    </main>
  );
}
