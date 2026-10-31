"use client";

import React, { useRef, useMemo, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type OrbState = "idle" | "listening" | "processing";

interface VoiceOrb3DProps {
  state?: OrbState;
  intensity?: number; // 0..1 for listening
  className?: string;
  size?: number; // width & height in px
}

// ── WebGL 3D Mesh Component ─────────────────────────────────
function OrbMesh({
  state,
  intensity = 0.5,
}: {
  state: OrbState;
  intensity: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef1 = useRef<THREE.Group>(null);
  const ringRef2 = useRef<THREE.Group>(null);

  // Dynamic distortion & speed based on state
  const distort = state === "listening" ? 0.4 + intensity * 0.45 : state === "processing" ? 0.35 : 0.2;
  const speed = state === "listening" ? 2 + intensity * 4 : state === "processing" ? 6 : 1.2;

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * (state === "processing" ? 3.0 : 0.4);
      meshRef.current.rotation.x += delta * 0.2;
    }
    if (ringRef1.current) {
      ringRef1.current.rotation.z += delta * (state === "processing" ? 4.5 : 0.8);
      ringRef1.current.rotation.x += delta * 0.5;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.z -= delta * (state === "processing" ? 3.5 : 0.6);
      ringRef2.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group>
      {/* Ambient and point lights */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={2.5} color="#FF7A1A" />
      <pointLight position={[-10, -10, -5]} intensity={1.8} color="#8C9CFF" />
      <pointLight position={[0, 0, 5]} intensity={state === "listening" ? 2.5 + intensity * 3 : 1.5} color="#FF5500" />

      {/* Main morphing obsidian & ember sphere */}
      <Float speed={speed} rotationIntensity={0.5} floatIntensity={0.4}>
        <mesh ref={meshRef} scale={1.35}>
          <icosahedronGeometry args={[1, 24]} />
          <MeshDistortMaterial
            color="#12161F"
            emissive="#FF7A1A"
            emissiveIntensity={state === "listening" ? 0.5 + intensity * 0.9 : state === "processing" ? 0.8 : 0.25}
            roughness={0.15}
            metalness={0.85}
            distort={distort}
            speed={speed}
          />
        </mesh>

        {/* Orbiting Energy Ring 1 */}
        <group ref={ringRef1}>
          <mesh rotation={[Math.PI / 3, 0, 0]}>
            <torusGeometry args={[1.75, 0.025, 16, 64]} />
            <meshStandardMaterial
              color="#FF7A1A"
              emissive="#FF7A1A"
              emissiveIntensity={state === "listening" ? 2 : 1}
              transparent
              opacity={0.8}
            />
          </mesh>
        </group>

        {/* Orbiting Energy Ring 2 */}
        <group ref={ringRef2}>
          <mesh rotation={[-Math.PI / 4, Math.PI / 6, 0]}>
            <torusGeometry args={[1.9, 0.015, 16, 64]} />
            <meshStandardMaterial
              color="#8C9CFF"
              emissive="#8C9CFF"
              emissiveIntensity={state === "processing" ? 2.5 : 0.8}
              transparent
              opacity={0.65}
            />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

// ── Fallback 2D/CSS 3D Sphere when WebGL context lost or unavailable ──
function FallbackOrb({
  state,
  intensity = 0.5,
  size = 120,
}: {
  state: OrbState;
  intensity: number;
  size: number;
}) {
  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {/* Outer ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            state === "listening"
              ? "radial-gradient(circle, rgba(255,85,0,0.45) 0%, rgba(255,122,26,0.15) 50%, transparent 80%)"
              : state === "processing"
              ? "radial-gradient(circle, rgba(52,216,171,0.4) 0%, rgba(140,156,255,0.15) 50%, transparent 80%)"
              : "radial-gradient(circle, rgba(255,122,26,0.2) 0%, rgba(18,22,31,0.1) 60%, transparent 80%)",
        }}
        animate={
          state === "listening"
            ? { scale: [1, 1.1 + intensity * 0.15, 1], opacity: [0.7, 1, 0.7] }
            : state === "processing"
            ? { rotate: 360, scale: [0.98, 1.05, 0.98] }
            : { scale: [1, 1.04, 1], opacity: [0.5, 0.8, 0.5] }
        }
        transition={{
          duration: state === "processing" ? 2 : 2.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Tactile Obsidian Sphere */}
      <motion.div
        className="relative rounded-full overflow-hidden shadow-2xl"
        style={{
          width: size * 0.7,
          height: size * 0.7,
          background: "radial-gradient(circle at 35% 35%, #222938 0%, #12161F 65%, #0B0E14 100%)",
          boxShadow: "inset 2px 2px 6px rgba(255,255,255,0.15), inset -4px -4px 10px #07090D, 0 10px 25px rgba(0,0,0,0.6)",
        }}
        animate={
          state === "listening"
            ? { scale: [1, 1.05 + intensity * 0.08, 1] }
            : { scale: [1, 1.02, 1] }
        }
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Core Ember Glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle at 50% 60%, rgba(255,122,26,0.6) 0%, rgba(255,85,0,0.2) 40%, transparent 70%)",
          }}
          animate={
            state === "listening"
              ? { opacity: [0.6, 1, 0.6] }
              : { opacity: [0.35, 0.7, 0.35] }
          }
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      </motion.div>

      {/* Orbiting rings in SVG */}
      <svg
        className={cn(
          "absolute inset-0 pointer-events-none",
          state === "processing" ? "animate-spin" : ""
        )}
        style={{ animationDuration: state === "processing" ? "3s" : "12s" }}
        viewBox="0 0 100 100"
      >
        <ellipse
          cx="50"
          cy="50"
          rx="44"
          ry="18"
          fill="none"
          stroke="#FF7A1A"
          strokeWidth="1.2"
          strokeDasharray="6 4"
          transform="rotate(-25 50 50)"
          opacity="0.8"
        />
        <ellipse
          cx="50"
          cy="50"
          rx="47"
          ry="14"
          fill="none"
          stroke="#8C9CFF"
          strokeWidth="0.9"
          transform="rotate(35 50 50)"
          opacity="0.6"
        />
      </svg>
    </div>
  );
}

// ── Main VoiceOrb3D with WebGL context detection ─────────────
export function VoiceOrb3D({
  state = "idle",
  intensity = 0.5,
  className,
  size = 120,
}: VoiceOrb3DProps) {
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setHasWebGL(Boolean(gl));
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (hasWebGL === false) {
    return (
      <div className={cn("inline-flex items-center justify-center", className)}>
        <FallbackOrb state={state} intensity={intensity} size={size} />
      </div>
    );
  }

  return (
    <div
      className={cn("relative inline-flex items-center justify-center select-none", className)}
      style={{ width: size, height: size }}
    >
      <Suspense fallback={<FallbackOrb state={state} intensity={intensity} size={size} />}>
        <Canvas
          camera={{ position: [0, 0, 4.5], fov: 45 }}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          style={{ width: "100%", height: "100%", pointerEvents: "none" }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener("webglcontextlost", (e) => {
              e.preventDefault();
              setHasWebGL(false);
            });
          }}
        >
          <OrbMesh state={state} intensity={intensity} />
        </Canvas>
      </Suspense>
    </div>
  );
}
