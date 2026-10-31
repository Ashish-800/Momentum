"use client";

import React, { useState, useRef, useMemo } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { format, differenceInMinutes, addDays, subDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Clock, Calendar, CheckCircle2, Flag, Diamond, Sparkles } from "lucide-react";
import { cn, formatIST } from "@/lib/utils";

interface TimelineMeeting {
  id: string;
  title: string;
  date: Date;
  durationMin: number;
  status: string;
  isUpcoming?: boolean;
}

interface TimelineDecision {
  id: string;
  statement: string;
  date: Date;
  topic: string;
}

interface TimelineTask {
  id: string;
  title: string;
  dueDate: Date;
  owner: string;
  priority: string;
}

interface NowNeedleTimelineProps {
  simNow: Date;
  meetings: TimelineMeeting[];
  decisions: TimelineDecision[];
  tasks: TimelineTask[];
  onScrubTime?: (newDate: Date) => void;
  className?: string;
}

export function NowNeedleTimeline({
  simNow,
  meetings,
  decisions,
  tasks,
  onScrubTime,
  className,
}: NowNeedleTimelineProps) {
  const [zoomMode, setZoomMode] = useState<"day" | "week">("week");
  const [hoveredItem, setHoveredItem] = useState<{
    type: "meeting" | "decision" | "task" | "needle";
    title: string;
    detail: string;
    date: Date;
    x: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Define visible time range based on zoom
  const { startDate, endDate, totalMinutes } = useMemo(() => {
    let start: Date;
    let end: Date;
    if (zoomMode === "day") {
      start = subDays(simNow, 1);
      end = addDays(simNow, 2);
    } else {
      // 3-week window around simNow (from Oct 10 to Nov 18)
      start = new Date("2026-10-10T00:00:00+05:30");
      end = new Date("2026-11-20T23:59:59+05:30");
    }
    const minutes = differenceInMinutes(end, start);
    return { startDate: start, endDate: end, totalMinutes: Math.max(minutes, 1) };
  }, [zoomMode, simNow]);

  // Convert date to percentage position
  const getPercentage = (d: Date) => {
    const mins = differenceInMinutes(d, startDate);
    const pct = (mins / totalMinutes) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  const nowPct = getPercentage(simNow);

  // Drag-to-scrub spring
  const rawScrubPct = useMotionValue(nowPct);
  const scrubSpring = useSpring(rawScrubPct, { stiffness: 300, damping: 28 });

  const handleDrag = (e: any, info: any) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clampedX = Math.max(0, Math.min(info.point.x - rect.left, rect.width));
    const newPct = (clampedX / rect.width) * 100;
    rawScrubPct.set(newPct);

    // Calculate scrubbed date
    const scrubMinutes = (newPct / 100) * totalMinutes;
    const scrubbedDate = new Date(startDate.getTime() + scrubMinutes * 60 * 1000);
    onScrubTime?.(scrubbedDate);
  };

  return (
    <div className={cn("neu-raised p-6 relative overflow-hidden", className)}>
      {/* Header with Title and Day/Week Zoom Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-ember/15 border border-ember/30 flex items-center justify-center">
            <Clock size={16} className="text-ember" />
          </div>
          <div>
            <h2 className="font-display font-bold text-sm text-text-1">
              Project Timeline & 3D Now-Needle
            </h2>
            <div className="text-[11px] font-mono text-text-3">
              Anchor: {formatIST(simNow, "d MMM yyyy, HH:mm")}
            </div>
          </div>
        </div>

        {/* Day / Week Tactile Zoom Toggle */}
        <div className="neu-inset p-1 rounded-xl flex items-center gap-1 border border-white/5">
          <button
            onClick={() => setZoomMode("day")}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all",
              zoomMode === "day"
                ? "neu-button neu-inset text-ember shadow-sm"
                : "text-text-3 hover:text-text-1"
            )}
          >
            Day Zoom
          </button>
          <button
            onClick={() => setZoomMode("week")}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all",
              zoomMode === "week"
                ? "neu-button neu-inset text-ember shadow-sm"
                : "text-text-3 hover:text-text-1"
            )}
          >
            Full Horizon (Week)
          </button>
        </div>
      </div>

      {/* Recessed Horizontal Timeline Track */}
      <div
        ref={containerRef}
        className="relative h-28 neu-inset rounded-2xl border border-white/5 px-4 flex items-center select-none"
      >
        {/* Horizontal Center Guide Wire */}
        <div className="absolute left-4 right-4 h-0.5 bg-white/10 top-1/2 -translate-y-1/2" />

        {/* Extruded Meeting Blocks along timeline */}
        {meetings.map((m) => {
          const pct = getPercentage(m.date);
          const isPast = m.date < simNow;

          return (
            <div
              key={m.id}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer z-10 group"
              style={{ left: `${pct}%` }}
              onMouseEnter={(e) => {
                const rect = containerRef.current?.getBoundingClientRect();
                setHoveredItem({
                  type: "meeting",
                  title: m.title,
                  detail: `${m.durationMin}m duration · ${m.status}`,
                  date: m.date,
                  x: e.clientX - (rect?.left || 0),
                });
              }}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200 transform group-hover:scale-110",
                  isPast
                    ? "neu-raised text-text-3 border border-white/10"
                    : "neu-raised neu-ember-glow text-ember font-bold"
                )}
              >
                <Calendar size={13} />
              </div>
            </div>
          );
        })}

        {/* Confirmed Decisions: Floating 3D Diamonds (translateZ) */}
        {decisions.map((d) => {
          const pct = getPercentage(d.date);
          return (
            <div
              key={d.id}
              className="absolute top-4 -translate-x-1/2 cursor-pointer z-20 group"
              style={{ left: `${pct}%` }}
              onMouseEnter={(e) => {
                const rect = containerRef.current?.getBoundingClientRect();
                setHoveredItem({
                  type: "decision",
                  title: d.statement,
                  detail: `Topic: ${d.topic} (Confirmed Decision)`,
                  date: d.date,
                  x: e.clientX - (rect?.left || 0),
                });
              }}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div
                data-depth="floating"
                className="w-4 h-4 rounded-sm rotate-45 bg-decision/20 border border-decision text-decision flex items-center justify-center shadow-[0_0_10px_rgba(140,156,255,0.4)] group-hover:scale-125 transition-transform"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-decision" />
              </div>
            </div>
          );
        })}

        {/* Task Deadlines: Flag Markers */}
        {tasks.map((t) => {
          const pct = getPercentage(t.dueDate);
          const isCritical = t.priority === "critical";

          return (
            <div
              key={t.id}
              className="absolute bottom-4 -translate-x-1/2 cursor-pointer z-20 group"
              style={{ left: `${pct}%` }}
              onMouseEnter={(e) => {
                const rect = containerRef.current?.getBoundingClientRect();
                setHoveredItem({
                  type: "task",
                  title: t.title,
                  detail: `Owner: ${t.owner} · Priority: ${t.priority.toUpperCase()}`,
                  date: t.dueDate,
                  x: e.clientX - (rect?.left || 0),
                });
              }}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <div
                className={cn(
                  "p-1 rounded-md flex items-center gap-1 text-[10px] font-mono border transition-transform group-hover:scale-110",
                  isCritical
                    ? "bg-conflict/20 border-conflict text-conflict shadow-[0_0_10px_rgba(255,77,109,0.5)]"
                    : "bg-warning/20 border-warning text-warning"
                )}
              >
                <Flag size={10} />
              </div>
            </div>
          );
        })}

        {/* Glowing 3D Vertical NOW-NEEDLE Anchored at sim_now */}
        <motion.div
          drag="x"
          dragConstraints={containerRef}
          dragElastic={0.05}
          onDrag={handleDrag}
          style={{ left: `${nowPct}%` }}
          className="absolute top-0 bottom-0 -translate-x-1/2 z-30 flex flex-col items-center cursor-ew-resize group"
        >
          {/* Top Ember Pin Tag */}
          <div className="neu-button px-2 py-0.5 rounded-full bg-ember text-black text-[9px] font-mono font-extrabold uppercase shadow-[0_0_14px_#FF7A1A] flex items-center gap-1">
            <span>NOW</span>
          </div>

          {/* 3D Vertical Luminous Beam */}
          <div className="w-0.5 flex-1 bg-gradient-to-b from-ember via-ember-glow to-transparent shadow-[0_0_10px_#FF7A1A]" />

          {/* Bottom Needle Base */}
          <div className="w-2.5 h-2.5 rounded-full bg-ember shadow-[0_0_10px_#FF7A1A]" />
        </motion.div>

        {/* Rich Glass-Neumorphic Hover Popover */}
        <AnimatePresence>
          {hoveredItem && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute -top-16 z-50 pointer-events-none neu-raised p-2.5 rounded-xl border border-white/10 shadow-2xl backdrop-blur-xl"
              style={{ left: Math.max(10, Math.min(hoveredItem.x - 100, 600)) }}
            >
              <div className="text-[11px] font-display font-bold text-text-1 truncate max-w-xs">
                {hoveredItem.title}
              </div>
              <div className="text-[10px] font-mono text-text-3 flex items-center justify-between gap-4 mt-0.5">
                <span>{hoveredItem.detail}</span>
                <span className="text-ember font-semibold">{formatIST(hoveredItem.date, "d MMM, h:mm a")}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Date Markers Below Track */}
      <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-text-3">
        <span>{formatIST(startDate, "d MMM yyyy")}</span>
        <span className="text-ember font-bold flex items-center gap-1">
          <Sparkles size={11} />
          {formatIST(simNow, "d MMM yyyy, HH:mm")} IST
        </span>
        <span>{formatIST(endDate, "d MMM yyyy")}</span>
      </div>
    </div>
  );
}
