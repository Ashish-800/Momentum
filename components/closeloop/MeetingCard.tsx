"use client";

import { Calendar, Clock, ArrowRight, GitBranch, CheckSquare } from "lucide-react";
import { cn, formatDateIST } from "@/lib/utils";
import type { Meeting } from "@/lib/db/schema";
import { useRouter } from "next/navigation";
import { TiltCard3D } from "@/components/three/TiltCard3D";

interface MeetingCardProps {
  meeting: Meeting & {
    projectName?: string;
    projectCode?: string;
    extractedDecisionsCount?: number;
    extractedActionsCount?: number;
  };
  isFeatured?: boolean;
  onClick?: (id: string) => void;
  className?: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "conflict":
      return { label: "Conflict", className: "pill-conflict" };
    case "needs_review":
      return { label: "Needs Review", className: "pill-pending" };
    case "processed":
      return { label: "Processed", className: "pill-success" };
    case "processing":
      return { label: "Processing", className: "pill-warning" };
    default:
      return { label: status.replace("_", " "), className: "pill-info" };
  }
}

// Deterministic audio waveform heights based on meeting id string
function getWaveformPattern(id: string): number[] {
  const base = [35, 60, 85, 45, 95, 70, 30, 90, 100, 65, 40, 80, 55, 90, 75, 40, 60, 85, 30, 70, 95, 50];
  const charCode = id.charCodeAt(id.length - 1) || 0;
  return base.map((h, i) => Math.max(20, Math.min(100, (h + (charCode * (i + 1)) % 35))));
}

export function MeetingCard({
  meeting,
  onClick,
  className,
}: MeetingCardProps) {
  const router = useRouter();
  const badge = getStatusBadge(meeting.status);

  function handleClick() {
    if (onClick) onClick(meeting.id);
    else router.push(`/meetings/${meeting.id}`);
  }

  const duration = meeting.durationMin ? `${meeting.durationMin}m` : "55m";
  const dateFormatted = formatDateIST(meeting.meetingDate);
  const waveformHeights = getWaveformPattern(meeting.id);
  const decisionsCount = meeting.extractedDecisionsCount ?? 2;
  const tasksCount = meeting.extractedActionsCount ?? 3;

  return (
    <TiltCard3D intensity={8} className="h-full rounded-[20px]">
      <div
        onClick={handleClick}
        className={cn(
          "neu-raised p-5 cursor-pointer flex flex-col justify-between h-full group transition-all hover:border-ember/40 bg-surface preserve-3d",
          className
        )}
      >
        <div className="space-y-3.5">
          {/* Top: Status Pill & Date / Duration */}
          <div className="flex items-center justify-between gap-2 preserve-3d">
            <span
              className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider", badge.className)}
              style={{ transform: "translateZ(24px)" }}
            >
              {badge.label}
            </span>
            <div className="flex items-center gap-2 text-[11px] font-mono text-text-3">
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {dateFormatted}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {duration}
              </span>
            </div>
          </div>

          {/* Meeting Title */}
          <h3 className="font-display font-bold text-base text-text-1 group-hover:text-ember transition-colors leading-snug">
            {meeting.title}
          </h3>

          {/* Carved .neu-inset visual audio waveform bar */}
          <div
            className="neu-inset p-2.5 rounded-xl flex items-center justify-between gap-1 overflow-hidden"
            style={{
              background: "var(--neu-inset-bg)",
              boxShadow: "var(--neu-inset-shadow)",
            }}
          >
            {waveformHeights.map((h, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-ember/60 group-hover:bg-ember transition-colors"
                style={{ height: `${Math.round(h * 0.28)}px` }}
              />
            ))}
          </div>

          {/* 2 Compact visual metric pills */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-decision/10 text-decision border border-decision/20 text-[11px] font-mono font-semibold">
              <GitBranch size={11} />
              <span>{decisionsCount} Decisions</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-action/10 text-action border border-action/20 text-[11px] font-mono font-semibold">
              <CheckSquare size={11} />
              <span>{tasksCount} Tasks</span>
            </span>
          </div>
        </div>

        {/* Bottom Link */}
        <div
          className="pt-4 mt-3 border-t border-border-subtle flex items-center justify-between preserve-3d"
          style={{ transform: "translateZ(20px)" }}
        >
          <span className="text-[11px] font-mono text-text-3">
            {meeting.projectCode || "Mobile v2"}
          </span>
          <span className="text-xs font-semibold text-ember flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Inspect Meeting</span>
            <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </TiltCard3D>
  );
}
