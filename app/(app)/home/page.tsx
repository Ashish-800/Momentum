"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckSquare,
  GitBranch,
  Calendar,
  Layers,
  RotateCcw,
  Clock,
  Filter,
  Video,
  Mic,
  ChevronRight,
  Sparkles,
  ArrowRight,
  BellRing,
  CheckCircle2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PulseStat } from "@/components/closeloop/PulseStat";
import { MeetingCard } from "@/components/closeloop/MeetingCard";
import { NowNeedleTimeline } from "@/components/closeloop/NowNeedleTimeline";
import { TiltCard3D } from "@/components/three/TiltCard3D";
import { DEMO_SEED_DATA } from "@/lib/db/seed";
import { formatIST, formatDateIST, cn } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();

  // State
  const [data, setData] = useState(DEMO_SEED_DATA);
  const [simNow, setSimNow] = useState<Date>(DEMO_SEED_DATA.workspace.simNow);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Filter & Sort Drawer
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "duration">("date");

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
      // Offline fallback
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

  // Filtered & sorted meetings
  const displayedMeetings = useMemo(() => {
    let list = [...data.meetings];
    if (filterStatus !== "all") {
      list = list.filter((m) => m.status === filterStatus);
    }
    if (sortBy === "date") {
      list.sort((a, b) => b.meetingDate.getTime() - a.meetingDate.getTime());
    } else {
      list.sort((a, b) => (b.durationMin || 0) - (a.durationMin || 0));
    }
    return list;
  }, [data.meetings, filterStatus, sortBy]);

  // Timeline data mapping
  const timelineMeetings = useMemo(() => {
    return data.meetings.map((m) => ({
      id: m.id,
      title: m.title,
      date: m.meetingDate,
      durationMin: m.durationMin || 45,
      status: m.status,
    }));
  }, [data.meetings]);

  const timelineDecisions = useMemo(() => {
    return data.decisions
      .filter((d) => d.effectiveDate && d.status === "active")
      .map((d) => ({
        id: d.id,
        statement: d.statement,
        date: d.effectiveDate!,
        topic: d.topic,
      }));
  }, [data.decisions]);

  const timelineTasks = useMemo(() => {
    return data.actionItems
      .filter((a) => a.dueDate)
      .map((a) => ({
        id: a.id,
        title: a.title,
        dueDate: a.dueDate!,
        owner: a.ownerNameRaw || "Owner",
        priority: a.priority,
      }));
  }, [data.actionItems]);

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-8">
      {/* ── 1. Greeting & Pulse Row ──────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-ember animate-pulse" />
            <span className="text-[11px] font-mono text-text-3 uppercase tracking-wider">
              Northstar Labs · Live Command Center
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-text-1 tracking-tight">
            Good afternoon, Priya — your team’s institutional{" "}
            <span className="font-accent text-ember italic">memory</span> is synced
          </h1>
          <p className="text-xs text-text-3 font-mono mt-1">
            Simulated Clock: {formatIST(simNow, "EEE, d MMM yyyy · HH:mm")} IST
          </p>
        </div>

        {/* Action Controls: Guided Demo Tour & Reset Demo Data */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("closeloop:start-demo-tour"))}
            className="neu-button px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-mono font-bold text-white bg-ember-gradient shadow-[0_0_16px_rgba(255,122,26,0.35)] hover:opacity-95 transition-all"
          >
            <Sparkles size={14} className="text-white animate-pulse" />
            <span>▶ Run 3-Minute Guided Demo</span>
          </button>

          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="neu-button px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-mono font-semibold text-text-2 hover:text-ember transition-colors"
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
            className="neu-raised px-4 py-2.5 rounded-xl bg-action/10 border border-action/30 text-action text-xs font-mono flex items-center justify-between"
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

      {/* ── Four 3D Tilt PulseStat Cards ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PulseStat
          label="Open Conflicts"
          value={openConflictsCount}
          delta={openConflictsCount > 0 ? "1 critical clash" : "Zero conflicts"}
          deltaPositive={false}
          icon={AlertTriangle}
          color="#FF4D6D"
          glow={openConflictsCount > 0}
          sparklineData={[1, 0, 2, 1, 1, 1, 1]}
        />
        <PulseStat
          label="Pending Approvals"
          value={pendingApprovalsCount}
          delta="3 items awaiting gate"
          deltaPositive={false}
          icon={CheckSquare}
          color="#FF7A1A"
          glow={pendingApprovalsCount > 0}
          sparklineData={[2, 3, 1, 4, 2, 3, 3]}
        />
        <PulseStat
          label="Tasks Due This Week"
          value={tasksDueThisWeekCount}
          delta="1 due within 24h"
          deltaPositive={true}
          icon={Calendar}
          color="#FFC247"
          sparklineData={[4, 5, 3, 6, 4, 3, 4]}
        />
        <PulseStat
          label="Active Decisions"
          value={activeDecisionsCount}
          delta="+2 this sprint"
          deltaPositive={true}
          icon={GitBranch}
          color="#8C9CFF"
          sparklineData={[3, 4, 5, 5, 5, 6, 7]}
        />
      </div>

      {/* ── 2. Tactile Attention Strip (3 Horizontal Cards) ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card 1: Conflict Alert (Rose glow) */}
        <TiltCard3D intensity={4}>
          <div className="neu-raised neu-conflict-glow p-4 relative overflow-hidden flex flex-col justify-between h-full border-l-4 border-l-conflict">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-conflict flex items-center gap-1.5">
                  <AlertTriangle size={12} />
                  Schedule Conflict Detected
                </span>
                <span className="text-[10px] font-mono text-text-3">High Severity</span>
              </div>
              <h3 className="font-display font-bold text-sm text-text-1 leading-snug mb-1">
                Proposed 1 Dec Release vs Confirmed 15 Nov
              </h3>
              <p className="text-xs text-text-2 leading-relaxed line-clamp-2">
                Tech Innovations Workshop proposed postponing Android release to 1 Dec for offline vector indexing.
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-mono text-text-3">Contradicts DEC-001</span>
              <button
                onClick={() => router.push("/review")}
                className="neu-button px-3 py-1.5 rounded-lg text-xs font-semibold text-conflict hover:bg-conflict/10 flex items-center gap-1.5 transition-colors"
              >
                <span>Inspect Clash</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </TiltCard3D>

        {/* Card 2: Pending Approvals (Ember glow) */}
        <TiltCard3D intensity={4}>
          <div className="neu-raised neu-ember-glow p-4 relative overflow-hidden flex flex-col justify-between h-full border-l-4 border-l-ember">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ember flex items-center gap-1.5">
                  <CheckSquare size={12} />
                  Human-In-The-Loop Gate
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ember/20 text-ember font-bold">
                  3 Staged
                </span>
              </div>
              <h3 className="font-display font-bold text-sm text-text-1 leading-snug mb-1">
                3 Extracted Items Awaiting Your Sign-Off
              </h3>
              <p className="text-xs text-text-2 leading-relaxed">
                Push notification vendor selection, 10k load testing credit, and Hindi/Japanese localization scopes.
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-mono text-text-3">Zero auto-commits</span>
              <Link
                href="/review"
                className="neu-button px-3 py-1.5 rounded-lg text-xs font-semibold text-ember hover:bg-ember/10 flex items-center gap-1.5 transition-colors"
              >
                <span>Open Review Tray</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </TiltCard3D>

        {/* Card 3: Due Within 24h (Amber glow) */}
        <TiltCard3D intensity={4}>
          <div className="neu-raised p-4 relative overflow-hidden flex flex-col justify-between h-full border-l-4 border-l-warning shadow-[0_0_24px_-8px_rgba(255,194,71,0.3)]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-warning flex items-center gap-1.5">
                  <Clock size={12} />
                  Due Within 24 Hours
                </span>
                <span className="text-[10px] font-mono text-warning font-bold">1 Nov · 12:00 IST</span>
              </div>
              <h3 className="font-display font-bold text-sm text-text-1 leading-snug mb-1">
                Arjun Rao: Cut Release Branch (v2.0-rc1)
              </h3>
              <p className="text-xs text-text-2 leading-relaxed">
                Critical prerequisite for QA full regression pass. Due in 23 hours from simulated current time.
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-decision/20 text-decision text-[9px] font-bold flex items-center justify-center">
                  AR
                </div>
                <span className="text-[10px] font-mono text-text-3">Arjun Rao</span>
              </div>
              <button
                onClick={() => {
                  setNudged(true);
                  setTimeout(() => setNudged(false), 2000);
                }}
                className={cn(
                  "neu-button px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors",
                  nudged ? "bg-action/20 text-action" : "text-warning hover:bg-warning/10"
                )}
              >
                <BellRing size={12} />
                <span>{nudged ? "Nudge Sent ✓" : "Quick Nudge"}</span>
              </button>
            </div>
          </div>
        </TiltCard3D>
      </div>

      {/* ── 3. Interactive 3D Now-Needle Timeline ────────────── */}
      <NowNeedleTimeline
        simNow={simNow}
        meetings={timelineMeetings}
        decisions={timelineDecisions}
        tasks={timelineTasks}
        onScrubTime={(newDate) => setSimNow(newDate)}
      />

      {/* ── 4. Upcoming Events Panel (Google Meet & Zoom) ─────── */}
      <section className="neu-raised p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Video size={16} className="text-decision" />
            <h2 className="font-display font-bold text-sm text-text-1">
              Synchronized Calendar & Upcoming Events
            </h2>
          </div>
          <span className="text-[11px] font-mono text-text-3">
            Google Calendar & Zoom synced
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Google Meet Group */}
          <div className="neu-inset p-4 rounded-xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#4285F4]" />
                <span className="text-xs font-mono font-bold text-text-1">Google Meet</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-text-3">
                1 Session Today
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <h4 className="text-xs font-semibold text-text-1">Release Candidate Triage & Sign-off</h4>
                <div className="text-[10px] font-mono text-text-3 mt-0.5">Today · 16:30 IST (45m)</div>
                {/* Avatars */}
                <div className="flex items-center -space-x-1 mt-2">
                  {["PN", "AR", "SK"].map((initial, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full bg-raised border border-white/10 text-[9px] font-bold flex items-center justify-center text-text-2"
                    >
                      {initial}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => router.push("/studio")}
                className="neu-button px-3 py-2 rounded-xl text-xs font-semibold text-ember flex items-center gap-1.5"
              >
                <Mic size={12} />
                <span>Capture in Studio</span>
              </button>
            </div>
          </div>

          {/* Zoom Group */}
          <div className="neu-inset p-4 rounded-xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#2D8CFF]" />
                <span className="text-xs font-mono font-bold text-text-1">Zoom</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-text-3">
                1 Session Tomorrow
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <h4 className="text-xs font-semibold text-text-1">Creator Partner Campaign Briefing</h4>
                <div className="text-[10px] font-mono text-text-3 mt-0.5">Sun, 1 Nov · 11:00 IST (60m)</div>
                {/* Avatars */}
                <div className="flex items-center -space-x-1 mt-2">
                  {["RG", "PN", "MS"].map((initial, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full bg-raised border border-white/10 text-[9px] font-bold flex items-center justify-center text-text-2"
                    >
                      {initial}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => router.push("/studio")}
                className="neu-button px-3 py-2 rounded-xl text-xs font-semibold text-decision flex items-center gap-1.5"
              >
                <Mic size={12} />
                <span>Capture in Studio</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. 3D Meeting Library Grid with Sort & Refine ────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-ember" />
            <h2 className="font-display font-bold text-base text-text-1">
              Institutional Meeting Memory
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-raised text-text-3 border border-white/5">
              {displayedMeetings.length} of {data.meetings.length} sessions
            </span>
          </div>

          {/* Sort & Refine Tactile Button */}
          <button
            onClick={() => setFilterDrawerOpen((prev) => !prev)}
            className="neu-button px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-mono text-text-2 hover:text-text-1 transition-colors"
          >
            <Filter size={13} className={filterStatus !== "all" ? "text-ember" : ""} />
            <span>Sort & Refine</span>
          </button>
        </div>

        {/* Refine Filters Drawer */}
        <AnimatePresence>
          {filterDrawerOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="neu-inset p-4 rounded-2xl border border-white/5 space-y-3 overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-text-3 uppercase tracking-wider">
                    Status Filter:
                  </span>
                  {["all", "processed", "needs_review", "conflict"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-mono capitalize transition-all",
                        filterStatus === st
                          ? "neu-button neu-inset text-ember font-bold"
                          : "text-text-3 hover:text-text-1"
                      )}
                    >
                      {st.replace("_", " ")}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-text-3 uppercase tracking-wider">
                    Sort Order:
                  </span>
                  <button
                    onClick={() => setSortBy("date")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-mono transition-all",
                      sortBy === "date"
                        ? "neu-button neu-inset text-ember font-bold"
                        : "text-text-3 hover:text-text-1"
                    )}
                  >
                    Most Recent
                  </button>
                  <button
                    onClick={() => setSortBy("duration")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-mono transition-all",
                      sortBy === "duration"
                        ? "neu-button neu-inset text-ember font-bold"
                        : "text-text-3 hover:text-text-1"
                    )}
                  >
                    Duration
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Responsive Grid of MeetingCards (Featured card spans 2 columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedMeetings.map((meeting, index) => {
            // Meeting 1 is featured (spans 2 columns)
            const isFeatured = index === 0;
            const extractedCount = data.decisions.filter((d) => d.meetingId === meeting.id).length;

            return (
              <MeetingCard
                key={meeting.id}
                meeting={{
                  ...meeting,
                  projectName: "Mobile v2 Launch",
                  projectCode: "MV2",
                  extractedDecisionsCount: extractedCount,
                }}
                isFeatured={isFeatured}
              />
            );
          })}
        </div>

        {displayedMeetings.length === 0 && (
          <div className="neu-inset p-12 rounded-2xl text-center space-y-2">
            <Layers size={32} className="text-text-3 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-text-2">No meetings match selected filter.</p>
            <p className="text-xs text-text-3">Try resetting the filter to 'all' to inspect historical memory.</p>
          </div>
        )}
      </section>
    </div>
  );
}
