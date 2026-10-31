"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckSquare,
  GitBranch,
  Calendar,
  RotateCcw,
  Clock,
  Sparkles,
  ArrowRight,
  BellRing,
  CheckCircle2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PulseStat } from "@/components/closeloop/PulseStat";
import { MeetingCard } from "@/components/closeloop/MeetingCard";
import { DEMO_SEED_DATA } from "@/lib/db/seed";

export default function HomePage() {
  const router = useRouter();

  // State
  const [data] = useState(DEMO_SEED_DATA);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Nudge feedback state
  const [nudged, setNudged] = useState(false);

  // Reset Demo Data via POST /api/demo/seed
  async function handleResetData() {
    setIsResetting(true);
    try {
      const res = await fetch("/api/demo/seed", { method: "POST" });
      if (res.ok) {
        setResetMessage("Demo data reset to Northstar Labs baseline.");
        setTimeout(() => setResetMessage(null), 3500);
      }
    } catch {
      setResetMessage("Reset in-memory state.");
      setTimeout(() => setResetMessage(null), 2500);
    } finally {
      setIsResetting(false);
    }
  }

  // Derived statistics
  const activeDecisionsCount = data.decisions.filter((d) => d.status === "active").length;
  const openConflictsCount = data.conflicts.filter((c) => c.status === "open").length;
  const pendingApprovalsCount =
    data.actionItems.filter((a) => a.status === "proposed").length +
    data.decisions.filter((d) => d.status === "proposed").length;
  const tasksDueThisWeekCount = data.actionItems.filter((a) => a.dueDate && a.status !== "completed").length;

  // Meetings sorted by date
  const meetingsList = useMemo(() => {
    return [...data.meetings].sort((a, b) => b.meetingDate.getTime() - a.meetingDate.getTime());
  }, [data.meetings]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── SECTION 1: Clean Greeting Row ───────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-text-1 tracking-tight">
            Good afternoon, Priya — your team’s institutional{" "}
            <span className="font-accent text-ember italic font-normal">memory</span> is synced
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("closeloop:start-demo-tour"))}
            className="btn-primary px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-mono font-bold cursor-pointer"
          >
            <Sparkles size={14} className="text-white" />
            <span>▶ Run 3-Minute Guided Demo</span>
          </button>

          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="btn-secondary px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-mono font-semibold cursor-pointer"
          >
            <RotateCcw size={14} className={isResetting ? "animate-spin text-ember" : ""} />
            <span>{isResetting ? "Resetting..." : "Reset Demo Data"}</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Notification */}
      <AnimatePresence>
        {resetMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="pill-success px-4 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} />
              <span>{resetMessage}</span>
            </div>
            <button onClick={() => setResetMessage(null)}>
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ROW 1: 4 Ultra-Clean Stat Cards ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PulseStat
          label="Open Conflicts"
          value={openConflictsCount}
          icon={AlertTriangle}
          color="#E11D48"
        />
        <PulseStat
          label="Pending Approvals"
          value={pendingApprovalsCount}
          icon={CheckSquare}
          color="#EA580C"
        />
        <PulseStat
          label="Tasks Due This Week"
          value={tasksDueThisWeekCount}
          icon={Calendar}
          color="#D97706"
        />
        <PulseStat
          label="Active Decisions"
          value={activeDecisionsCount}
          icon={GitBranch}
          color="#4F46E5"
        />
      </div>

      {/* ── ROW 2: 3 High-Contrast "Needs Attention" Cards ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Conflict Alert (Rose Accent) */}
        <div className="neu-raised p-5 flex flex-col justify-between border-l-4 border-l-[#E11D48] bg-surface">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="pill-conflict px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={11} />
                Schedule Conflict Detected
              </span>
              <span className="text-[11px] font-mono text-text-3 font-semibold">High Severity</span>
            </div>
            <h3 className="font-display font-bold text-base text-text-1 leading-snug">
              Proposed 1 Dec Release vs Confirmed 15 Nov
            </h3>
            <p className="text-xs text-text-2 leading-relaxed">
              Tech Innovations Workshop proposed postponing Android release to 1 Dec for offline vector indexing.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-end">
            <button
              onClick={() => router.push("/review")}
              className="btn-secondary px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Inspect Clash</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Card 2: Pending Approvals (Ember Accent) */}
        <div className="neu-raised p-5 flex flex-col justify-between border-l-4 border-l-[#EA580C] bg-surface">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="pill-pending px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare size={11} />
                Human-In-The-Loop Gate
              </span>
              <span className="pill-pending px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                3 Staged
              </span>
            </div>
            <h3 className="font-display font-bold text-base text-text-1 leading-snug">
              3 Extracted Items Awaiting Your Sign-Off
            </h3>
            <p className="text-xs text-text-2 leading-relaxed">
              Push notification vendor selection, 10k load testing credit, and Hindi/Japanese localization scopes.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-end">
            <Link
              href="/review"
              className="btn-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Open Review Tray</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Card 3: Due Within 24h (Amber Accent) */}
        <div className="neu-raised p-5 flex flex-col justify-between border-l-4 border-l-[#D97706] bg-surface">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="pill-warning px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={11} />
                Due Within 24 Hours
              </span>
              <span className="pill-warning px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                1 Nov · 12:00 IST
              </span>
            </div>
            <h3 className="font-display font-bold text-base text-text-1 leading-snug">
              Arjun Rao: Cut Release Branch (v2.0-rc1)
            </h3>
            <p className="text-xs text-text-2 leading-relaxed">
              Critical prerequisite for QA full regression pass. Due in 23 hours from simulated current time.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-decision/15 text-decision text-[10px] font-bold flex items-center justify-center font-mono">
                AR
              </div>
              <span className="text-xs font-mono text-text-2 font-medium">Arjun Rao</span>
            </div>
            <button
              onClick={() => {
                setNudged(true);
                setTimeout(() => setNudged(false), 2000);
              }}
              className="btn-secondary px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <BellRing size={12} />
              <span>{nudged ? "Reminder Sent ✓" : "Send Reminder"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Institutional Meeting Library Grid ───────── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-text-1">
              Institutional Meeting Library
            </h2>
            <p className="text-xs text-text-3">
              Permanent consensus and decision provenance from 9 recorded team syncs
            </p>
          </div>
          <Link
            href="/studio"
            className="btn-primary px-3.5 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5"
          >
            <span>+ Ingest New Meeting</span>
          </Link>
        </div>

        {/* 3-Column Clean Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {meetingsList.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting as any} />
          ))}
        </div>
      </div>
    </div>
  );
}
