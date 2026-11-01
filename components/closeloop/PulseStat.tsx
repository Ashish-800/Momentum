"use client";

import { useEffect, useState } from "react";
import { useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TiltCard3D } from "@/components/three/TiltCard3D";

interface PulseStatProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color?: string;
  className?: string;
}

export function PulseStat({
  label,
  value,
  icon: Icon,
  color = "#EA580C",
  className,
}: PulseStatProps) {
  // Animated count up with spring
  const springValue = useSpring(0, { stiffness: 120, damping: 20 });
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    springValue.set(value);
    const unsubscribe = springValue.on("change", (v) => {
      setDisplayValue(Math.round(v));
    });
    return () => unsubscribe();
  }, [value, springValue]);

  return (
    <TiltCard3D intensity={8} className="h-full rounded-[20px]">
      <div
        className={cn(
          "neu-raised p-5 flex flex-col justify-between h-full bg-surface border border-border-subtle preserve-3d transition-all",
          className
        )}
      >
        {/* Carved .neu-inset circular well for icon, floating in 3D */}
        <div className="flex items-center justify-between mb-4 preserve-3d">
          <div
            className="w-11 h-11 rounded-full neu-inset flex items-center justify-center transition-transform"
            style={{
              transform: "translateZ(28px)",
              background: "var(--neu-inset-bg)",
              boxShadow: "var(--neu-inset-shadow)",
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: `${color}18`,
                border: `1px solid ${color}35`,
              }}
            >
              <Icon size={16} color={color} strokeWidth={2.4} />
            </div>
          </div>
        </div>

        {/* Large bold metric (36px font-mono --text-1) floating in 3D */}
        <div
          className="font-mono font-bold text-[36px] text-text-1 tracking-tight leading-none mb-2 preserve-3d transition-transform"
          style={{ transform: "translateZ(28px)" }}
        >
          {displayValue}
        </div>

        {/* Clean label */}
        <div className="text-text-3 font-medium text-xs tracking-wide">
          {label}
        </div>
      </div>
    </TiltCard3D>
  );
}
