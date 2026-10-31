"use client";

import { useEffect, useState } from "react";
import { useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

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
    <div
      className={cn(
        "neu-raised p-5 flex flex-col justify-between transition-all bg-surface border border-border-subtle",
        className
      )}
    >
      {/* Top-left semantic icon pill */}
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: `${color}18`,
            border: `1px solid ${color}35`,
          }}
        >
          <Icon size={19} color={color} strokeWidth={2.2} />
        </div>
      </div>

      {/* Large bold metric (36px font-mono --text-1) */}
      <div className="font-mono font-bold text-[36px] text-text-1 tracking-tight leading-none mb-2">
        {displayValue}
      </div>

      {/* Clean label */}
      <div className="text-text-3 font-medium text-xs tracking-wide">
        {label}
      </div>
    </div>
  );
}
