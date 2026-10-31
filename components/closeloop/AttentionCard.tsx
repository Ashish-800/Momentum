"use client";
// components/closeloop/AttentionCard.tsx
// Conflict / blocker attention banner with severity glow

import { motion } from "framer-motion";
import { AlertTriangle, X, ChevronRight } from "lucide-react";
import { cn, conflictTypeLabel, severityColor, formatDateIST, truncate } from "@/lib/utils";
import { ConfidenceRing } from "./ConfidenceRing";
import type { Conflict } from "@/lib/db/schema";

interface AttentionCardProps {
  conflict: Conflict & {
    oldDecisionStatement?: string;
    newDecisionStatement?: string;
    projectName?: string;
  };
  onResolve?: (id: string) => void;
  onDismiss?: (id: string) => void;
  className?: string;
}

export function AttentionCard({
  conflict,
  onResolve,
  onDismiss,
  className,
}: AttentionCardProps) {
  const color = severityColor(conflict.severity);
  const isHigh = conflict.severity === "high";

  return (
    <motion.div
      className={cn(
        "neu-raised relative overflow-hidden",
        isHigh && "neu-conflict-glow",
        className
      )}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      layout
    >
      {/* Severity indicator strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[inherit]"
        style={{ background: color }}
      />

      <div className="pl-4 pr-4 py-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ background: `${color}18`, border: `1px solid ${color}30` }}
          >
            <AlertTriangle size={14} color={color} strokeWidth={2.5} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  color,
                  background: `${color}18`,
                  border: `1px solid ${color}25`,
                }}
              >
                {conflict.conflictType.toUpperCase()} · {conflict.severity.toUpperCase()}
              </span>
              {conflict.projectName && (
                <span className="text-[10px] text-text-3 font-mono">
                  {conflict.projectName}
                </span>
              )}
            </div>
            <h3 className="text-sm font-display font-semibold text-text-1 leading-snug">
              {conflictTypeLabel(conflict.conflictType)}
            </h3>
          </div>

          <div className="flex-shrink-0 flex items-center gap-2">
            {conflict.confidence != null && (
              <ConfidenceRing score={conflict.confidence} size={36} strokeWidth={2.5} />
            )}
            {onDismiss && (
              <button
                onClick={() => onDismiss(conflict.id)}
                className="text-text-3 hover:text-text-2 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Explanation */}
        <p className="text-xs text-text-2 leading-relaxed mb-3">
          {truncate(conflict.explanation, 180)}
        </p>

        {/* Old vs New value */}
        {(conflict.oldValue || conflict.newValue) && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 neu-inset px-3 py-2 rounded-lg">
              <div className="text-[9px] text-text-3 uppercase tracking-wider mb-0.5">
                Active
              </div>
              <div className="text-xs font-mono text-text-2">
                {conflict.oldValue ?? "—"}
              </div>
            </div>
            <ChevronRight size={14} className="text-text-3 flex-shrink-0" />
            <div className="flex-1 neu-inset px-3 py-2 rounded-lg">
              <div className="text-[9px] text-text-3 uppercase tracking-wider mb-0.5">
                Proposed
              </div>
              <div
                className="text-xs font-mono font-semibold"
                style={{ color }}
              >
                {conflict.newValue ?? "—"}
              </div>
            </div>
          </div>
        )}

        {/* Action row */}
        {onResolve && (
          <button
            onClick={() => onResolve(conflict.id)}
            className="neu-button w-full py-2 px-4 text-xs font-semibold text-text-1 rounded-xl"
            style={{
              border: `1px solid ${color}30`,
            }}
          >
            Review & Resolve →
          </button>
        )}
      </div>
    </motion.div>
  );
}

