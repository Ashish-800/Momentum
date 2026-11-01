"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Command,
  X,
  Mic,
  CheckSquare,
  BookOpen,
  Layers,
  Calendar,
  Mail,
  Clock,
  RotateCcw,
  Sun,
  Moon,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Settings,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getInMemoryStore } from "@/lib/db/seed";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const store = getInMemoryStore();
  const { decisions, meetings, actionItems } = store;

  // Handle temporal jumps
  const handleAdvanceTime = async (jump: string) => {
    try {
      const res = await fetch("/api/clock/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jump }),
      });
      if (res.ok) {
        const data = await res.json();
        window.dispatchEvent(
          new CustomEvent("momentum:clock-advanced", { detail: data })
        );
      }
    } catch {
      // Ignored
    }
    onClose();
  };

  // Handle theme switch
  const handleToggleTheme = () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    document.body.setAttribute("data-theme", next);
    if (next === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      document.body.classList.remove("dark");
      document.body.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      document.body.classList.remove("light");
      document.body.classList.add("dark");
    }
    document.documentElement.style.colorScheme = next;

    document.querySelectorAll("[data-theme]").forEach((el) => {
      el.setAttribute("data-theme", next);
    });

    try {
      localStorage.setItem("momentum-theme", next);
      document.cookie = `momentum-theme=${next}; path=/; max-age=31536000`;
    } catch (e) {}
    window.dispatchEvent(
      new CustomEvent("momentum:theme-changed", { detail: { theme: next } })
    );
    onClose();
  };

  // Base fast actions
  const BASE_ACTIONS = [
    {
      id: "nav-home",
      category: "Navigation",
      label: "Command Center Dashboard",
      sub: "Institutional memory pulse & Now-Needle timeline",
      icon: Layers,
      action: () => router.push("/home"),
    },
    {
      id: "nav-studio-debrief",
      category: "Navigation",
      label: "Open Voice Studio: Voice Debrief",
      sub: "Wispr Flow single-speaker recap capture",
      icon: Mic,
      action: () => router.push("/studio"),
    },
    {
      id: "nav-studio-roundtable",
      category: "Navigation",
      label: "Open Voice Studio: Round-Table",
      sub: "Live multi-speaker turns with real-time attribution",
      icon: Video,
      action: () => router.push("/studio?mode=roundtable"),
    },
    {
      id: "nav-review",
      category: "Navigation",
      label: "Review Tray & Approvals Gate",
      sub: "3D Split-Diff conflict resolution & task approval",
      icon: CheckSquare,
      action: () => router.push("/review"),
    },
    {
      id: "nav-ledger",
      category: "Navigation",
      label: "Institutional Decision Ledger & Radar",
      sub: "Cross-meeting decision memory and 3D Conflict Radar",
      icon: BookOpen,
      action: () => router.push("/ledger"),
    },
    {
      id: "nav-week",
      category: "Navigation",
      label: "My Week Execution Board",
      sub: "Kanban & list commitments with deadline alerts",
      icon: Calendar,
      action: () => router.push("/week"),
    },
    {
      id: "nav-digest",
      category: "Navigation",
      label: "Personalized Weekly Digest",
      sub: "Executive briefs for all 5 team members",
      icon: Mail,
      action: () => router.push("/digest"),
    },
    {
      id: "nav-settings",
      category: "Navigation",
      label: "Workspace Settings",
      sub: "Team roster, Trello API tokens, and reminder preferences",
      icon: Settings,
      action: () => router.push("/settings"),
    },
    {
      id: "time-1d",
      category: "Time Machine",
      label: "Advance Time +1 Day",
      sub: "Simulate 24 hours of project progress",
      icon: Clock,
      action: () => handleAdvanceTime("+1d"),
    },
    {
      id: "time-monday",
      category: "Time Machine",
      label: "Jump to Next Monday 9:00 AM IST",
      sub: "Fire scheduled reminders & generate Weekly Digests",
      icon: Clock,
      action: () => handleAdvanceTime("next_monday_9am"),
    },
    {
      id: "time-reset",
      category: "Time Machine",
      label: "Reset Baseline Clock (31 Oct 12:43 IST)",
      sub: "Revert simulated clock to Saturday baseline",
      icon: RotateCcw,
      action: () => handleAdvanceTime("reset"),
    },
    {
      id: "act-theme",
      category: "Appearance",
      label: "Toggle Theme (Obsidian Dark / Warm Alabaster)",
      sub: "Switch between dark and light tactile palettes",
      icon: Sun,
      action: handleToggleTheme,
    },
  ];

  // Dynamic search items across decisions, meetings, and tasks
  const dynamicResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const decisionMatches = decisions
      .filter((d: any) => d.statement.toLowerCase().includes(q))
      .slice(0, 3)
      .map((d: any) => ({
        id: `dec-${d.id}`,
        category: "Decisions",
        label: d.statement,
        sub: `Topic: ${d.topic} · Status: ${d.status}`,
        icon: BookOpen,
        action: () => {
          router.push("/ledger");
        },
      }));

    const meetingMatches = meetings
      .filter((m: any) => m.title.toLowerCase().includes(q))
      .slice(0, 3)
      .map((m: any) => ({
        id: `meet-${m.id}`,
        category: "Meetings",
        label: m.title,
        sub: `${m.durationMin || 45} min · ${m.status}`,
        icon: Video,
        action: () => {
          router.push(`/meetings/${m.id}`);
        },
      }));

    const taskMatches = actionItems
      .filter((a: any) => a.title.toLowerCase().includes(q) || (a.ownerNameRaw || "").toLowerCase().includes(q))
      .slice(0, 3)
      .map((a: any) => ({
        id: `task-${a.id}`,
        category: "Action Items",
        label: a.title,
        sub: `Owner: ${a.ownerNameRaw || "Unassigned"} · Priority: ${a.priority}`,
        icon: CheckSquare,
        action: () => {
          router.push("/week");
        },
      }));

    return [...decisionMatches, ...meetingMatches, ...taskMatches];
  }, [query, decisions, meetings, actionItems, router]);

  // Combined filtered items
  const combinedItems = useMemo(() => {
    if (!query.trim()) return BASE_ACTIONS;
    const q = query.toLowerCase();
    const actionMatches = BASE_ACTIONS.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.sub.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
    return [...dynamicResults, ...actionMatches];
  }, [query, dynamicResults, BASE_ACTIONS]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
      if (e.key === "ArrowDown" && isOpen) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(combinedItems.length, 1));
      }
      if (e.key === "ArrowUp" && isOpen) {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? Math.max(combinedItems.length - 1, 0) : prev - 1
        );
      }
      if (e.key === "Enter" && isOpen && combinedItems[selectedIndex]) {
        e.preventDefault();
        combinedItems[selectedIndex].action();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, combinedItems, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -12 }}
        transition={{ duration: 0.16 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl neu-raised border border-border-subtle rounded-2xl p-4 shadow-2xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-1)", borderColor: "var(--border-subtle)", color: "var(--text-1)" }}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 pb-3 border-b border-white/5">
          <Search size={16} className="text-ember flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, meeting title, decision, or temporal jump..."
            className="w-full bg-transparent text-sm text-text-1 placeholder:text-text-3 outline-none"
            autoFocus
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-raised text-text-3 border border-white/10">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="mt-3 space-y-1 max-h-[380px] overflow-y-auto pr-1">
          {combinedItems.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = idx === selectedIndex;

            return (
              <button
                key={item.id}
                onClick={() => {
                  item.action();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group ${
                  isSelected
                    ? "neu-inset text-ember border border-ember/30 bg-ember/5"
                    : "hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                      isSelected
                        ? "bg-ember text-black shadow-[0_0_10px_#FF7A1A]"
                        : "bg-raised text-text-2 group-hover:text-ember"
                    }`}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-ui font-semibold text-text-1 truncate">
                        {item.label}
                      </span>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-raised text-text-3">
                        {item.category}
                      </span>
                    </div>
                    {item.sub && (
                      <p className="text-[11px] text-text-3 truncate font-ui">
                        {item.sub}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0 pl-2">
                  <ArrowRight
                    size={12}
                    className={`transition-opacity ${
                      isSelected ? "opacity-100 text-ember" : "opacity-0"
                    }`}
                  />
                </div>
              </button>
            );
          })}

          {combinedItems.length === 0 && (
            <div className="p-8 text-center text-xs text-text-3">
              No matching actions, decisions, or meetings found.
            </div>
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-text-3">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Dismiss</span>
          </div>
          <span>Momentum Command Palette</span>
        </div>
      </motion.div>
    </div>
  );
}
