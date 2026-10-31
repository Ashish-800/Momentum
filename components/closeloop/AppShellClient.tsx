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
} from "lucide-react";
import { AssistantPanel } from "@/components/closeloop/AssistantPanel";
import { CommandPalette } from "@/components/closeloop/CommandPalette";
import { TimeMachinePill } from "@/components/closeloop/TimeMachinePill";
import { NotificationsDrawer } from "@/components/closeloop/NotificationsDrawer";
import { GuidedDemoCoach } from "@/components/closeloop/GuidedDemoCoach";
import { DEMO_SEED_DATA } from "@/lib/db/seed";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/home", icon: Home, label: "Command Center" },
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

    window.addEventListener("closeloop:clock-advanced", handleClockAdvanced);
    return () => window.removeEventListener("closeloop:clock-advanced", handleClockAdvanced);
  }, []);

  // Initialize theme from document or localStorage
  useEffect(() => {
    const saved = localStorage.getItem("closeloop-theme") as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("closeloop-theme", next);
    document.cookie = `theme=${next}; path=/; max-age=31536000`;
  }

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
    if (pathname.startsWith("/home")) return "Command Center";
    if (pathname.startsWith("/studio")) return "Voice Studio";
    if (pathname.startsWith("/review")) return "Review Gate & Approvals";
    if (pathname.startsWith("/ledger")) return "Decision Ledger & Lineage";
    if (pathname.startsWith("/week")) return "My Week & Commitments";
    if (pathname.startsWith("/digest")) return "Personalized Weekly Digest";
    if (pathname.startsWith("/settings")) return "Workspace Settings";
    if (pathname.startsWith("/meetings")) return "Meeting Detail & Analysis";
    return "Closeloop";
  }

  return (
    <div className="flex min-h-dvh bg-bg-0 text-text-1">
      {/* ── Left Navigation Rail (68px wide) ──────────────────── */}
      <aside
        className={cn(
          "hidden md:flex flex-col items-center justify-between py-5 z-40 sticky top-0 h-dvh",
          "w-[68px] border-r border-border-subtle bg-bg-1"
        )}
      >
        {/* Top: Clean Geometric Brand Icon */}
        <div className="flex flex-col items-center gap-6">
          <Link
            href="/home"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-ember/10 border border-ember/30 group hover:border-ember transition-colors"
            title="Closeloop (MeetFlow AI)"
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <div className="absolute inset-0 rounded-md border-2 border-ember rotate-45 group-hover:rotate-90 transition-transform duration-300" />
              <div className="w-2 h-2 rounded-full bg-ember" />
            </div>
          </Link>

          {/* 6 Clean Navigation Items */}
          <nav className="flex flex-col items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative w-11 h-11 flex items-center justify-center rounded-xl transition-all group",
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

                  <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />

                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-ember text-white font-mono font-bold text-[9px] flex items-center justify-center shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Rail: ONLY Notifications Bell & Settings Gear */}
        <div className="flex flex-col items-center gap-2.5">
          <button
            onClick={() => setNotificationsOpen(true)}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl text-text-3 hover:text-text-1 hover:bg-recessed transition-colors cursor-pointer"
            title="Deadline Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-conflict text-white text-[9px] font-mono font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <Link
            href="/settings"
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-xl text-text-3 hover:text-text-1 hover:bg-recessed transition-colors",
              pathname === "/settings" && "text-ember bg-ember/10 font-bold"
            )}
            title="Workspace Settings"
          >
            <Settings size={18} />
          </Link>
        </div>
      </aside>

      {/* ── Main App Content & Top Header ──────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-dvh">
        {/* Top Workspace Header (ONLY 4 Clean Elements) */}
        <header className="sticky top-0 z-30 h-16 border-b border-border-subtle bg-bg-1/95 backdrop-blur-md px-6 flex items-center justify-between gap-4">
          {/* Element 1: Left Page Title + subtle project badge */}
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-[18px] text-text-1 hidden sm:block">
              {getPageTitle()}
            </h1>
            <div className="px-2.5 py-1 rounded-full flex items-center gap-2 text-xs font-mono bg-recessed text-text-3 border border-border-subtle">
              <span className="text-text-2 font-semibold">Northstar Labs</span>
              <span>/</span>
              <span className="text-ember font-medium">Mobile v2</span>
              <ChevronDown size={12} className="text-text-3" />
            </div>
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

          {/* Right Group: EXACTLY 3 Items */}
          <div className="flex items-center gap-3">
            {/* 1. Simulated Clock / Time Machine Pill */}
            <TimeMachinePill
              simNow={simNow}
              onAdvance={async (h: number | string) => {
                const numH = typeof h === "number" ? h : parseFloat(h) || 1;
                setSimNow((prev) => new Date(prev.getTime() + numH * 60 * 60 * 1000));
              }}
            />

            {/* 2. Physical Sliding Theme Toggle Pill (☀️ Light / 🌙 Dark) */}
            <button
              onClick={toggleTheme}
              className="btn-secondary px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-mono font-semibold cursor-pointer shadow-sm"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} theme`}
            >
              {theme === "dark" ? (
                <>
                  <Sun size={14} className="text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon size={14} className="text-indigo-600" />
                  <span>Dark</span>
                </>
              )}
            </button>

            {/* 3. AI Assistant Toggle Button */}
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

        <div className="flex-1 pb-16 md:pb-0">
          {children}
        </div>

        {/* Mobile Dock */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-1/95 backdrop-blur-lg border-t border-border-subtle p-2 flex items-center justify-around">
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
