"use client";

import { useRef, ReactNode, useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCard3DProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  intensity?: number; // max tilt degrees (default 8)
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function TiltCard3D({
  children,
  className,
  disabled = false,
  intensity = 8,
  onClick,
  style,
}: TiltCard3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rawElevate = useMotionValue(0);

  // Exact requested spring physics: stiffness 280, damping 22
  const springX = useSpring(rawX, { stiffness: 280, damping: 22 });
  const springY = useSpring(rawY, { stiffness: 280, damping: 22 });
  const springElevate = useSpring(rawElevate, { stiffness: 280, damping: 22 });

  // ±8deg tilt on X and Y axes
  const rotateX = useTransform(springY, [-0.5, 0.5], [intensity, -intensity]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-intensity, intensity]);
  const translateY = useTransform(springElevate, [0, 1], [0, -4]);

  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (disabled || prefersReducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rawX.set(px);
    rawY.set(py);

    const glareX = ((e.clientX - rect.left) / rect.width) * 100;
    const glareY = ((e.clientY - rect.top) / rect.height) * 100;
    setGlarePos({ x: glareX, y: glareY, opacity: 0.16 });
  }

  function handleMouseEnter() {
    if (disabled || prefersReducedMotion) return;
    setIsHovered(true);
    rawElevate.set(1);
  }

  function handleMouseLeave() {
    rawX.set(0);
    rawY.set(0);
    rawElevate.set(0);
    setIsHovered(false);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  }

  if (disabled || prefersReducedMotion) {
    return (
      <div className={cn("relative", className)} onClick={onClick} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ perspective: "1000px", ...style }}
      className="relative"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          y: translateY,
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "preserve-3d relative transition-shadow duration-200 rounded-[inherit]",
          className
        )}
      >
        {/* Dynamic radial specular glare across the surface */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] z-20 transition-opacity duration-300"
          style={{
            opacity: glarePos.opacity,
            background: `radial-gradient(circle 280px at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.22), transparent 75%)`,
          }}
          aria-hidden
        />
        {children}
      </motion.div>
    </div>
  );
}
