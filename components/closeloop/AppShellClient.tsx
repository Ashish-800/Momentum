"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Mic,
  CheckSquare,
  BookOpen,
  Calendar,
  Mail,
  Settings,
  Bell,
  Sun,
  Moon,
  Search,
  ChevronDown,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AssistantPanel } from "@/components/closeloop/AssistantPanel";
import { CommandPalette } from "@/components/closeloop/CommandPalette";
import { TimeMachinePill } from "@/components/closeloop/TimeMachinePill";
import { NotificationsDrawer } from "@/components/closeloop/NotificationsDrawer";
import { GuidedDemoCoach } from "@/components/closeloop/GuidedDemoCoach";
import { MomentumLogo } from "@/components/ui/MomentumLogo";
import { DEMO_SEED_DATA } from "@/lib/db/seed";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/studio", icon: Mic, label: "Voice Studio" },
  { href: "/review", icon: CheckSquare, label: "Review Gate", badge: 3 },
  { href: "/ledger", icon: BookOpen, label: "Decision Ledger" },
  { href: "/week", icon: Calendar, label: "My Week" },
  { href: "/digest", icon: Mail, label: "Weekly Digest" },
];

export function AppShellClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [demoCoachOpen, setDemoCoachOpen] = useState(false);
  const [simNow, setSimNow] = useState<Date>(DEMO_SEED_DATA.workspace.simNow);

  // Sync clock events and notification count
  useEffect(() => {
    function fetchUnread() {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => setUnreadCount(data.unreadCount || 0))
        .catch(() => {});
    }

    fetchUnread();

    const handleClockAdvanced = (e: any) => {
      if (e.detail?.simNow) {
        setSimNow(new Date(e.detail.simNow));
      }
      fetchUnread();
    };

    window.addEventListener("momentum:clock-advanced", handleClockAdvanced);
    window.addEventListener("closeloop:clock-advanced", handleClockAdvanced);
    return () => {
      window.removeEventListener("momentum:clock-advanced", handleClockAdvanced);
      window.removeEventListener("closeloop:clock-advanced", handleClockAdvanced);
    };
  }, []);

  // Apply theme to DOM and persist
  function applyTheme(next: "dark" | "light") {
    setTheme(next);
    if (typeof document !== "undefined") {
      // 1. Update <html> and <body> attributes and classes
      document.documentElement.setAttribute("data-theme", next);
      document.body.setAttribute("data-theme", next);
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(next);
      document.body.classList.remove("dark", "light");
      document.body.classList.add(next);
      document.documentElement.style.colorScheme = next;

      // 2. Also update any child wrapper that might have data-theme
      document.querySelectorAll("[data-theme]").forEach((el) => {
        el.setAttribute("data-theme", next);
      });

      // 3. Persist state
      try {
        localStorage.setItem("momentum-theme", next);
        document.cookie = `momentum-theme=${next}; path=/; max-age=31536000`;
      } catch (e) {}

      window.dispatchEvent(
        new CustomEvent("momentum:theme-changed", { detail: { theme: next } })
      );
    }
  }

  // Initialize theme from document or localStorage
  useEffect(() => {
    try {
      let saved = localStorage.getItem("momentum-theme") as "dark" | "light" | null;
      if (!saved) {
        // Also migrate from old closeloop-theme key
        saved = localStorage.getItem("closeloop-theme") as "dark" | "light" | null;
      }
      if (!saved) {
        const m = document.cookie.match(/momentum-theme=([^;]+)/);
        if (m && (m[1] === "dark" || m[1] === "light")) {
          saved = m[1] as "dark" | "light";
        }
      }
      if (!saved) {
        const currentAttr = document.documentElement.getAttribute("data-theme");
        if (currentAttr === "light" || currentAttr === "dark") {
          saved = currentAttr;
        }
      }
      const initial = saved === "light" ? "light" : "dark";
      applyTheme(initial);
    } catch (e) {}

    const handleExternalThemeChange = (e: any) => {
      if (e.detail?.theme && (e.detail.theme === "light" || e.detail.theme === "dark")) {
        setTheme(e.detail.theme);
      }
    };

    window.addEventListener("momentum:theme-changed", handleExternalThemeChange);
    return () => window.removeEventListener("momentum:theme-changed", handleExternalThemeChange);
  }, []);

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute("data-theme") || theme || "dark";
    const next = current === "dark" ? "light" : "dark";

    // 1. Update <html> and <body> attributes and classes
    document.documentElement.setAttribute("data-theme", next);
    document.body.setAttribute("data-theme", next);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(next);
    document.body.classList.remove("dark", "light");
    document.body.classList.add(next);
    document.documentElement.style.colorScheme = next;

    // 2. Also update any child wrapper that might have data-theme
    document.querySelectorAll("[data-theme]").forEach((el) => {
      el.setAttribute("data-theme", next);
    });

    // 3. Persist state
    try {
      localStorage.setItem("momentum-theme", next);
      document.cookie = `momentum-theme=${next}; path=/; max-age=31536000`;
    } catch (e) {}
    setTheme(next);

    // 4. Dispatch event
    window.dispatchEvent(
      new CustomEvent("momentum:theme-changed", { detail: { theme: next } })
    );
  };

  // Global shortcut for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function getPageTitle() {
    if (pathname.startsWith("/home")) return "Momentum";
    if (pathname.startsWith("/studio")) return "Voice Studio";
    if (pathname.startsWith("/review")) return "Review Gate";
    if (pathname.startsWith("/ledger")) return "Decision Ledger";
    if (pathname.startsWith("/week")) return "My Week";
    if (pathname.startsWith("/digest")) return "Weekly Digest";
    if (pathname.startsWith("/settings")) return "Settings";
    if (pathname.startsWith("/meetings")) return "Meeting Detail";
    return "Momentum";
  }

  return (
    <div
      className="flex min-h-dvh"
      style={{ backgroundColor: "var(--bg-0)", color: "var(--text-1)" }}
    >
      {/* ── Left Navigation Rail (Expandable 76px <-> 240px) ──────────────────── */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarExpanded ? 240 : 76 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className={cn(
          "hidden md:flex flex-col justify-between py-5 z-40 sticky top-0 h-dvh flex-shrink-0 overflow-hidden",
          "border-r border-border-subtle",
          isSidebarExpanded ? "px-3" : "px-2 items-center"
        )}
        style={{ backgroundColor: "var(--bg-1)", borderColor: "var(--border-subtle)" }}
      >
        {/* Top: Momentum Brand Logo & Navigation */}
        <div className="flex flex-col gap-6 w-full">
          {/* Logo / Header with Toggle */}
          {isSidebarExpanded ? (
            <div className="flex items-center justify-between w-full px-2 py-1">
              <Link
                href="/home"
                title="Momentum Home"
                className="flex items-center gap-3 min-w-0 group"
              >
                <MomentumLogo variant="icon" size={36} />
                <span className="font-sans font-extrabold italic tracking-tight text-[20px] text-text-1 truncate group-hover:text-ember transition-colors">
                  Momentum
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setIsSidebarExpanded(false)}
                title="Collapse sidebar"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-text-3 hover:text-text-1 hover:bg-recessed transition-colors cursor-pointer flex-shrink-0"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full">
              <button
                type="button"
                onClick={() => setIsSidebarExpanded(true)}
                title="Click to expand sidebar"
                className="block rounded-xl transition-all hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer p-1"
              >
                <MomentumLogo variant="icon" size={40} />
              </button>
            </div>
          )}

          {/* 6 Clean Navigation Items */}
          <nav className="flex flex-col gap-1.5 w-full">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center rounded-xl transition-all group cursor-pointer",
                    isSidebarExpanded
                      ? "px-3.5 py-2.5 gap-3 w-full"
                      : "w-11 h-11 justify-center mx-auto",
                    isActive
                      ? "bg-ember/10 text-ember font-bold"
                      : "text-text-3 hover:text-text-1 hover:bg-recessed"
                  )}
                  title={item.label}
                >
                  {/* Left Indicator Bar for Active Route */}
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-ember" />
                  )}

                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" />

                  {isSidebarExpanded && (
                    <span className="text-[15px] font-medium truncate flex-1 text-left">
                      {item.label}
                    </span>
                  )}

                  {item.badge && (
                    <span
                      className={cn(
                        "rounded-full bg-ember text-white font-mono font-bold flex items-center justify-center shadow-sm",
                        isSidebarExpanded
                          ? "px-2 py-0.5 text-[10px] ml-auto"
                          : "absolute -top-1 -right-1 w-4 h-4 text-[9px]"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Rail: Theme Switcher, Notifications Bell & Settings Gear */}
        <div className={cn("flex flex-col gap-1.5 w-full", isSidebarExpanded ? "px-1" : "items-center")}>
          {/* Theme Toggle Button (Sun / Moon) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggleTheme();
            }}
            className={cn(
              "flex items-center rounded-xl text-text-3 hover:text-text-1 hover:bg-recessed transition-colors cursor-pointer",
              isSidebarExpanded ? "px-3.5 py-2.5 gap-3 w-full" : "w-11 h-11 justify-center"
            )}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? (
              <Sun size={19} className="text-amber-400 flex-shrink-0" />
            ) : (
              <Moon size={19} className="text-indigo-600 flex-shrink-0" />
            )}
            {isSidebarExpanded && (
              <span className="text-[15px] font-medium truncate">
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
            )}
          </button>

          <button
            onClick={() => setNotificationsOpen(true)}
            className={cn(
              "relative flex items-center rounded-xl text-text-3 hover:text-text-1 hover:bg-recessed transition-colors cursor-pointer",
              isSidebarExpanded ? "px-3.5 py-2.5 gap-3 w-full" : "w-11 h-11 justify-center"
            )}
            title="Notifications"
          >
            <Bell size={19} className="flex-shrink-0" />
            {isSidebarExpanded && (
              <span className="text-[15px] font-medium truncate flex-1 text-left">
                Notifications
              </span>
            )}
            {unreadCount > 0 && (
              <span
                className={cn(
                  "rounded-full bg-conflict text-white font-mono font-bold flex items-center justify-center",
                  isSidebarExpanded
                    ? "px-2 py-0.5 text-[10px] ml-auto"
                    : "absolute -top-1 -right-1 w-4 h-4 text-[9px]"
                )}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <Link
            href="/settings"
            className={cn(
              "flex items-center rounded-xl text-text-3 hover:text-text-1 hover:bg-recessed transition-colors cursor-pointer",
              isSidebarExpanded ? "px-3.5 py-2.5 gap-3 w-full" : "w-11 h-11 justify-center",
              pathname === "/settings" && "text-ember bg-ember/10 font-bold"
            )}
            title="Settings"
          >
            <Settings size={19} className="flex-shrink-0" />
            {isSidebarExpanded && (
              <span className="text-[15px] font-medium truncate">Settings</span>
            )}
          </Link>
        </div>
      </motion.aside>

      {/* ── Main App Content & Top Header ──────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-dvh">
        {/* Top Workspace Header */}
        <header
          className="sticky top-0 z-30 h-16 border-b border-border-subtle backdrop-blur-md px-6 flex items-center justify-between gap-4"
          style={{ backgroundColor: "var(--bg-1)", borderColor: "var(--border-subtle)" }}
        >
          {/* Element 1: Left Page Title */}
          <div className="flex items-center gap-3">
            {pathname === "/home" ? (
              <h1 className="font-sans font-extrabold italic tracking-tight text-[24px] text-text-1">
                Momentum
              </h1>
            ) : (
              <h1 className="font-sans font-bold tracking-tight text-[22px] text-text-1">
                {getPageTitle()}
              </h1>
            )}
          </div>

          {/* Element 2: Center Clean Global Search Input */}
          <div className="flex-1 max-w-md mx-2 hidden md:block">
            <button
              onClick={() => setPaletteOpen(true)}
              className="w-full bg-recessed px-3.5 py-2 rounded-xl flex items-center justify-between text-xs text-text-3 hover:text-text-2 transition-colors border border-border-subtle cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search size={14} className="text-text-3" />
                <span>Search decisions, meetings, tasks...</span>
              </div>
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface text-text-3 border border-border-strong font-semibold">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Group: Simulated Clock & AI Assistant (Theme toggle moved to Sidebar) */}
          <div className="flex items-center gap-3">
            {/* 1. Simulated Clock / Time Machine Pill */}
            <TimeMachinePill
              simNow={simNow}
              onAdvance={async (h: number | string) => {
                const numH = typeof h === "number" ? h : parseFloat(h) || 1;
                setSimNow((prev) => new Date(prev.getTime() + numH * 60 * 60 * 1000));
              }}
            />

            {/* 2. AI Assistant Toggle Button */}
            <button
              onClick={() => setAssistantOpen((prev) => !prev)}
              className={cn(
                "px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-mono font-semibold border transition-all cursor-pointer",
                assistantOpen
                  ? "bg-ember/10 border-ember/40 text-ember"
                  : "btn-secondary text-text-2 hover:text-text-1"
              )}
              title="Toggle Grounded AI Assistant Drawer"
            >
              <Sparkles size={14} className="text-ember" />
              <span className="hidden xl:inline">AI Assistant</span>
            </button>
          </div>
        </header>

        <div
          className="flex-1 pb-16 md:pb-0"
          style={{ backgroundColor: "var(--bg-0)", color: "var(--text-1)" }}
        >
          {children}
        </div>

        {/* Mobile Dock */}
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-lg border-t border-border-subtle p-2 flex items-center justify-around"
          style={{ backgroundColor: "var(--bg-1)", borderColor: "var(--border-subtle)" }}
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative p-2.5 rounded-xl flex flex-col items-center",
                  isActive ? "text-ember font-bold" : "text-text-3"
                )}
              >
                <Icon size={18} />
                <span className="text-[9px] mt-0.5">{item.label.split(" ")[0]}</span>
                {item.badge && (
                  <span className="absolute top-1 right-2 w-3.5 h-3.5 rounded-full bg-ember text-white text-[8px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          {/* Mobile Theme Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggleTheme();
            }}
            className="relative p-2.5 rounded-xl flex flex-col items-center text-text-3 hover:text-text-1 cursor-pointer"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? (
              <Sun size={18} className="text-amber-400" />
            ) : (
              <Moon size={18} className="text-indigo-600" />
            )}
            <span className="text-[9px] mt-0.5">{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
        </div>
      </div>

      {/* Right Assistant Panel */}
      <AssistantPanel
        isOpen={assistantOpen}
        onToggle={() => setAssistantOpen(false)}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onCountChange={setUnreadCount}
      />

      {/* 3-Minute Guided Demo Coach */}
      <GuidedDemoCoach
        isOpen={demoCoachOpen}
        onClose={() => setDemoCoachOpen(false)}
        onOpen={() => setDemoCoachOpen(true)}
      />
    </div>
  );
}
