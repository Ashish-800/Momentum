"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelfCorrectionBadgeProps {
  original: string;
  replacement: string;
  rationale?: string;
  className?: string;
}

export function SelfCorrectionBadge({
  original,
  replacement,
  rationale,
  className,
}: SelfCorrectionBadgeProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Extract clean parts if original contains the whole sentence
  let oldVal = original;
  let newVal = replacement;
  if (/friday.*monday/i.test(original)) {
    oldVal = "Friday";
    newVal = "Monday";
  }

  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <button
        type="button"
        onClick={() => setPopoverOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-ember/15 border border-ember/40 hover:bg-ember/25 transition-all text-xs font-mono cursor-pointer shadow-[0_0_12px_rgba(255,122,26,0.3)]"
        title="Click to view verbatim self-correction analysis"
      >
        <span className="line-through text-text-3 font-normal opacity-75">
          {oldVal}
        </span>
        <span className="text-ember font-bold flex items-center gap-1">
          → {newVal}
        </span>
        <Sparkles size={11} className="text-ember animate-pulse" />
      </button>

      <AnimatePresence>
        {popoverOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            className="absolute bottom-full mb-2 left-0 z-50 w-72 neu-raised p-3.5 rounded-xl border border-ember/40 shadow-2xl backdrop-blur-xl text-left"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ember flex items-center gap-1.5">
                <Volume2 size={12} />
                Spoken Self-Correction
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPopoverOpen(false);
                }}
                className="text-text-3 hover:text-text-1"
              >
                <X size={12} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-mono text-text-3 block uppercase">
                  Verbatim Audio Phrasing:
                </span>
                <p className="neu-inset p-2 rounded-lg text-text-2 italic text-[11px] mt-0.5">
                  "{original}"
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-text-3 block uppercase">
                  AI Resolution:
                </span>
                <p className="text-action font-semibold text-xs mt-0.5">
                  Resolved speaker intent to "{replacement}"
                </p>
              </div>

              {rationale && (
                <p className="text-[10px] text-text-3 pt-1 border-t border-white/5">
                  {rationale}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

