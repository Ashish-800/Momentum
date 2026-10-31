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
import { VoiceOrb3D } from "@/components/three/VoiceOrb3D";
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
  { href: "/review", icon: CheckSquare, label: "Review Tray", badge: 3 },
  { href: "/ledger", icon: BookOpen, label: "Decision Ledger & Radar" },
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
      {/* ── Left Navigation Rail (72px wide, .neu-raised) ───── */}
      <aside
        className={cn(
          "hidden md:flex flex-col items-center justify-between py-5 z-40 sticky top-0 h-dvh",
          "w-[72px] neu-raised rounded-none border-r border-white/5",
          "bg-bg-1"
        )}
      >
        {/* Top: 3D Geometric Logo Mark */}
        <div className="flex flex-col items-center gap-5">
          <Link
            href="/home"
            className="w-11 h-11 neu-button flex items-center justify-center rounded-2xl group transition-all"
            title="Closeloop (MeetFlow AI)"
          >
            <div className="relative w-6 h-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-lg border-2 border-ember rotate-45 group-hover:rotate-90 transition-transform duration-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-ember-gradient shadow-[0_0_10px_#FF7A1A]" />
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="flex flex-col items-center gap-2.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative w-11 h-11 neu-button flex items-center justify-center rounded-2xl group transition-all",
                    isActive
                      ? "neu-inset text-ember border-ember/40 shadow-[0_0_18px_-4px_rgba(255,122,26,0.4)]"
                      : "text-text-3 hover:text-text-1"
                  )}
                  title={item.label}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />

                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-ember text-black font-mono font-bold text-[9px] flex items-center justify-center shadow-[0_0_10px_#FF7A1A]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Rail Group */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => router.push("/studio")}
            className="w-11 h-11 neu-button rounded-2xl flex items-center justify-center relative overflow-hidden group border border-ember/30"
            title="Open Voice Studio"
          >
            <VoiceOrb3D size={32} state="idle" />
          </button>

          <button
            onClick={toggleTheme}
            className="w-10 h-10 neu-button flex items-center justify-center rounded-xl text-text-3 hover:text-text-1 transition-colors"
            title={`Switch to ${theme === "dark" ? "Warm Alabaster Light" : "Obsidian Dark"} theme`}
          >
            {theme === "dark" ? (
              <Sun size={16} className="text-warning" />
            ) : (
              <Moon size={16} className="text-decision" />
            )}
          </button>

          <button
            onClick={() => setNotificationsOpen(true)}
            className="relative w-10 h-10 neu-button flex items-center justify-center rounded-xl text-text-3 hover:text-text-1 transition-colors"
            title="Deadline Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-conflict text-white text-[9px] font-mono font-bold flex items-center justify-center shadow-[0_0_8px_#FF4D6D]">
                {unreadCount}
              </span>
            )}
          </button>

          <Link
            href="/settings"
            className={cn(
              "w-10 h-10 neu-button flex items-center justify-center rounded-xl transition-colors",
              pathname === "/settings" ? "neu-inset text-ember" : "text-text-3 hover:text-text-1"
            )}
            title="Workspace Settings"
          >
            <Settings size={16} />
          </Link>
        </div>
      </aside>

      {/* ── Main App Content & Top Header ──────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col min-h-dvh">
        {/* Top Workspace Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-white/5 bg-bg-0/90 backdrop-blur-md px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="font-display font-bold text-base text-text-1 hidden sm:block">
              {getPageTitle()}
            </h1>
            <div className="neu-inset px-2.5 py-1 rounded-full flex items-center gap-2 text-xs font-mono text-text-3 border border-white/5">
              <span className="text-text-2 font-semibold">Northstar Labs</span>
              <span>/</span>
              <span className="text-ember font-medium">Mobile v2</span>
              <ChevronDown size={12} className="text-text-3" />
            </div>
          </div>

          <div className="flex-1 max-w-md mx-2 hidden md:block">
            <button
              onClick={() => setPaletteOpen(true)}
              className="w-full neu-inset px-3.5 py-1.5 rounded-xl flex items-center justify-between text-xs text-text-3 hover:text-text-2 transition-colors border border-white/5"
            >
              <div className="flex items-center gap-2">
                <Search size={14} className="text-text-3" />
                <span>Search decisions, transcripts, action items...</span>
              </div>
              <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-raised text-text-3 border border-white/10">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDemoCoachOpen(true)}
              className="neu-button px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-mono font-bold text-ember border border-ember/30 hover:shadow-[0_0_12px_rgba(255,122,26,0.3)] transition-all"
              title="Launch 3-Minute Guided Demo Tour"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-ember animate-pulse" />
              <span>▶ Guided Demo</span>
            </button>

            <TimeMachinePill
              simNow={simNow}
              onAdvance={async (h: number | string) => {
                const numH = typeof h === "number" ? h : parseFloat(h) || 1;
                setSimNow((prev) => new Date(prev.getTime() + numH * 60 * 60 * 1000));
              }}
            />

            <button
              onClick={() => setAssistantOpen((prev) => !prev)}
              className={cn(
                "neu-button p-2 rounded-xl flex items-center gap-1.5 text-xs font-mono transition-all",
                assistantOpen
                  ? "neu-inset text-ember border-ember/30"
                  : "text-text-3 hover:text-text-1"
              )}
              title="Toggle AI Assistant Panel"
            >
              <Sparkles size={14} className="text-ember" />
              <span className="hidden xl:inline">AI Memory</span>
            </button>

            <div
              className="w-9 h-9 rounded-full neu-raised flex items-center justify-center font-bold text-xs cursor-pointer border border-ember/40 text-ember"
              style={{ background: "rgba(255, 122, 26, 0.15)" }}
              title="Priya Nair (Product Manager)"
            >
              PN
            </div>
          </div>
        </header>

        <div className="flex-1 pb-16 md:pb-0">
          {children}
        </div>

        {/* Mobile Dock */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-1/95 backdrop-blur-lg border-t border-white/5 p-2 flex items-center justify-around">
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
                  <span className="absolute top-1 right-2 w-3.5 h-3.5 rounded-full bg-ember text-black text-[8px] font-bold flex items-center justify-center">
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

