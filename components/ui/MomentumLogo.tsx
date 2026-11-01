"use client";

import React, { useId } from "react";

interface MomentumLogoProps {
  variant?: "icon" | "full";
  size?: number;
  className?: string;
  showWordmark?: boolean;
}

/**
 * MomentumLogo — Dynamic inline SVG brand component.
 * Reproduces the stylized geometric "M" mark from the Momentum brand identity:
 * - Multi-stop gradient palette (Cyan → Cobalt → Indigo → Sky Blue → Royal Blue → Violet → Pink → Warm Orange/Gold)
 * - Interlocking aerodynamic ribbon strokes with speed-cuts and negative-space diagonal gaps
 * - Light & Dark adaptive badge container and wordmark
 */
export function MomentumLogo({
  variant = "icon",
  size = 42,
  className = "",
  showWordmark = false,
}: MomentumLogoProps) {
  const rawId = useId();
  const id = rawId.replace(/:/g, "");

  const MMark = (
    <svg
      viewBox="0 0 64 64"
      width={Math.round(size * 0.74)}
      height={Math.round(size * 0.74)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="flex-shrink-0"
    >
      <defs>
        {/* Left Wing & Upper Left: Cyan -> Cobalt -> Indigo */}
        <linearGradient id={`${id}-cyan-blue`} x1="4" y1="20" x2="32" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00D2FF" />
          <stop offset="55%" stopColor="#1A4BFF" />
          <stop offset="100%" stopColor="#3B1D9E" />
        </linearGradient>

        {/* Center Speed Diagonal: Sky Blue -> Royal Blue */}
        <linearGradient id={`${id}-sky-blue`} x1="16" y1="16" x2="38" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>

        {/* Right Arch: Royal Blue -> Violet -> Magenta -> Orange */}
        <linearGradient id={`${id}-blue-pink`} x1="28" y1="16" x2="58" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="40%" stopColor="#7C3AED" />
          <stop offset="75%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#FF5500" />
        </linearGradient>

        {/* Inner Right Ribbon / Flame Accent: Violet -> Hot Pink -> Orange -> Amber */}
        <linearGradient id={`${id}-flame`} x1="34" y1="30" x2="48" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="35%" stopColor="#EC4899" />
          <stop offset="70%" stopColor="#FF5500" />
          <stop offset="100%" stopColor="#FFA800" />
        </linearGradient>
      </defs>

      <g transform="translate(4, 5) scale(0.88)">
        {/* 1. Upper Left Pillar */}
        <path
          d="M17 14 L27 14 L24 23 L14 23 Z"
          fill={`url(#${id}-cyan-blue)`}
        />

        {/* 2. Far-Left Speed Wing Slicing Horizontally */}
        <path
          d="M3 33 L18 28 C 24 26, 31 22, 36 14 L28 14 C 23 20, 16 24, 7 28 Z"
          fill={`url(#${id}-cyan-blue)`}
        />

        {/* 3. Lower Left Base / Hook */}
        <path
          d="M3 47 C 8 46, 12 43, 16 38 L22 38 C 17 44, 11 48, 5 48 Z"
          fill={`url(#${id}-cyan-blue)`}
        />

        {/* 4. Left Pillar Lower Segment */}
        <polygon
          points="17,35 24,24 29,24 21,38"
          fill={`url(#${id}-cyan-blue)`}
        />

        {/* 5. Center Diagonal Speed Ribbon */}
        <path
          d="M19 46 L33 22 L40 22 L26 46 Z"
          fill={`url(#${id}-sky-blue)`}
        />

        {/* 6. Right Outer Arch & Downward Shoulder */}
        <path
          d="M36 14 L49 14 C 54 14, 58 19, 56 25 L50 38 C 48 42, 45 44, 41 44 L43 38 C 45 38, 47 36, 48 33 L52 23 C 53 19, 50 17, 47 17 L38 17 Z"
          fill={`url(#${id}-blue-pink)`}
        />

        {/* 7. Inner Right Swoop / Warm Flame Ribbon */}
        <path
          d="M38 29 C 41 24, 45 25, 45 31 C 45 37, 40 46, 37 47 C 36 43, 36 36, 38 29 Z"
          fill={`url(#${id}-flame)`}
        />
      </g>
    </svg>
  );

  const BadgeContainer = (
    <div
      className="relative flex items-center justify-center rounded-[11px] transition-all"
      style={{
        width: size,
        height: size,
        backgroundColor: "var(--raised)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        flexShrink: 0,
      }}
    >
      {MMark}
    </div>
  );

  if (variant === "icon" && !showWordmark) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {BadgeContainer}
      </div>
    );
  }

  // variant === "full" or showWordmark === true
  const fontSize = Math.max(14, Math.round(size * 0.52));

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {BadgeContainer}
      <span
        className="font-extrabold italic tracking-tight select-none"
        style={{
          fontSize,
          letterSpacing: "-0.035em",
          color: "var(--text-1)",
          lineHeight: 1,
        }}
      >
        Momentum
      </span>
    </div>
  );
}
