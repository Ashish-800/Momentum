"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Mic,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle,
  Loader,
  HelpCircle,
  ChevronDown,
  Layers,
  Sparkles,
} from "lucide-react";
import { TiltCard3D } from "@/components/three/TiltCard3D";
import { WaveformBars } from "@/components/closeloop/WaveformBars";
import {
  cn,
  formatDateIST,
  formatTimeIST,
  statusLabel,
  statusClass,
} from "@/lib/utils";
import type { Meeting } from "@/lib/db/schema";
import { useRouter } from "next/navigation";

interface MeetingCardProps {
  meeting: Meeting & {
    projectName?: string;
    projectCode?: string;
    extractedDecisionsCount?: number;
  };
  isFeatured?: boolean;
  onClick?: (id: string) => void;
  className?: string;
}

const MODE_ICONS = {
  debrief: Mic,
  roundtable: Users,
  import: FileText,
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#6E7787",
  processing: "#FFC247",
  needs_review: "#FF7A1A",
  conflict: "#FF4D6D",
  processed: "#4ADE80",
  failed: "#FF4D6D",
};

export function MeetingCard({
  meeting,
  isFeatured = false,
  onClick,
  className,
}: MeetingCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const ModeIcon = MODE_ICONS[meeting.captureMode] ?? FileText;
  const statusColor = STATUS_COLORS[meeting.status] ?? "#6E7787";
  const isConflict = meeting.status === "conflict";
  const highlights = (meeting.highlights as any)?.key_decisions || [];

  function handleClick() {
    if (onClick) onClick(meeting.id);
    else router.push(`/meetings/${meeting.id}`);
  }

  return (
    <TiltCard3D intensity={isFeatured ? 3 : 5} className={cn(isFeatured && "md:col-span-2")}>
      <motion.div
        className={cn(
          "neu-raised p-5 cursor-pointer relative overflow-hidden group transition-all",
          isConflict && "neu-conflict-glow",
          isFeatured && "border border-ember/30 shadow-[0_0_24px_-8px_rgba(255,122,26,0.25)]",
          className
        )}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onClick={handleClick}
        layout
      >
        {/* Subtle top edge status light */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: statusColor }}
        />

        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* Mode Icon */}
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105",
                isFeatured ? "bg-ember/15 border border-ember/30 text-ember" : "neu-inset text-text-2"
              )}
            >
              <ModeIcon size={18} />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                {meeting.projectCode && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-raised text-decision border border-white/5">
                    {meeting.projectCode}
                  </span>
                )}
                {isFeatured && (
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ember flex items-center gap-1">
                    <Sparkles size={10} />
                    Featured Session
                  </span>
                )}
              </div>
              <h3 className="font-display font-bold text-sm text-text-1 group-hover:text-ember transition-colors leading-snug">
                {meeting.title}
              </h3>
            </div>
          </div>

          {/* Semantic Status Chip */}
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex-shrink-0 border",
              statusClass(meeting.status)
            )}
          >
            {statusLabel(meeting.status)}
          </span>
        </div>

        {/* Recessed Deterministic Waveform Bars Visual */}
        <div className="my-3 flex items-center justify-between gap-4">
          <div className="flex-1 overflow-hidden">
            <WaveformBars
              active={isFeatured || expanded}
              barCount={isFeatured ? 28 : 16}
              height={isFeatured ? 32 : 22}
              color={isFeatured ? "#FF7A1A" : isConflict ? "#FF4D6D" : "#8C9CFF"}
            />
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-text-3 flex-shrink-0">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatDateIST(meeting.meetingDate)}
            </span>
            {meeting.durationMin && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {meeting.durationMin}m
              </span>
            )}
          </div>
        </div>

        {/* Smooth Expandable AI Summary & Top Highlights on Hover/Tap */}
        <AnimatePresence>
          {(expanded || isFeatured) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="pt-3 border-t border-white/5 text-xs text-text-2 space-y-2 overflow-hidden"
            >
              {meeting.summary && (
                <p className="line-clamp-2 leading-relaxed text-text-2">
                  {meeting.summary}
                </p>
              )}

              {highlights.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-text-3 uppercase tracking-wider font-semibold">
                    Top Highlights:
                  </div>
                  {highlights.slice(0, 3).map((h: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-text-3">
                      <span className="text-ember">•</span>
                      <span className="truncate">{h}</span>
                    </div>
                  ))}
                </div>
              )}

              {meeting.extractedDecisionsCount !== undefined && (
                <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-text-3">
                  <span className="text-decision">
                    {meeting.extractedDecisionsCount} decisions extracted & verified
                  </span>
                  <span className="text-ember group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Inspect memory →
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </TiltCard3D>
  );
}
