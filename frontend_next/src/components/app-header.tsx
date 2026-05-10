"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocations } from "@/providers/location-provider";
import { titleToSlug } from "@/services/api";

export function AppHeader() {
  const { logout, user } = useAuth();
  const { locations } = useLocations();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="max-w-[1600px] mx-auto flex h-14 items-center justify-between px-4 md:px-6">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/adaro-logo.png" alt="Adaro" width={120} height={36} className="h-8 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button
                variant={pathname === "/" ? "secondary" : "ghost"}
                size="sm"
                className="text-sm"
              >
                Dashboard
              </Button>
            </Link>
            <Link href="/google-data-studio">
              <Button
                variant={pathname === "/google-data-studio" ? "secondary" : "ghost"}
                size="sm"
                className="text-sm"
              >
                Google Data Studio
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant={pathname !== "/" && pathname !== "/login" && pathname !== "/google-data-studio" ? "secondary" : "ghost"} size="sm" className="text-sm" />}
              >
                Locations
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {locations.map((loc) => (
                  <DropdownMenuItem key={loc.id} className="p-0">
                    <Link href={`/${titleToSlug(loc.title)}`} className="flex items-center gap-2 w-full px-1.5 py-1">
                      <span
                        className={`h-2 w-2 rounded-full ${loc.sensor ? "bg-red-500" : "bg-blue-400"}`}
                      />
                      {loc.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        {/* Right: Account */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" className="text-sm" />}
            >
              {(user?.username as string) || "Account"}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                Signed in
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
