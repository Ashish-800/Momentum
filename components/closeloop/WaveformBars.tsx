"use client";
// components/closeloop/WaveformBars.tsx
// Animated audio waveform — 12 bars with staggered sine animation

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WaveformBarsProps {
  active?: boolean;
  barCount?: number;
  height?: number; // px max bar height
  color?: string;
  className?: string;
}

export function WaveformBars({
  active = false,
  barCount = 12,
  height = 28,
  color = "#FF7A1A",
  className,
}: WaveformBarsProps) {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <div
      className={cn("neu-inset flex items-center gap-[3px] px-3 py-2 rounded-xl", className)}
      style={{ minWidth: barCount * 7 + (barCount - 1) * 3 + 24 }}
    >
      {bars.map((i) => {
        const delay = (i / barCount) * 0.8;
        const maxH = active
          ? height * (0.4 + 0.6 * Math.sin((i / barCount) * Math.PI))
          : height * 0.15;

        return (
          <motion.div
            key={i}
            className="rounded-full flex-shrink-0"
            style={{
              width: 4,
              backgroundColor: color,
              originY: 1,
            }}
            animate={
              active
                ? {
                    scaleY: [0.3, 1, 0.4, 0.9, 0.3],
                    height: [height * 0.15, maxH, height * 0.2, maxH * 0.8, height * 0.15],
                  }
                : { height: height * 0.12, scaleY: 1 }
            }
            transition={
              active
                ? {
                    duration: 1.2,
                    repeat: Infinity,
                    delay,
                    ease: "easeInOut",
                  }
                : { duration: 0.3 }
            }
            initial={{ height: height * 0.12 }}
          />
        );
      })}
    </div>
  );
}

