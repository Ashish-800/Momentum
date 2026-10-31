"use client";

import { Calendar, Clock, ArrowRight } from "lucide-react";
import { cn, formatDateIST } from "@/lib/utils";
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

  const duration = meeting.durationMin ? `${meeting.durationMin}m` : "45m";
  const dateFormatted = formatDateIST(meeting.meetingDate);

  return (
    <div
      onClick={handleClick}
      className={cn(
        "neu-raised p-5 cursor-pointer flex flex-col justify-between group transition-all hover:border-ember/40 bg-surface",
        className
      )}
    >
      <div className="space-y-3">
        {/* Top: Status Pill & Date / Duration */}
        <div className="flex items-center justify-between gap-2">
          <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider", badge.className)}>
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

        {/* 2-line summary on all cards */}
        <p className="text-xs text-text-2 leading-relaxed line-clamp-2">
          {meeting.summary || "Team debrief with extracted decisions, commitments, and conflict analysis."}
        </p>
      </div>

      {/* Bottom Link */}
      <div className="pt-4 mt-3 border-t border-border-subtle flex items-center justify-between">
        <span className="text-[11px] font-mono text-text-3">
          {meeting.projectCode || "Mobile v2"}
        </span>
        <span className="text-xs font-semibold text-ember flex items-center gap-1 group-hover:translate-x-1 transition-transform">
          <span>Inspect Meeting</span>
          <ArrowRight size={13} />
        </span>
      </div>
    </div>
  );
}
