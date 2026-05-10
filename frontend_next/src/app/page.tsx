"use client";

import { useAuth } from "@/providers/auth-provider";
import { useLocations } from "@/providers/location-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashboardContent } from "@/components/dashboard-content";
import { AppHeader } from "@/components/app-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { authTokens, isLoading: authLoading } = useAuth();
  const { locations, isLoading: locsLoading } = useLocations();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !authTokens) {
      router.replace("/login");
    }
  }, [authLoading, authTokens, router]);

  if (authLoading || locsLoading) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!authTokens) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        <DashboardContent locations={locations} />
      </main>
    </div>
  );
}
