//app\layouts\Topbar.tsx
"use client";
import { useEffect, useState } from "react";
import {
  Bell,
  Moon,
  Search,
  Sun,
  LogOut,
  User as UserIcon,
  Settings,
  Command,
  Menu,
} from "lucide-react";
import { useAuth, useUi } from "@/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CommandPalette } from "@/components/common/CommandPalette";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { usePathname, useRouter } from "next/navigation";
import { usePageTitle } from "@/store/page-title";

export function Topbar() {
  const { title } = usePageTitle();
  const { user, logout } = useAuth();
  const { darkMode, toggleDark, setCommandOpen, toggleSidebar } = useUi();
  const router = useRouter();
  const pathname = usePathname();
  // const [unread] = useState(notifications.filter((n) => !n.read).length);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCommandOpen]);

  const crumbs = pathname
    .split("/")
    .filter(Boolean)
    .filter((c) => {
      if (/^[0-9a-fA-F-]{36}$/.test(c)) return false;

      // Hide "all" only for loan application details
      if (pathname.startsWith("/loan-application/") && c === "all") {
        return false;
      }

      return true;
    });
  return (
    <>
      <header className="sticky top-0 z-100 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="h-full px-4 md:px-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="size-5" />
          </Button>
          <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
            {crumbs
              .filter((c) => !/^[0-9a-fA-F-]{36}$/.test(c))
              .map((c, i, arr) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span
                    className={
                      i === arr.length - 1
                        ? "font-medium text-foreground capitalize"
                        : "capitalize"
                    }
                  >
                    {c.replace(/-/g, " ")}
                  </span>

                  {i < arr.length - 1 && (
                    <span className="text-muted-foreground/50">/</span>
                  )}
                </span>
              ))}
            {title &&
              (pathname.startsWith("/student-profiles/") ||
                pathname.startsWith("/loan-application/")) && (
                <>
                  <span className="text-muted-foreground/50">/</span>
                  <span className="font-medium text-foreground">{title}</span>
                </>
              )}
          </div>

          <div className="flex-1" />
          <NotificationBell />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDark}
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-secondary transition-colors">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-(image:--gradient-primary) text-white text-xs font-semibold">
                    {user?.name
                      ?.split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start leading-tight">
                  <span className="text-xs font-semibold">{user?.name}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {user?.role?.name}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="size-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <CommandPalette />
    </>
  );
}
