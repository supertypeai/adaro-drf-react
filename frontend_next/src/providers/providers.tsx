"use client";

import { AuthProvider } from "./auth-provider";
import { LocationProvider } from "./location-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LocationProvider>{children}</LocationProvider>
    </AuthProvider>
  );
}
