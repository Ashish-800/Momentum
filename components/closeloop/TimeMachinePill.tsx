"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, FastForward, ChevronDown, RotateCcw, Calendar, Zap, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { cn } from "@/lib/utils";

interface TimeMachinePillProps {
  simNow: Date;
  onAdvance?: (hours: number | string) => Promise<void>;
  className?: string;
}

const ADVANCE_JUMPS = [
  { label: "+1 Hour", jump: "+1h", hours: 1, desc: "Advance clock by 60 mins" },
  { label: "+1 Day", jump: "+1d", hours: 24, desc: "Fast-forward 24 hours" },
  { label: "+1 Week", jump: "+1w", hours: 168, desc: "Forward 7 full days" },
  { label: "Jump to Mon 9:00 AM", jump: "next_monday_9am", hours: 44.5, desc: "Fire reminders & generate Weekly Digests", highlight: true },
];

export function TimeMachinePill({
  simNow,
  onAdvance,
  className,
}: TimeMachinePillProps) {
  const [open, setOpen] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [lastNotification, setLastNotification] = useState<string | null>(null);

  const IST = "Asia/Kolkata";
  const zonedDate = toZonedTime(simNow, IST);
  const dayStr = format(zonedDate, "EEE");
  const dateStr = format(zonedDate, "d MMM yyyy");
  const timeStr = format(zonedDate, "HH:mm");

  async function handleJump(jump: string) {
    if (advancing) return;
    setAdvancing(true);
    setOpen(false);

    try {
      const res = await fetch("/api/clock/advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jump }),
      });

      if (res.ok) {
        const data = await res.json();
        if (onAdvance) {
          await onAdvance(jump);
        }
        window.dispatchEvent(new CustomEvent("momentum:clock-advanced", { detail: data }));
        window.dispatchEvent(new CustomEvent("closeloop:clock-advanced", { detail: data }));
        setLastNotification(
          `Clock advanced to ${format(toZonedTime(new Date(data.simNow), IST), "d MMM, HH:mm")} IST (${data.firedRemindersCount} fired reminders)`
        );
        setTimeout(() => setLastNotification(null), 4000);
      }
    } catch (err) {
      console.error("[Time Machine Advance Error]", err);
    } finally {
      setAdvancing(false);
    }
  }

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "neu-button flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono transition-all",
          advancing && "animate-pulse border-ember/60 shadow-[0_0_16px_rgba(255,122,26,0.3)]"
        )}
        title="Time Machine Simulation Clock (IST)"
      >
        <Clock
          size={13}
          className={cn("text-ember", advancing && "animate-spin")}
        />
        <span className="text-text-2">
          <span className="text-text-3 font-semibold mr-1">{dayStr},</span>
          {dateStr}
        </span>
        <span className="text-text-1 font-bold tabular-nums">{timeStr}</span>
        <span className="text-text-3 text-[9px] font-semibold">IST</span>
        <ChevronDown
          size={11}
          className={cn("text-text-3 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 right-0 neu-raised p-3 rounded-2xl min-w-[280px] z-50 border border-white/10 shadow-2xl space-y-2 backdrop-blur-md bg-bg-1/95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/5 px-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-ember font-bold uppercase tracking-wider">
                <FastForward size={12} />
                <span>Time Machine Controls</span>
              </div>
              <span className="text-[9px] font-mono text-text-3">Asia/Kolkata</span>
            </div>

            <div className="space-y-1">
              {ADVANCE_JUMPS.map(({ label, jump, desc, highlight }) => (
                <button
                  key={jump}
                  onClick={() => handleJump(jump)}
                  className={cn(
                    "w-full text-left p-2.5 rounded-xl text-xs flex flex-col gap-0.5 transition-all cursor-pointer",
                    highlight
                      ? "neu-raised border border-ember/30 bg-ember/10 hover:border-ember"
                      : "neu-flat hover:neu-raised border border-transparent hover:border-white/5"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("font-semibold font-mono", highlight ? "text-ember font-bold" : "text-text-1")}>
                      {label}
                    </span>
                    <FastForward size={11} className={highlight ? "text-ember" : "text-text-3"} />
                  </div>
                  <span className="text-[10px] text-text-3 font-mono">{desc}</span>
                </button>
              ))}
            </div>

            {/* Reset baseline button */}
            <div className="pt-2 border-t border-white/5">
              <button
                onClick={() => handleJump("reset")}
                className="w-full text-left p-2 rounded-xl text-[11px] font-mono text-text-3 hover:text-text-1 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw size={11} />
                <span>Reset to Baseline (Sat, 31 Oct 12:43 IST)</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating feedback alert */}
      <AnimatePresence>
        {lastNotification && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed top-20 right-6 z-50 neu-raised px-4 py-2.5 rounded-xl border border-ember/30 bg-bg-1 text-xs font-mono text-ember flex items-center gap-2 shadow-2xl"
          >
            <Sparkles size={13} />
            <span>{lastNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
