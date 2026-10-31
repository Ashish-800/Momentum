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

  return (
    <div className={cn("neu-raised rounded-2xl p-6 border border-white/5 relative overflow-hidden", className)}>
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-conflict/15 border border-conflict/30 flex items-center justify-center text-conflict">
            <AlertTriangle size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-text-1">
                3D Split-Diff Conflict Radar
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-conflict/15 text-conflict border border-conflict/30">
                {conflict.conflictType} clash • {conflict.severity} severity
              </span>
            </div>
            <p className="text-xs text-text-3 font-mono mt-0.5">
              Active memory policy contradiction requiring Human-in-the-Loop decision
            </p>
          </div>
        </div>

        {isResolved && (
          <div className="neu-inset px-3 py-1 rounded-xl flex items-center gap-2 text-xs font-mono text-action border border-action/30 bg-action/10 font-bold">
            <CheckCircle size={14} />
            <span>Resolved: {resolvedStatus?.replace("resolved_", "").replace("_", " ").toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* ── 3-Column Split Diff Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-stretch mb-6">
        {/* Left Card: Historical Active Decision (4 Cols) */}
        <div className="lg:col-span-4 neu-inset p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-action/15 text-action border border-action/30 font-bold uppercase text-[10px]">
                Active Historical Memory
              </span>
              <span className="text-text-3 font-mono text-[11px]">
                {oldDecision?.meetingId || "Launch Planning (12 Oct)"}
              </span>
            </div>

            <div>
              <div className="text-[10px] font-mono uppercase text-text-3 mb-1">Statement:</div>
              <p className="text-sm font-semibold text-text-1 leading-snug">
                {oldDecision?.statement || conflict.oldQuote || conflict.oldValue}
              </p>
            </div>

            {conflict.oldQuote && (
              <div className="neu-flat p-2.5 rounded-xl border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-3 uppercase">
                  <Quote size={10} />
                  <span>Verbatim Quote</span>
                </div>
                <p className="text-xs text-text-3 italic leading-relaxed">
                  "{conflict.oldQuote}"
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono">
            <span className="text-text-3">Effective Date:</span>
            <span className="text-text-2 font-bold font-mono">
              {oldDecision?.effectiveDate ? String(oldDecision.effectiveDate).slice(0, 10) : conflict.oldValue || "15 Nov 2026"}
            </span>
          </div>
        </div>

        {/* Center Bridge: Visual Tension Bridge (3 Cols) */}
        <div className="lg:col-span-3 neu-raised p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center space-y-3">
          <div className="flex items-center gap-2">
            <ConfidenceRing score={conflict.confidence || 0.96} size={38} strokeWidth={3} />
            <span className="text-xs font-mono font-bold text-conflict uppercase tracking-wider">
              {conflict.conflictType.toUpperCase()} CLASH
            </span>
          </div>

          <p className="text-xs text-text-2 leading-relaxed px-1">
            {conflict.explanation}
          </p>

          {/* Red/Green Diff Pill */}
          <div className="neu-inset px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-mono w-full justify-center border border-white/5">
            <span className="text-conflict font-bold line-through">
              {conflict.oldValue || "15 Nov 2026"}
            </span>
            <ArrowRight size={13} className="text-text-3 flex-shrink-0" />
            <span className="text-action font-bold">
              {conflict.newValue || "1 Dec 2026"}
            </span>
          </div>
        </div>

        {/* Right Card: New Proposed Decision (4 Cols) */}
        <div className="lg:col-span-4 neu-inset p-5 rounded-2xl border border-ember/30 bg-ember/[0.02] flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-ember/20 text-ember border border-ember/30 font-bold uppercase text-[10px]">
                Proposed In Sync
              </span>
              <span className="text-ember font-mono text-[11px] font-semibold">
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
              <div className="neu-flat p-2.5 rounded-xl border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-ember uppercase">
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
                  className="flex items-center justify-between w-full text-[11px] font-mono text-conflict hover:text-conflict/80 font-semibold"
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
                  <div className="mt-2 space-y-1 pl-2 border-l border-conflict/30">
                    {conflict.downstreamActionIds.map((actId: string) => (
                      <div key={actId} className="text-[10px] font-mono text-text-3 flex items-center gap-1">
                        <span>•</span>
                        <span className="text-text-2 font-medium truncate">{actId}</span>
                        <span className="text-conflict">(deadline review required)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono">
            <span className="text-text-3">Proposed Date:</span>
            <span className="text-ember font-bold font-mono">
              {conflict.newValue || "1 Dec 2026"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Four Concrete Resolution Action Buttons ─────────── */}
      <div className="pt-4 border-t border-white/5">
        <div className="text-[10px] font-mono uppercase text-text-3 mb-3">
          Select Institutional Memory Resolution Action:
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Action 1: Keep Historical */}
          <button
            disabled={isResolving}
            onClick={() => handleAction("resolved_keep_old")}
            className={cn(
              "p-3 rounded-xl text-left border transition-all cursor-pointer",
              resolvedStatus === "resolved_keep_old"
                ? "neu-inset border-action/50 bg-action/10"
                : "neu-raised hover:border-action/40 border-white/5"
            )}
          >
            <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-text-1">
              <ShieldCheck size={14} className="text-action" />
              <span>Keep Historical</span>
            </div>
            <p className="text-[11px] text-text-3 leading-snug">
              Retain 15 Nov timeline. Reject new proposal and preserve active commitment.
            </p>
          </button>

          {/* Action 2: Supersede with New */}
          <button
            disabled={isResolving}
            onClick={() => handleAction("resolved_supersede")}
            className={cn(
              "p-3 rounded-xl text-left border transition-all cursor-pointer",
              resolvedStatus === "resolved_supersede"
                ? "neu-inset border-ember/50 bg-ember/10"
                : "neu-raised hover:border-ember/40 border-white/5"
            )}
          >
            <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-ember">
              <Flame size={14} className="text-ember" />
              <span>Supersede with New</span>
            </div>
            <p className="text-[11px] text-text-3 leading-snug">
              Promote 1 Dec proposal to active. Archive historical decision as superseded.
            </p>
          </button>

          {/* Action 3: Escalate to Owner */}
          <button
            disabled={isResolving}
            onClick={() => handleAction("resolved_escalated")}
            className={cn(
              "p-3 rounded-xl text-left border transition-all cursor-pointer",
              resolvedStatus === "resolved_escalated"
                ? "neu-inset border-blue-500/50 bg-blue-500/10"
                : "neu-raised hover:border-blue-500/40 border-white/5"
            )}
          >
            <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-text-1">
              <HelpCircle size={14} className="text-blue-400" />
              <span>Escalate / Ask Owner</span>
            </div>
            <p className="text-[11px] text-text-3 leading-snug">
              Assign high-priority question to Priya Nair for executive sign-off.
            </p>
          </button>

          {/* Action 4: Mark Both Compatible */}
          <button
            disabled={isResolving}
            onClick={() => handleAction("resolved_both_valid")}
            className={cn(
              "p-3 rounded-xl text-left border transition-all cursor-pointer",
              resolvedStatus === "resolved_both_valid"
                ? "neu-inset border-purple-500/50 bg-purple-500/10"
                : "neu-raised hover:border-purple-500/40 border-white/5"
            )}
          >
            <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-text-1">
              <Layers size={14} className="text-purple-400" />
              <span>Mark Both Valid</span>
            </div>
            <p className="text-[11px] text-text-3 leading-snug">
              Keep both active (e.g. dual-track pilot + simultaneous general release).
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

