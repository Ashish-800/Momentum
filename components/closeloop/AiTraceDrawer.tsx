"use client";
// components/closeloop/AiTraceDrawer.tsx
// Collapsible AI pipeline trace panel — 6-stage progress display

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Cpu, CheckCircle, Loader, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
export type AiTraceItem = {
  id: string;
  meetingId?: string | null;
  stage: number;
  model?: string | null;
  promptVersion?: string | null;
  tokensIn?: number | null;
  tokensOut?: number | null;
  durationMs?: number | null;
  status: "pending" | "running" | "done" | "error";
  outputPreview?: any;
  createdAt?: Date;
};

interface AiTraceDrawerProps {
  traces?: AiTraceItem[];
  currentStage?: number; // 1–6 (for live pipeline)
  className?: string;
}

const STAGE_META = [
  { name: "Clean", description: "Normalize & correct transcript" },
  { name: "Attribute", description: "Speaker diarization & mapping" },
  { name: "Extract", description: "Decisions, actions, risks" },
  { name: "Resolve", description: "Resolve owners & deadlines" },
  { name: "Remember", description: "Embed & compare vs. history" },
  { name: "Stage", description: "Apply approval gate" },
];

function StageRow({
  idx,
  trace,
  isCurrent,
}: {
  idx: number;
  trace?: AiTraceItem;
  isCurrent: boolean;
}) {
  const meta = STAGE_META[idx];
  const status = trace?.status ?? (isCurrent ? "running" : "pending");

  return (
    <div className="flex items-center gap-3 py-2">
      {/* Stage number */}
      <div
        className={cn(
          "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold",
          status === "done" && "bg-action/15 text-action border border-action/20",
          status === "running" && "bg-ember/15 text-ember border border-ember/20",
          status === "error" && "bg-conflict/15 text-conflict border border-conflict/20",
          status === "pending" && "bg-raised text-text-3 border border-raised"
        )}
      >
        {status === "done" ? (
          <CheckCircle size={12} />
        ) : status === "running" ? (
          <Loader size={12} className="animate-spin" />
        ) : status === "error" ? (
          <AlertCircle size={12} />
        ) : (
          idx + 1
        )}
      </div>

      {/* Stage info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-1">{meta.name}</span>
          <span className="text-[10px] text-text-3">{meta.description}</span>
        </div>
      </div>

      {/* Metrics */}
      {trace && (
        <div className="text-[10px] font-mono text-text-3 flex-shrink-0 text-right">
          {trace.durationMs != null && (
            <span>{trace.durationMs}ms</span>
          )}
          {trace.tokensIn != null && (
            <span className="ml-2">{trace.tokensIn}↑{trace.tokensOut}↓</span>
          )}
        </div>
      )}
    </div>
  );
}

export function AiTraceDrawer({
  traces = [],
  currentStage,
  className,
}: AiTraceDrawerProps) {
  const [open, setOpen] = useState(false);

  const traceByStage = traces.reduce<Record<number, AiTraceItem>>((acc, t) => {
    acc[t.stage] = t;
    return acc;
  }, {});

  return (
    <div className={cn("neu-inset rounded-xl overflow-hidden", className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-xs text-text-2 hover:text-text-1 transition-colors"
      >
        <Cpu size={13} className="text-ember" />
        <span className="font-semibold">AI Pipeline Trace</span>
        {currentStage && (
          <span className="ml-1 text-[10px] font-mono text-ember">
            Stage {currentStage}/6
          </span>
        )}
        <span className="ml-auto text-text-3 font-mono text-[10px]">
          {traces.length} stages logged
        </span>
        <ChevronDown
          size={12}
          className={cn(
            "text-text-3 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="px-4 pb-3 border-t border-white/5">
              {STAGE_META.map((_, idx) => (
                <StageRow
                  key={idx}
                  idx={idx}
                  trace={traceByStage[idx + 1]}
                  isCurrent={currentStage === idx + 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

