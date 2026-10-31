"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Edit2,
  AlertTriangle,
  Clock,
  User,
  Quote,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Lock,
} from "lucide-react";
import { ConfidenceRing } from "@/components/closeloop/ConfidenceRing";
import { EvidenceChip } from "@/components/closeloop/EvidenceChip";
import { initials, cn } from "@/lib/utils";

interface ApprovalCardProps {
  item: any;
  itemType: "decision" | "action";
  people: any[];
  isFocused: boolean;
  hasConflictLock: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onAcceptSuggestedFix: (id: string) => void;
  onSaveInlineEdit: (id: string, updates: any) => void;
  onOpenEvidence?: (utteranceId: string) => void;
  className?: string;
}

export function ApprovalCard({
  item,
  itemType,
  people,
  isFocused,
  hasConflictLock,
  onApprove,
  onReject,
  onAcceptSuggestedFix,
  onSaveInlineEdit,
  onOpenEvidence,
  className,
}: ApprovalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(item.title || item.statement || "");
  const [editedOwnerId, setEditedOwnerId] = useState(item.ownerId || "");
  const [editedDueDate, setEditedDueDate] = useState(
    item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 10) : ""
  );
  const [editedPriority, setEditedPriority] = useState(item.priority || "medium");

  const owner = people.find((p) => p.id === (item.ownerId || editedOwnerId));
  const isApproved = item.status === "approved";
  const isRejected = item.status === "rejected";

  function handleSaveEdit() {
    onSaveInlineEdit(item.id, {
      title: itemType === "action" ? editedTitle : undefined,
      statement: itemType === "decision" ? editedTitle : undefined,
      ownerId: editedOwnerId,
      dueDate: editedDueDate || undefined,
      priority: editedPriority,
    });
    setIsEditing(false);
  }

  return (
    <motion.div
      layout
      tabIndex={0}
      className={cn(
        "neu-raised p-5 rounded-2xl border transition-all duration-200 relative group bg-surface",
        isFocused ? "border-ember ring-2 ring-ember/30 shadow-md" : "border-border-subtle",
        hasConflictLock && "border-rose-500/40 bg-rose-500/[0.02]",
        isApproved && "border-emerald-500/40 bg-emerald-500/[0.02]",
        isRejected && "opacity-40 line-through",
        className
      )}
    >
      {/* ── Conflict Dependency Lock Banner ─────────────────── */}
      {hasConflictLock && (
        <div className="mb-3.5 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300 font-mono font-semibold">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-rose-600 dark:text-rose-400 animate-pulse" />
            <span>Blocked by unresolved conflict — resolve above first</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-rose-600 dark:text-rose-400 font-bold">Gate Locked</span>
        </div>
      )}

      {/* ── Top Metadata Bar ─────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface text-text-2 border border-border-subtle font-bold">
            {itemType === "decision" ? (item.topic || "Decision") : `${item.priority || "Medium"} Priority`}
          </span>

          {item.isTaskUpdate && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded pill-info font-semibold">
              Updates Previous Task
            </span>
          )}

          {isApproved && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full pill-success font-bold uppercase">
              Approved · Ready to Sync
            </span>
          )}

          {isRejected && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface text-text-3 uppercase border border-border-subtle">
              Rejected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {item.confidence != null && (
            <ConfidenceRing score={item.confidence} size={30} strokeWidth={2.5} />
          )}
        </div>
      </div>

      {/* ── Task Diff Badge (when updating an existing task) ── */}
      {item.updatesActionId && (
        <div className="mb-2.5 flex items-center gap-2 text-xs font-mono">
          <span className="text-text-3 line-through">Old due: 28 Oct</span>
          <ArrowRight size={11} className="text-text-3" />
          <span className="text-ember font-bold">New due: {item.deadlineText || "2 Nov"}</span>
        </div>
      )}

      {/* ── Content / Title / Statement (Inline Editable) ───── */}
      {isEditing ? (
        <div className="space-y-3 mb-4 neu-inset p-3 rounded-xl border border-border-subtle">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-text-1 outline-none border-b border-border-subtle pb-1"
            placeholder="Item title or statement..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {/* Owner dropdown */}
            <div>
              <label className="text-[10px] font-mono text-text-3 block mb-1">Owner</label>
              <select
                value={editedOwnerId}
                onChange={(e) => setEditedOwnerId(e.target.value)}
                className="w-full px-2 py-1 rounded-lg text-text-2 text-xs outline-none bg-surface border border-border-subtle"
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due date picker */}
            {itemType === "action" && (
              <div>
                <label className="text-[10px] font-mono text-text-3 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={editedDueDate}
                  onChange={(e) => setEditedDueDate(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg text-text-2 text-xs outline-none bg-surface border border-border-subtle"
                />
              </div>
            )}

            {/* Priority picker */}
            {itemType === "action" && (
              <div>
                <label className="text-[10px] font-mono text-text-3 block mb-1">Priority</label>
                <select
                  value={editedPriority}
                  onChange={(e) => setEditedPriority(e.target.value as any)}
                  className="w-full px-2 py-1 rounded-lg text-text-2 text-xs outline-none bg-surface border border-border-subtle"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs text-text-3 hover:text-text-1 px-2 py-1 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="btn-primary px-3 py-1 rounded-lg text-xs font-bold cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-3">
          <p className="text-sm font-semibold text-text-1 leading-snug">
            {item.title || item.statement}
          </p>
          {item.description && (
            <p className="text-xs text-text-2 leading-relaxed mt-1">
              {item.description}
            </p>
          )}
        </div>
      )}

      {/* ── Needs-Input Guard (Amber Recessed Box) ───────────── */}
      {item.needsInput && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2 mb-3.5">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-800 dark:text-amber-300">
            <AlertTriangle size={13} />
            <span>Missing Input Required Before Approval:</span>
          </div>
          <p className="text-xs text-text-2 leading-relaxed">
            {item.needsInputReason || "Relative deadline depends on another task without explicit date."}
          </p>
          {item.suggestedFix && (
            <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-mono text-text-3">
                Suggested Fix: <span className="text-amber-800 dark:text-amber-300 font-bold">{item.suggestedFix}</span>
              </span>
              <button
                onClick={() => onAcceptSuggestedFix(item.id)}
                className="btn-secondary px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-amber-800 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1 cursor-pointer"
              >
                <span>Accept Suggested: Thu, 5 Nov</span>
                <Check size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Footer Information & Quick Action Buttons ────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border-subtle text-xs font-mono">
        <div className="flex items-center gap-3">
          {/* Owner Avatar & Name */}
          <div className="flex items-center gap-1.5 text-text-3">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{
                background: `${owner?.accentColor ?? "#FF7A1A"}25`,
                color: owner?.accentColor ?? "#FF7A1A",
                border: `1px solid ${owner?.accentColor ?? "#FF7A1A"}40`,
              }}
            >
              {initials(owner?.name || item.ownerNameRaw || "P")}
            </div>
            <span className="text-text-1 font-semibold">{owner?.name || item.ownerNameRaw || "Unassigned"}</span>
          </div>

          {/* Due date badge */}
          {item.deadlineText && (
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Clock size={11} />
              {item.deadlineText}
            </span>
          )}

          {/* Evidence chip */}
          {item.evidenceUtteranceIds?.[0] && (
            <EvidenceChip
              utteranceId={item.evidenceUtteranceIds[0]}
              quote={item.title || item.statement}
              onClick={() => onOpenEvidence?.(item.evidenceUtteranceIds[0])}
            />
          )}
        </div>

        {/* ── Tactile Triage Buttons ── */}
        <div className="flex items-center gap-2">
          {/* Edit button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-secondary p-2 rounded-xl text-text-3 hover:text-text-1 cursor-pointer"
            title="Edit Inline (E)"
          >
            <Edit2 size={13} />
          </button>

          {/* Reject button */}
          <button
            onClick={() => onReject(item.id)}
            className={cn(
              "btn-secondary p-2 rounded-xl text-text-3 hover:text-rose-600 transition-colors cursor-pointer",
              isRejected && "bg-rose-500/20 text-rose-600 border-rose-500/30"
            )}
            title="Reject Item (X)"
          >
            <X size={14} />
          </button>

          {/* Approve button (Blocked if hasConflictLock OR needsInput) */}
          <button
            disabled={hasConflictLock || item.needsInput || isApproved}
            onClick={() => onApprove(item.id)}
            className={cn(
              "px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer text-xs",
              hasConflictLock || item.needsInput
                ? "opacity-40 cursor-not-allowed bg-surface text-text-3 border border-border-subtle"
                : isApproved
                ? "pill-success font-bold"
                : "btn-primary shadow-sm"
            )}
            title={
              hasConflictLock
                ? "Blocked by unresolved conflict"
                : item.needsInput
                ? "Resolve missing input first"
                : "Approve (Cmd+Enter)"
            }
          >
            <Check size={13} />
            <span>{isApproved ? "Approved" : "Approve"}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

