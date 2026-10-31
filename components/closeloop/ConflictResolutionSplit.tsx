"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Layers,
  GitBranch,
  Clock,
  User,
  Quote,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Flame,
} from "lucide-react";
import { TiltCard3D } from "@/components/three/TiltCard3D";
import { ConfidenceRing } from "@/components/closeloop/ConfidenceRing";
import { formatIST, initials, cn } from "@/lib/utils";

interface ConflictResolutionSplitProps {
  conflict: any;
  oldDecision: any;
  newDecision: any;
  onResolved: (resolution: string, conflictId: string) => void;
  className?: string;
}

export function ConflictResolutionSplit({
  conflict,
  oldDecision,
  newDecision,
  onResolved,
  className,
}: ConflictResolutionSplitProps) {
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedStatus, setResolvedStatus] = useState<string | null>(
    conflict.status !== "open" ? conflict.status : null
  );
  const [showDownstream, setShowDownstream] = useState(true);

  async function handleAction(action: string) {
    if (isResolving) return;
    setIsResolving(true);

    try {
      const res = await fetch(`/api/conflicts/${conflict.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution: action }),
      });

      if (!res.ok) throw new Error("Resolution request failed");

      setResolvedStatus(action);
      onResolved(action, conflict.id);
    } catch (err) {
      console.error("[Conflict Resolution Error]", err);
    } finally {
      setIsResolving(false);
    }
  }

  const isResolved = Boolean(resolvedStatus && resolvedStatus !== "open");

  const humanMeetingLabel = (meetingId?: string) => {
    if (!meetingId) return "Launch Planning (12 Oct)";
    if (meetingId.includes("launch_planning") || meetingId.includes("001")) return "Launch Planning (12 Oct)";
    if (meetingId.includes("mobile_v2") || meetingId.includes("002")) return "Mobile v2 Scope & Timeline Sync";
    return meetingId.replace(/^(meet_|mtg_)/, "").replace(/_/g, " ");
  };

  const humanActionLabel = (actId: string) => {
    if (actId.includes("arjun") || actId.includes("release_branch")) return "Arjun Rao — Cut release branch";
    if (actId.includes("rohan") || actId.includes("campaign_brief")) return "Rohan Gupta — Deliver launch campaign brief";
    if (actId.includes("meera") || actId.includes("design_freeze")) return "Meera Patel — Finalize design freeze";
    if (actId.includes("sana") || actId.includes("qa")) return "Sana Khan — End-to-end regression sign-off";
    return actId.replace(/^(act_|task_)/, "").replace(/_/g, " ");
  };

  return (
    <div className={cn("neu-raised rounded-2xl p-6 border border-border-subtle relative overflow-hidden bg-surface", className)}>
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-text-1">
                3D Split-Diff Conflict Radar
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold pill-conflict">
                {conflict.conflictType} clash • {conflict.severity} severity
              </span>
            </div>
            <p className="text-xs text-text-3 font-mono mt-0.5">
              Active memory policy contradiction requiring Human-in-the-Loop decision
            </p>
          </div>
        </div>

        {isResolved && (
          <div className="pill-success px-3 py-1 rounded-xl flex items-center gap-2 text-xs font-mono font-bold">
            <CheckCircle size={14} />
            <span>Resolved: {resolvedStatus?.replace("resolved_", "").replace("_", " ").toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* ── 3-Column Split Diff Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-stretch mb-6">
        {/* Left Card: Historical Active Decision (4 Cols) */}
        <div className="lg:col-span-4 neu-inset p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.03] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="px-2 py-0.5 rounded pill-success font-bold uppercase text-[10px]">
                Active Historical Memory
              </span>
              <span className="text-text-3 font-mono text-[11px] font-medium">
                {humanMeetingLabel(oldDecision?.meetingId)}
              </span>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase text-text-3 mb-1">Statement:</div>
              <p className="text-sm font-semibold text-text-1 leading-snug">
                {oldDecision?.statement || conflict.oldQuote || conflict.oldValue}
              </p>
            </div>

            {conflict.oldQuote && (
              <div className="p-2.5 rounded-xl bg-surface border border-border-subtle space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-3 uppercase">
                  <Quote size={10} />
                  <span>Verbatim Quote</span>
                </div>
                <p className="text-xs text-text-2 italic leading-relaxed">
                  "{conflict.oldQuote}"
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-border-subtle flex items-center justify-between text-xs font-mono">
            <span className="text-text-3">Effective Date:</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">
              {oldDecision?.effectiveDate ? String(oldDecision.effectiveDate).slice(0, 10) : conflict.oldValue || "15 Nov 2026"}
            </span>
          </div>
        </div>

        {/* Center Bridge: Visual Tension Bridge (3 Cols) */}
        <div className="lg:col-span-3 neu-raised p-4 rounded-2xl border border-border-subtle flex flex-col items-center justify-center text-center space-y-3 bg-surface">
          <div className="flex items-center gap-2">
            <ConfidenceRing score={conflict.confidence || 0.96} size={38} strokeWidth={3} />
            <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              {conflict.conflictType.toUpperCase()} CLASH
            </span>
          </div>

          <p className="text-xs text-text-2 leading-relaxed px-1">
            {conflict.explanation}
          </p>

          {/* Red/Green Diff Pill */}
          <div className="neu-inset px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-mono w-full justify-center border border-border-subtle">
            <span className="text-rose-600 dark:text-rose-400 font-bold line-through">
              {conflict.oldValue || "15 Nov 2026"}
            </span>
            <ArrowRight size={13} className="text-text-3 flex-shrink-0" />
            <span className="text-amber-700 dark:text-amber-400 font-bold">
              {conflict.newValue || "1 Dec 2026"}
            </span>
          </div>
        </div>

        {/* Right Card: New Proposed Decision (4 Cols) */}
        <div className="lg:col-span-4 neu-inset p-5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.03] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="px-2 py-0.5 rounded pill-warning font-bold uppercase text-[10px]">
                Proposed In Sync
              </span>
              <span className="text-text-3 font-mono text-[11px] font-semibold">
                Mobile v2 Sync (Today)
              </span>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase text-text-3 mb-1">Statement:</div>
              <p className="text-sm font-semibold text-text-1 leading-snug">
                {newDecision?.statement || conflict.newQuote || conflict.newValue}
              </p>
            </div>

            {conflict.newQuote && (
              <div className="p-2.5 rounded-xl bg-surface border border-border-subtle space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-700 dark:text-amber-400 uppercase">
                  <Quote size={10} />
                  <span>Verbatim Quote</span>
                </div>
                <p className="text-xs text-text-2 italic leading-relaxed">
                  "{conflict.newQuote}"
                </p>
              </div>
            )}

            {/* Collapsible Downstream Impact List */}
            {conflict.downstreamActionIds && conflict.downstreamActionIds.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setShowDownstream(!showDownstream)}
                  className="flex items-center justify-between w-full text-[11px] font-mono text-rose-600 dark:text-rose-400 hover:opacity-80 font-semibold cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <GitBranch size={12} />
                    <span>Downstream Affected Tasks ({conflict.downstreamActionIds.length})</span>
                  </span>
                  <ChevronDown
                    size={12}
                    className={cn("transition-transform", showDownstream && "rotate-180")}
                  />
                </button>

                {showDownstream && (
                  <div className="mt-2 space-y-1.5">
                    {conflict.downstreamActionIds.map((actId: string) => (
                      <div key={actId} className="text-[10px] font-mono p-2 rounded-lg bg-surface border border-border-subtle flex items-center justify-between">
                        <span className="text-text-1 font-medium truncate max-w-[200px]">{humanActionLabel(actId)}</span>
                        <span className="text-rose-600 dark:text-rose-400 font-semibold ml-2">Review Required</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-border-subtle flex items-center justify-between text-xs font-mono">
            <span className="text-text-3">Proposed Date:</span>
            <span className="text-amber-700 dark:text-amber-400 font-bold font-mono">
              {conflict.newValue || "1 Dec 2026"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ─────────── */}
      <div className="pt-4 border-t border-border-subtle">
        <div className="text-[10px] font-mono uppercase text-text-3 mb-3">
          Select Institutional Memory Resolution Action:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Action 1: Keep Historical 15 Nov */}
          <button
            disabled={isResolving}
            onClick={() => handleAction("resolved_keep_old")}
            className={cn(
              "btn-secondary p-3.5 rounded-xl text-left border transition-all cursor-pointer",
              resolvedStatus === "resolved_keep_old" && "ring-2 ring-emerald-500 bg-emerald-500/10"
            )}
          >
            <div className="flex items-center gap-2 mb-1 text-xs font-bold text-text-1">
              <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Keep 15 Nov (Reject Change)</span>
            </div>
            <p className="text-[11px] text-text-3 leading-snug">
              Preserve active 15 Nov commitment. Reject proposed shift.
            </p>
          </button>

          {/* Action 2: Supersede with 1 Dec */}
          <button
            disabled={isResolving}
            onClick={() => handleAction("resolved_supersede")}
            className={cn(
              "btn-primary p-3.5 rounded-xl text-left transition-all cursor-pointer shadow-sm",
              resolvedStatus === "resolved_supersede" && "ring-2 ring-orange-400"
            )}
          >
            <div className="flex items-center gap-2 mb-1 text-xs font-bold text-white">
              <Flame size={14} className="text-white" />
              <span>Accept 1 Dec (Supersede Decision)</span>
            </div>
            <p className="text-[11px] text-white/90 leading-snug">
              Promote 1 Dec proposal to active consensus. Archive historical date.
            </p>
          </button>

          {/* Action 3: Ask Priya / Escalate */}
          <button
            disabled={isResolving}
            onClick={() => handleAction("resolved_escalated")}
            className={cn(
              "btn-secondary p-3.5 rounded-xl text-left border transition-all cursor-pointer",
              resolvedStatus === "resolved_escalated" && "ring-2 ring-blue-500 bg-blue-500/10"
            )}
          >
            <div className="flex items-center gap-2 mb-1 text-xs font-bold text-text-1">
              <HelpCircle size={14} className="text-blue-500" />
              <span>Ask Priya / Escalate</span>
            </div>
            <p className="text-[11px] text-text-3 leading-snug">
              Flag for Priya Nair for executive sign-off before proceeding.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

