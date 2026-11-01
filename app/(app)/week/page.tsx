"use client";
// app/(app)/week/page.tsx — My Week Task Execution Board & Audit Drawer

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Kanban,
  List,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Bell,
  ArrowRight,
  Check,
  X,
  Layers,
  Sparkles,
  ShieldCheck,
  User,
} from "lucide-react";
import Link from "next/link";
import { EvidenceChip } from "@/components/closeloop/EvidenceChip";
import { getInMemoryStore, SEED_IDS } from "@/lib/db/seed";
import { formatDateIST, formatIST, cn } from "@/lib/utils";

type ViewMode = "kanban" | "list";

interface EnrichedTask {
  id: string;
  title: string;
  description?: string;
  ownerId?: string;
  ownerNameRaw?: string;
  deadlineText?: string;
  dueDate?: Date | string | null;
  priority: "critical" | "high" | "medium" | "low";
  status: "proposed" | "approved" | "synced" | "in_progress" | "blocked" | "overdue" | "completed" | "rejected";
  needsInput?: boolean;
  needsInputReason?: string | null;
  suggestedFix?: string | null;
  meetingId?: string;
  decisionId?: string | null;
  evidenceUtteranceIds?: string[];
  confidence?: number;
  externalRef?: { provider: string; card_id: string } | null;
  idempotencyKey?: string;
  owner?: any;
  meetingTitle?: string;
  meetingDate?: Date;
  decisionStatement?: string;
  reminders?: any[];
}

export default function WeekPage() {
  const [store, setStore] = useState(() => getInMemoryStore());
  const { people, meetings, decisions } = store;

  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Slide-over Drawer State
  const [selectedTask, setSelectedTask] = useState<EnrichedTask | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load and enrich tasks
  const enrichedTasks = useMemo<EnrichedTask[]>(() => {
    return (store.actionItems || []).map((t: any): EnrichedTask => {
      const owner = people.find((p: any) => p.id === t.ownerId);
      const meeting = meetings.find((m: any) => m.id === t.meetingId);
      const decision = decisions.find((d: any) => d.id === t.decisionId);
      const reminders = (store.reminders || []).filter((r: any) => r.actionItemId === t.id);

      return {
        ...t,
        owner,
        meetingTitle: meeting?.title,
        meetingDate: meeting?.meetingDate,
        decisionStatement: decision?.statement,
        reminders,
      } as EnrichedTask;
    });
  }, [store.actionItems, store.reminders, people, meetings, decisions]);

  // Filter tasks
  const filteredTasks = useMemo<EnrichedTask[]>(() => {
    return enrichedTasks.filter((t: EnrichedTask) => {
      if (selectedOwnerId !== "all" && t.ownerId !== selectedOwnerId) return false;
      if (selectedPriority !== "all" && t.priority !== selectedPriority) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = (t.description || "").toLowerCase().includes(q);
        const matchesOwner = (t.ownerNameRaw || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesOwner) return false;
      }
      return true;
    });
  }, [enrichedTasks, selectedOwnerId, selectedPriority, searchQuery]);

  // Show at most 4 clean task cards across the board
  const displayedTasks = useMemo<EnrichedTask[]>(() => {
    return filteredTasks.slice(0, 4);
  }, [filteredTasks]);

  // Lanes for Kanban
  const LANES = [
    {
      id: "todo",
      label: "To Do",
      color: "border-text-3/30 text-text-2",
      badgeColor: "bg-raised text-text-2",
      matcher: (t: EnrichedTask) =>
        t.status === "approved" || t.status === "synced" || t.status === "proposed",
    },
    {
      id: "in_progress",
      label: "In Progress",
      color: "border-ember/40 text-ember",
      badgeColor: "bg-ember/20 text-ember",
      matcher: (t: EnrichedTask) => t.status === "in_progress",
    },
    {
      id: "blocked",
      label: "Blocked / Overdue",
      color: "border-conflict/40 text-conflict",
      badgeColor: "bg-conflict/20 text-conflict",
      matcher: (t: EnrichedTask) =>
        t.status === "blocked" || t.status === "overdue",
    },
    {
      id: "completed",
      label: "Completed",
      color: "border-action/40 text-action",
      badgeColor: "bg-action/20 text-action",
      matcher: (t: EnrichedTask) => t.status === "completed",
    },
  ];

  // Update task status via PATCH /api/tasks/[id]
  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Refresh local store
        const updated = getInMemoryStore();
        setStore({ ...updated });
        setToastMessage(`Task updated to ${newStatus.replace("_", " ")}.`);
        setTimeout(() => setToastMessage(null), 3000);

        if (selectedTask?.id === taskId) {
          setSelectedTask((prev) => (prev ? { ...prev, status: newStatus as any } : null));
        }
      }
    } catch {
      setToastMessage("Failed to update task.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle completion
  const handleToggleComplete = (task: EnrichedTask) => {
    const nextStatus = task.status === "completed" ? "approved" : "completed";
    handleUpdateStatus(task.id, nextStatus);
  };

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-6">
      {/* ── Header Row ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-ember" />
            <span className="text-[11px] font-mono text-text-3 uppercase tracking-wider">
              Weekly Execution Commitments
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-text-1">
            My Week & <span className="font-accent text-action">Commitments</span>
          </h1>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="neu-inset p-1 rounded-xl flex items-center gap-1 border border-white/5">
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5",
                viewMode === "kanban"
                  ? "neu-raised text-ember font-bold shadow-sm"
                  : "text-text-3 hover:text-text-1"
              )}
            >
              <Kanban size={14} />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5",
                viewMode === "list"
                  ? "neu-raised text-ember font-bold shadow-sm"
                  : "text-text-3 hover:text-text-1"
              )}
            >
              <List size={14} />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="neu-raised px-4 py-2.5 rounded-xl border border-action/30 bg-action/10 text-action text-xs font-mono flex items-center gap-2"
          >
            <CheckCircle2 size={14} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filters Bar (De-cluttered: Team Switcher + View Mode) ── */}
      <div className="neu-raised p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-border-subtle bg-surface">
        {/* Team Member Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => setSelectedOwnerId("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all cursor-pointer",
              selectedOwnerId === "all"
                ? "bg-surface text-ember font-bold border border-ember/40 shadow-sm"
                : "btn-secondary text-text-3 hover:text-text-1"
            )}
          >
            All Team
          </button>
          {people.map((p: any) => (
            <button
              key={p.id}
              onClick={() => setSelectedOwnerId(p.id)}
              className={cn(
                "px-2.5 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer",
                selectedOwnerId === p.id
                  ? "bg-surface font-bold border border-border-strong shadow-sm"
                  : "btn-secondary text-text-3 hover:text-text-1"
              )}
              style={selectedOwnerId === p.id ? { color: p.accentColor || "#FF7A1A" } : {}}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: p.accentColor || "#FF7A1A" }}
              />
              <span>{p.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-recessed border border-border-subtle">
          <button
            onClick={() => setViewMode("kanban")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer",
              viewMode === "kanban"
                ? "bg-surface text-ember font-bold shadow-sm border border-border-subtle"
                : "text-text-3 hover:text-text-1"
            )}
          >
            <Kanban size={14} />
            <span>Kanban</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer",
              viewMode === "list"
                ? "bg-surface text-ember font-bold shadow-sm border border-border-subtle"
                : "text-text-3 hover:text-text-1"
            )}
          >
            <List size={14} />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* ── KANBAN VIEW ────────────────────────────────────────── */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {LANES.map((lane) => {
            const laneTasks: EnrichedTask[] = displayedTasks.filter(lane.matcher);

            return (
              <div
                key={lane.id}
                className="bg-recessed/40 p-3.5 rounded-2xl min-h-[500px] flex flex-col gap-3 border border-border-subtle"
              >
                {/* Lane Header */}
                <div className="flex items-center justify-between pb-2 border-b border-border-subtle px-1">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-xs text-text-1">
                      {lane.label}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold",
                      lane.id === "completed"
                        ? "pill-success"
                        : lane.id === "blocked"
                        ? "pill-conflict"
                        : lane.id === "in_progress"
                        ? "pill-warning"
                        : "bg-surface border border-border-subtle text-text-2"
                    )}
                  >
                    {laneTasks.length}
                  </span>
                </div>

                {/* Empty State */}
                {laneTasks.length === 0 && (
                  <div className="h-36 rounded-xl border border-dashed border-border-strong flex flex-col items-center justify-center text-xs text-text-3 font-mono">
                    <span>No tasks in {lane.label}</span>
                  </div>
                )}

                {/* Lane Cards */}
                <div className="space-y-3 flex-1">
                  {laneTasks.map((task: EnrichedTask) => (
                    <motion.div
                      key={task.id}
                      layoutId={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={cn(
                        "neu-raised p-4 rounded-xl cursor-pointer group transition-all relative overflow-hidden bg-surface border border-border-subtle hover:border-ember/40 shadow-sm",
                        task.priority === "critical" && "border-l-4 border-l-rose-500",
                        task.status === "completed" && "opacity-80"
                      )}
                    >
                      {/* Priority & Due Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase",
                            task.priority === "critical"
                              ? "pill-conflict"
                              : task.priority === "high"
                              ? "pill-warning"
                              : "bg-recessed text-text-2 border border-border-subtle"
                          )}
                        >
                          {task.priority}
                        </span>

                        {task.dueDate && (
                          <span
                            className={cn(
                              "text-[10px] font-mono flex items-center gap-1",
                              task.status === "overdue"
                                ? "text-rose-600 dark:text-rose-400 font-bold"
                                : "text-text-3"
                            )}
                          >
                            <Clock size={10} />
                            <span>{formatDateIST(task.dueDate)}</span>
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <div className="flex items-start gap-1.5 mb-3">
                        {task.status === "completed" && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">✓</span>
                        )}
                        <h4 className="text-[15px] font-semibold text-text-1 leading-snug group-hover:text-ember transition-colors">
                          {task.title}
                        </h4>
                      </div>

                      {/* Footer: Owner Avatar & Sync Tag */}
                      <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[10px] font-mono">
                        <div className="flex items-center gap-1.5">
                          {task.owner ? (
                            <span
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-black"
                              style={{ background: task.owner.accentColor || "#FF7A1A" }}
                              title={task.owner.name}
                            >
                              {task.owner.name.charAt(0)}
                            </span>
                          ) : (
                            <User size={12} className="text-text-3" />
                          )}
                          <span className="text-text-2 font-medium">
                            {task.owner?.name?.split(" ")[0] || task.ownerNameRaw || "Unassigned"}
                          </span>
                        </div>

                        {/* External Sync Badge */}
                        {task.externalRef ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded pill-success capitalize flex items-center gap-1 font-bold">
                            <span>{task.externalRef.provider}</span>
                          </span>
                        ) : (
                          <span className="text-[9px] text-text-3">Internal</span>
                        )}
                      </div>

                      {/* Quick Move Trigger on Hover */}
                      <div className="mt-2 pt-2 flex items-center justify-between border-t border-border-subtle opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleComplete(task);
                          }}
                          className="text-[10px] font-mono text-text-3 hover:text-emerald-600 flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={11} />
                          <span>{task.status === "completed" ? "Reopen" : "Mark Done"}</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── STRUCTURED LIST VIEW ───────────────────────────────── */}
      {viewMode === "list" && (
        <div className="neu-raised rounded-2xl overflow-hidden border border-white/5">
          <div className="divide-y divide-white/5">
            {displayedTasks.map((task: EnrichedTask) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="p-4 hover:bg-white/[0.02] cursor-pointer transition-colors flex items-center justify-between gap-4 group"
              >
                {/* Left: Checkbox + Title + Meta */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleComplete(task);
                    }}
                    className={cn(
                      "w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0",
                      task.status === "completed"
                        ? "bg-action border-action text-black"
                        : "border-white/20 hover:border-ember"
                    )}
                  >
                    {task.status === "completed" && <Check size={12} strokeWidth={3} />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase",
                          task.priority === "critical"
                            ? "bg-conflict/20 text-conflict"
                            : task.priority === "high"
                            ? "bg-warning/20 text-warning"
                            : "bg-raised text-text-3"
                        )}
                      >
                        {task.priority}
                      </span>

                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase",
                          task.status === "completed"
                            ? "bg-action/20 text-action"
                            : task.status === "overdue"
                            ? "bg-conflict/20 text-conflict"
                            : "bg-raised text-text-3"
                        )}
                      >
                        {task.status.replace("_", " ")}
                      </span>

                      {task.meetingTitle && (
                        <span className="text-[10px] font-mono text-text-3 truncate">
                          · {task.meetingTitle}
                        </span>
                      )}
                    </div>

                    <h4
                      className={cn(
                        "text-[15px] font-semibold text-text-1 group-hover:text-ember transition-colors",
                        task.status === "completed" && "line-through text-text-3"
                      )}
                    >
                      {task.title}
                    </h4>
                  </div>
                </div>

                {/* Right: Owner, Due Date, Sync & Arrow */}
                <div className="flex items-center gap-4 flex-shrink-0 text-xs font-mono text-text-3">
                  {task.owner && (
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ background: task.owner.accentColor || "#FF7A1A" }}
                      />
                      <span>{task.owner.name.split(" ")[0]}</span>
                    </div>
                  )}

                  {task.dueDate && (
                    <span
                      className={cn(
                        task.status === "overdue" ? "text-conflict font-bold" : "text-text-3"
                      )}
                    >
                      {formatDateIST(task.dueDate)}
                    </span>
                  )}

                  {task.externalRef && (
                    <span className="text-[9px] px-2 py-0.5 rounded bg-raised text-action border border-action/20 capitalize">
                      {task.externalRef.provider}
                    </span>
                  )}

                  <ChevronRight size={14} className="text-text-3 group-hover:text-ember transition-colors" />
                </div>
              </div>
            ))}

            {filteredTasks.length === 0 && (
              <div className="p-12 text-center text-xs text-text-3">
                No matching tasks found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SLIDE-OVER TASK DETAIL & AUDIT DRAWER ─────────────── */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-lg h-dvh bg-surface border-l border-border-strong p-6 flex flex-col justify-between overflow-y-auto neu-raised shadow-2xl text-text-1"
            >
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        selectedTask.priority === "critical"
                          ? "bg-rose-500"
                          : "bg-amber-500"
                      )}
                    />
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-3">
                      Task Audit & Provenance
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="p-1.5 rounded-lg btn-secondary text-text-3 hover:text-text-1 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Status Switcher Bar */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-text-3 uppercase tracking-wider font-bold">
                    Task Status
                  </span>
                  <div className="grid grid-cols-4 gap-1.5 neu-inset p-1 rounded-xl bg-recessed border border-border-subtle">
                    {[
                      { id: "approved", label: "To Do" },
                      { id: "in_progress", label: "In Progress" },
                      { id: "blocked", label: "Blocked" },
                      { id: "completed", label: "Done" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => handleUpdateStatus(selectedTask.id, st.id)}
                        disabled={isUpdating}
                        className={cn(
                          "py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer",
                          selectedTask.status === st.id
                            ? "bg-surface text-ember font-bold shadow-sm border border-border-subtle"
                            : "text-text-3 hover:text-text-1"
                        )}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Task Title & Description */}
                <div>
                  <h3 className="text-base font-display font-bold text-text-1 mb-2">
                    {selectedTask.title}
                  </h3>
                  {selectedTask.description && (
                    <p className="text-xs text-text-2 leading-relaxed font-ui bg-recessed p-3 rounded-xl border border-border-subtle">
                      {selectedTask.description}
                    </p>
                  )}
                </div>

                {/* Parent Decision Context */}
                {selectedTask.decisionStatement && (
                  <div className="p-3.5 rounded-xl border border-border-subtle bg-recessed space-y-1">
                    <span className="text-[10px] font-mono text-text-3 uppercase tracking-wider block font-bold">
                      Parent Institutional Decision
                    </span>
                    <p className="text-xs text-text-1 font-semibold">
                      {selectedTask.decisionStatement}
                    </p>
                  </div>
                )}

                {/* Meeting Provenance & Evidence Chips */}
                <div className="p-3.5 rounded-xl border border-border-subtle bg-recessed space-y-2">
                  <span className="text-[10px] font-mono text-text-3 uppercase tracking-wider block font-bold">
                    Source Meeting & Evidence
                  </span>
                  {selectedTask.meetingTitle && (
                    <div className="flex items-center justify-between text-xs font-mono text-text-2">
                      <span className="font-medium text-text-1">{selectedTask.meetingTitle}</span>
                      {selectedTask.meetingId && (
                        <Link
                          href={`/meetings/${selectedTask.meetingId}`}
                          className="text-ember hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <span>Open Meeting</span>
                          <ExternalLink size={10} />
                        </Link>
                      )}
                    </div>
                  )}

                  {Array.isArray(selectedTask.evidenceUtteranceIds) &&
                    selectedTask.evidenceUtteranceIds.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <EvidenceChip
                          utteranceId={selectedTask.evidenceUtteranceIds[0]}
                          speakerName="View Source Transcript"
                        />
                      </div>
                    )}
                </div>

                {/* Scheduled Reminders Engine */}
                <div className="p-3.5 rounded-xl border border-border-subtle bg-recessed space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Bell size={13} className="text-ember" />
                      <span className="text-[10px] font-mono text-text-3 uppercase tracking-wider font-bold">
                        Scheduled Time Machine Reminders
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-text-3">
                      {selectedTask.reminders?.length || 0} scheduled
                    </span>
                  </div>

                  {selectedTask.reminders && selectedTask.reminders.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedTask.reminders.map((r: any) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border-subtle text-xs font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                r.status === "fired" ? "bg-emerald-500" : "bg-amber-500"
                              )}
                            />
                            <span className="text-text-1 uppercase text-[10px] font-bold">
                              {r.leadHours}h Before
                            </span>
                            <span className="text-text-3 text-[11px]">
                              ({formatDateIST(r.remindAt)})
                            </span>
                          </div>
                          <span
                            className={cn(
                              "text-[9px] uppercase px-1.5 py-0.2 rounded font-bold",
                              r.status === "fired"
                                ? "pill-success"
                                : "pill-warning"
                            )}
                          >
                            {r.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-text-3 italic">
                      No automated reminders triggered yet. Advancing the Time Machine will evaluate deadlines.
                    </div>
                  )}
                </div>

                {/* External Sync & Idempotency Audit */}
                <div className="neu-inset p-3.5 rounded-xl border border-white/5 space-y-1 text-xs font-mono">
                  <span className="text-[10px] text-text-3 uppercase tracking-wider block">
                    Execution & Integration Payload
                  </span>
                  <div className="text-[11px] text-text-2">
                    <span className="text-text-3">Provider: </span>
                    <span className="font-semibold text-action">
                      {selectedTask.externalRef?.provider || "internal"}
                    </span>
                  </div>
                  {selectedTask.externalRef?.card_id && (
                    <div className="text-[11px] text-text-2">
                      <span className="text-text-3">External Card ID: </span>
                      <span>{selectedTask.externalRef.card_id}</span>
                    </div>
                  )}
                  {selectedTask.idempotencyKey && (
                    <div className="text-[11px] text-text-2 truncate">
                      <span className="text-text-3">Idempotency Key: </span>
                      <span className="text-text-3">{selectedTask.idempotencyKey}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Close Drawer Button */}
              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="w-full neu-button py-2.5 rounded-xl text-xs font-mono text-text-2 hover:text-text-1"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
