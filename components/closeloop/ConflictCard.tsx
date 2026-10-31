"use client";
// components/closeloop/ConflictCard.tsx
// Compact conflict card for the Review page

import { motion } from "framer-motion";
import { AlertTriangle, GitBranch, ArrowRight } from "lucide-react";
import { TiltCard3D } from "@/components/three/TiltCard3D";
import {
  cn,
  conflictTypeLabel,
  severityColor,
  truncate,
  topicIcon,
} from "@/lib/utils";
import { ConfidenceRing } from "./ConfidenceRing";
import type { Conflict } from "@/lib/db/schema";

interface ConflictCardProps {
  conflict: Conflict & {
    oldStatement?: string;
    newStatement?: string;
    projectName?: string;
  };
  onResolve?: (id: string) => void;
  className?: string;
}

export function ConflictCard({
  conflict,
  onResolve,
  className,
}: ConflictCardProps) {
  const color = severityColor(conflict.severity);

  return (
    <TiltCard3D intensity={4}>
      <div
        className={cn("neu-raised overflow-hidden relative", className)}
      >
        {/* Severity left strip */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5"
          style={{ background: `linear-gradient(180deg, ${color}, ${color}80)` }}
        />

        <div className="pl-5 pr-4 py-4">
          {/* Type + confidence */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={13} style={{ color }} />
              <span
                className="text-[10px] font-mono font-bold uppercase tracking-wider"
                style={{ color }}
              >
                {conflictTypeLabel(conflict.conflictType)}
              </span>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  color,
                  background: `${color}15`,
                  border: `1px solid ${color}25`,
                }}
              >
                {conflict.severity}
              </span>
            </div>
            {conflict.confidence != null && (
              <ConfidenceRing score={conflict.confidence} size={32} strokeWidth={2} />
            )}
          </div>

          {/* Explanation */}
          <p className="text-xs text-text-2 leading-relaxed mb-3">
            {truncate(conflict.explanation, 160)}
          </p>

          {/* Old → New */}
          <div className="flex items-center gap-2 text-xs mb-3">
            {conflict.oldValue && (
              <div className="flex-1 neu-inset px-2 py-1.5 rounded-lg">
                <div className="text-[9px] text-text-3 mb-0.5">Active</div>
                <div className="font-mono text-text-2 truncate">
                  {conflict.oldValue}
                </div>
              </div>
            )}
            {conflict.oldValue && conflict.newValue && (
              <ArrowRight size={12} className="text-text-3 flex-shrink-0" />
            )}
            {conflict.newValue && (
              <div className="flex-1 neu-inset px-2 py-1.5 rounded-lg">
                <div className="text-[9px] text-text-3 mb-0.5">Proposed</div>
                <div
                  className="font-mono truncate font-semibold"
                  style={{ color }}
                >
                  {conflict.newValue}
                </div>
              </div>
            )}
          </div>

          {/* Resolve button */}
          {onResolve && (
            <button
              onClick={() => onResolve(conflict.id)}
              className="neu-button w-full py-2 text-xs font-semibold text-text-1 rounded-xl flex items-center justify-center gap-2"
              style={{ borderColor: `${color}30` }}
            >
              <GitBranch size={12} />
              Resolve Conflict
            </button>
          )}
        </div>
      </div>
    </TiltCard3D>
  );
}

