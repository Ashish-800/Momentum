"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { TiltCard3D } from "@/components/three/TiltCard3D";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface PulseStatProps {
  label: string;
  value: number;
  delta?: string;
  deltaPositive?: boolean;
  icon: LucideIcon;
  color?: string;
  glow?: boolean;
  sparklineData?: number[];
  className?: string;
}

export function PulseStat({
  label,
  value,
  delta,
  deltaPositive = true,
  icon: Icon,
  color = "#FF7A1A",
  glow = false,
  sparklineData = [3, 5, 4, 7, 6, 8, 9],
  className,
}: PulseStatProps) {
  // Animated count up with spring
  const springValue = useSpring(0, { stiffness: 120, damping: 20 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    springValue.set(value);
    const unsubscribe = springValue.on("change", (v) => {
      setDisplayValue(Math.round(v));
    });
    return () => unsubscribe();
  }, [value, springValue]);

  // Generate SVG path for sparkline
  const max = Math.max(...sparklineData);
  const min = Math.min(...sparklineData);
  const range = max - min || 1;
  const width = 80;
  const height = 24;
  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <TiltCard3D intensity={5} className="flex-1 min-w-[200px]">
      <div
        className={cn(
          "neu-raised p-5 relative overflow-hidden group transition-all",
          glow && "neu-ember-glow",
          className
        )}
      >
        <div className="flex items-start justify-between mb-3">
          {/* Icon badge floating at translateZ(20px) */}
          <div
            data-depth="floating"
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
            style={{
              background: `${color}18`,
              border: `1px solid ${color}35`,
            }}
          >
            <Icon size={18} color={color} strokeWidth={2.2} />
          </div>

          {/* Recessed mini sparkline */}
          <div className="neu-inset px-2 py-1.5 rounded-lg flex items-center border border-white/5">
            <svg width={width} height={height} className="overflow-visible">
              <polyline
                fill="none"
                stroke={color}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                opacity="0.85"
              />
            </svg>
          </div>
        </div>

        {/* Big number counter */}
        <div className="font-display font-extrabold text-3xl text-text-1 tracking-tight leading-none mb-1">
          {displayValue}
        </div>

        {/* Label and Delta */}
        <div className="flex items-center justify-between text-xs mt-2">
          <span className="text-text-3 font-ui font-medium uppercase tracking-wider text-[11px]">
            {label}
          </span>
          {delta && (
            <span
              className="font-mono text-[11px] font-semibold flex items-center gap-0.5"
              style={{ color: deltaPositive ? "#4ADE80" : "#FF4D6D" }}
            >
              {deltaPositive ? "▲" : "▼"} {delta}
            </span>
          )}
        </div>
      </div>
    </TiltCard3D>
  );
}
