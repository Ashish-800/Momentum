"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ShieldCheck, Flame, Eye, Compass, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConflictRadar3DProps {
  conflicts: any[];
  onSelectConflict: (conflict: any) => void;
  selectedConflictId?: string;
  className?: string;
}

export function ConflictRadar3D({
  conflicts,
  onSelectConflict,
  selectedConflictId,
  className,
}: ConflictRadar3DProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Position nodes on radar polar coordinates
  const nodes = conflicts.map((c, idx) => {
    const angle = (idx / Math.max(conflicts.length, 1)) * 2 * Math.PI - Math.PI / 2;
    const radius = c.severity === "high" ? 110 : c.severity === "medium" ? 75 : 45;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    const color =
      c.severity === "high"
        ? "#FF4D6D"
        : c.severity === "medium"
        ? "#FFC247"
        : "#38BDF8";

    return {
      ...c,
      x,
      y,
      color,
      radius,
    };
  });

  return (
    <div
      className={cn(
        "neu-inset rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[420px] border border-white/5",
        className
      )}
      style={{ perspective: "1000px" }}
    >
      {/* 3D Perspective Grid Background */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgba(255,122,26,0.15) 0%, transparent 70%), linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 32px 32px, 32px 32px",
          transform: "rotateX(25deg)",
        }}
      />

      {/* Radar Center Title */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <Compass size={14} className="text-ember animate-spin-slow" />
        <span className="text-[11px] font-mono text-text-3 uppercase tracking-wider">
          3D Conflict Spatial Radar
        </span>
      </div>

      {/* Radar Coordinate Container */}
      <div
        className="relative w-[340px] h-[340px] flex items-center justify-center transition-transform duration-500"
        style={{ transform: "rotateX(20deg)" }}
      >
        {/* Concentric Recency Rings */}
        <div className="absolute w-[280px] h-[280px] rounded-full border border-white/10" />
        <div className="absolute w-[200px] h-[200px] rounded-full border border-white/10 border-dashed" />
        <div className="absolute w-[120px] h-[120px] rounded-full border border-white/10" />

        {/* Axis Crosshairs */}
        <div className="absolute w-full h-[1px] bg-white/5" />
        <div className="absolute h-full w-[1px] bg-white/5" />

        {/* 3D Rotating Radar Sweep Line */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          className="absolute w-[140px] h-[140px] origin-bottom-right"
          style={{
            top: 30,
            left: 30,
            background: "conic-gradient(from 180deg at 100% 100%, rgba(255,122,26,0.25) 0deg, transparent 60deg)",
          }}
        />

        {/* Radar Center Hub */}
        <div className="absolute w-4 h-4 rounded-full bg-ember shadow-[0_0_12px_#FF7A1A]" />

        {/* Glowing 3D Nodes */}
        {nodes.map((n) => {
          const isSelected = selectedConflictId === n.id;
          const isHovered = hoveredId === n.id;

          return (
            <motion.div
              key={n.id}
              onClick={() => onSelectConflict(n)}
              onMouseEnter={() => setHoveredId(n.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="absolute cursor-pointer z-20 group"
              style={{
                transform: `translate(${n.x}px, ${n.y}px)`,
              }}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
            >
              <div className="relative flex items-center justify-center">
                {/* Outer ripple */}
                <div
                  className="absolute w-8 h-8 rounded-full animate-ping opacity-40"
                  style={{ background: n.color }}
                />

                {/* Node Pill */}
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center shadow-lg transition-all",
                    isSelected ? "ring-4 ring-white" : ""
                  )}
                  style={{
                    background: n.color,
                    boxShadow: `0 0 16px ${n.color}`,
                  }}
                >
                  <AlertTriangle size={10} className="text-black font-bold" />
                </div>

                {/* Tooltip on hover */}
                {(isHovered || isSelected) && (
                  <div
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap neu-raised px-2.5 py-1.5 rounded-lg text-[10px] font-mono z-30 border border-white/20 shadow-xl pointer-events-none"
                    style={{ color: n.color }}
                  >
                    <div className="font-bold uppercase">{n.conflictType} Clash</div>
                    <div className="text-text-2 text-[9px]">Severity: {n.severity}</div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Radar Legend */}
      <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[10px] font-mono text-text-3 border-t border-white/5 pt-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-conflict" />
            <span>High Severity</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning" />
            <span>Medium</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-decision" />
            <span>Resolved / Low</span>
          </span>
        </div>
        <span>Click node to inspect</span>
      </div>
    </div>
  );
}

