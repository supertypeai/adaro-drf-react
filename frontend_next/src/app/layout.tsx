import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/app-shell";
import { LocationProvider } from "@/providers/location-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Adaro Data Warehouse",
  description: "Adaro water level monitoring dashboard with real-time data and AI-powered forecasting",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} dark h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased" suppressHydrationWarning>
        <Providers>
          <TooltipProvider>
            <LocationProvider>
              <AppShell>{children}</AppShell>
            </LocationProvider>
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
