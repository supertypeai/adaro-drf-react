"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function GoogleDataStudioPage() {
  const { authTokens, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !authTokens) {
      router.replace("/login");
    }
  }, [isLoading, authTokens, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!authTokens) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6 max-w-[1600px] mx-auto w-full">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Google Data Studio</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <iframe
              title="DataStudio"
              width="600"
              height="1322"
              src="https://lookerstudio.google.com/embed/reporting/dda1149a-50df-4dc2-af77-214bc4075823/page/p_00acbtzk9c"
              frameBorder="0"
              style={{ border: 0, minWidth: "100%" }}
              allowFullScreen
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
