"use client";
// components/closeloop/ConfidenceRing.tsx
// SVG ring displaying AI confidence score 0–100%

import { motion } from "framer-motion";
import { cn, confidenceColor, confidenceLabel } from "@/lib/utils";

interface ConfidenceRingProps {
  score: number; // 0.0–1.0
  size?: number; // px diameter
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceRing({
  score,
  size = 48,
  strokeWidth = 3,
  showLabel = true,
  className,
}: ConfidenceRingProps) {
  const pct = Math.round(score * 100);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;
  
  // High contrast color depending on score
  const color =
    score >= 0.85
      ? "var(--action)"
      : score >= 0.7
      ? "var(--warning)"
      : "var(--conflict)";

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      title={`AI Confidence: ${pct}% (${confidenceLabel(score)})`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      {showLabel && (
        <span
          className="absolute font-mono text-[10px] font-bold"
          style={{ color }}
        >
          {pct}%
        </span>
      )}
    </div>
  );
}

