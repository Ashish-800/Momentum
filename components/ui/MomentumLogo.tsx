"use client";

import React from "react";

interface MomentumLogoProps {
  variant?: "icon" | "mark" | "full";
  size?: number;
  className?: string;
  showWordmark?: boolean;
}

/**
 * MomentumLogo — Exact pixel artwork extracted directly from the Momentum brand sheet.
 * Renders the authentic pixel artwork cleanly with crisp edges:
 * - "icon": Favicon / Sidebar Squircle app icon (/momentum-icon.png)
 * - "mark": Standalone dynamic "M" mark (/momentum-mark.png)
 * - "full": Complete "M + Momentum" lockup (/momentum-full.png)
 */
export function MomentumLogo({
  variant = "icon",
  size = 42,
  className = "",
  showWordmark = false,
}: MomentumLogoProps) {
  // Full horizontal lockup ("M + Momentum")
  if (variant === "full" || showWordmark) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <img
          src="/momentum-full.png"
          alt="Momentum"
          height={size}
          style={{ height: size, width: "auto" }}
          className="object-contain select-none block"
          loading="eager"
        />
      </div>
    );
  }

  // Standalone dynamic "M" mark
  if (variant === "mark") {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <img
          src="/momentum-mark.png"
          alt="Momentum Mark"
          height={size}
          style={{ height: size, width: "auto" }}
          className="object-contain select-none block"
          loading="eager"
        />
      </div>
    );
  }

  // Default: variant === "icon" (Exact squircle app icon)
  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden rounded-[11px] shadow-sm ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <img
        src="/momentum-icon.png"
        alt="Momentum"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="object-contain select-none block rounded-[11px]"
        loading="eager"
      />
    </div>
  );
}
