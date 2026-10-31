// lib/utils.ts
// Shared utility functions

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── IST / Timezone formatting ─────────────────────────────────────────────────
const IST = "Asia/Kolkata";

export function toIST(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return toZonedTime(d, IST);
}

export function formatIST(
  date: Date | string,
  fmt: string = "d MMM yyyy, h:mm a"
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const zoned = toZonedTime(d, IST);
  return format(zoned, fmt) + " IST";
}

export function formatDateIST(date: Date | string): string {
  return formatIST(date, "d MMM yyyy");
}

export function formatTimeIST(date: Date | string): string {
  return formatIST(date, "h:mm a");
}

export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

// ── Status helpers ────────────────────────────────────────────────────────────
export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    discussion: "Discussion",
    proposed: "Proposed",
    active: "Active",
    superseded: "Superseded",
    rejected: "Rejected",
    draft: "Draft",
    processing: "Processing",
    needs_review: "Needs Review",
    conflict: "Conflict",
    processed: "Processed",
    failed: "Failed",
    approved: "Approved",
    synced: "Synced",
    in_progress: "In Progress",
    completed: "Completed",
    overdue: "Overdue",
  };
  return labels[status] ?? status;
}

export function statusClass(status: string): string {
  const classes: Record<string, string> = {
    proposed: "status-proposed",
    active: "status-active",
    conflict: "status-conflict",
    discussion: "status-discussion",
    superseded: "status-superseded",
    rejected: "status-rejected",
    approved: "status-approved",
    synced: "status-synced",
    overdue: "status-overdue",
    needs_review: "status-proposed",
    in_progress: "status-approved",
  };
  return classes[status] ?? "status-discussion";
}

// ── Priority helpers ──────────────────────────────────────────────────────────
export function priorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: "#6E7787",
    medium: "#FFC247",
    high: "#FF7A1A",
    critical: "#FF4D6D",
  };
  return colors[priority] ?? "#6E7787";
}

// ── Confidence display ────────────────────────────────────────────────────────
export function confidenceLabel(score: number): string {
  if (score >= 0.9) return "High";
  if (score >= 0.7) return "Medium";
  if (score >= 0.5) return "Low";
  return "Very Low";
}

export function confidenceColor(score: number): string {
  if (score >= 0.9) return "#4ADE80";
  if (score >= 0.7) return "#FFC247";
  if (score >= 0.5) return "#FF7A1A";
  return "#FF4D6D";
}

// ── Topic icon map ────────────────────────────────────────────────────────────
export function topicIcon(topic: string): string {
  const icons: Record<string, string> = {
    "launch-date": "📅",
    "platform-scope": "📱",
    budget: "💰",
    ownership: "👤",
    design: "🎨",
    qa: "🧪",
    marketing: "📣",
    other: "📌",
  };
  return icons[topic] ?? "📌";
}

// ── Conflict type label ───────────────────────────────────────────────────────
export function conflictTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    date: "Date Conflict",
    number: "Numeric Conflict",
    owner: "Ownership Conflict",
    scope: "Scope Conflict",
    reversal: "Reversal",
  };
  return labels[type] ?? "Conflict";
}

// ── Severity color ────────────────────────────────────────────────────────────
export function severityColor(severity: string): string {
  const colors: Record<string, string> = {
    low: "#FFC247",
    medium: "#FF7A1A",
    high: "#FF4D6D",
  };
  return colors[severity] ?? "#FFC247";
}

// ── String truncation ─────────────────────────────────────────────────────────
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "…";
}

// ── Initials from name ────────────────────────────────────────────────────────
export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

