"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useLocations } from "@/providers/location-provider";
import { titleToSlug } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  BarChart3Icon,
  LayoutDashboardIcon,
  LogOutIcon,
  MapPinIcon,
  UserIcon,
} from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const { authTokens, user, logout, isLoading: authLoading } = useAuth();
  const { locations, isLoading: locsLoading } = useLocations();
  const router = useRouter();

  useEffect(() => {
    if (!isLoginPage && !authLoading && !authTokens) {
      router.replace("/login");
    }
  }, [isLoginPage, authLoading, authTokens, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (authLoading || locsLoading) {
    return (
      <div className="flex flex-col gap-4 p-8">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!authTokens) {
    return null;
  }

  const activeLocation = locations.find(
    (loc) => pathname === `/${titleToSlug(loc.title)}`
  );

  const pageTitle =
    pathname === "/"
      ? "Dashboard"
      : pathname === "/google-data-studio"
        ? "Google Data Studio"
        : activeLocation?.title || "Dashboard";

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "12rem",
          "--header-height": "3.5rem",
        } as React.CSSProperties
      }
    >
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip="Dashboard"
                render={<Link href="/" />}
              >
                <Image
                  src="/adaro-logo.png"
                  alt="Adaro"
                  width={88}
                  height={24}
                  className="h-6 w-auto"
                />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Dashboard"
                    isActive={pathname === "/"}
                    render={<Link href="/" />}
                  >
                    <LayoutDashboardIcon />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Google Data Studio"
                    isActive={pathname === "/google-data-studio"}
                    render={<Link href="/google-data-studio" />}
                  >
                    <BarChart3Icon />
                    <span>Google Data Studio</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Locations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {locations.map((loc) => {
                  const locPath = `/${titleToSlug(loc.title)}`;

                  return (
                    <SidebarMenuItem key={loc.id}>
                      <SidebarMenuButton
                        tooltip={loc.title}
                        isActive={pathname === locPath}
                        render={<Link href={locPath} />}
                      >
                        <MapPinIcon />
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            loc.sensor ? "bg-red-500" : "bg-blue-400"
                          }`}
                        />
                        <span>{loc.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Account" disabled>
                <UserIcon />
                <span>{(user?.username as string) || "Account"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Logout" onClick={logout}>
                <LogOutIcon />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-(--header-height) shrink-0 items-center justify-between border-b px-4 md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-1 h-4" />
            <h1 className="text-base font-medium">{pageTitle}</h1>
          </div>
        </header>

        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}