"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  Layers,
  Mic,
  Cpu,
  CheckSquare,
  Clock,
  Compass,
  ArrowRight,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface DemoStep {
  step: number;
  title: string;
  tagline: string;
  description: string;
  targetHref: string;
  expectedObservation: string;
  icon: any;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    title: "Command Center & Baseline Memory",
    tagline: "Inspect locked decisions before the new meeting",
    description:
      "Notice Northstar Labs baseline memory: Launch Date is officially locked for 15 Nov, and Android ships first. Observe active decisions and the Now-Needle timeline.",
    targetHref: "/home",
    expectedObservation: "Decision DEC-001 sets 15 Nov launch date (Priya Nair).",
    icon: Layers,
  },
  {
    step: 2,
    title: "3D Voice Studio & Wispr Dictation",
    tagline: "Live ferrofluid orb and speech cleanup",
    description:
      "Load the Demo Recap text in Voice Studio. Watch the 3D Voice Orb react dynamically to typing velocity. Notice Meera's Friday→Monday self-correction and the biryani digression strip.",
    targetHref: "/studio",
    expectedObservation: "Orb ripples in real-time; self-corrections highlighted.",
    icon: Mic,
  },
  {
    step: 3,
    title: "Intelligence Core & Conflict Engine",
    tagline: "6-stage schema-bound extraction & memory diff",
    description:
      "Click 'Run Extraction Pipeline' to execute Stages 1–6. Observe the hybrid conflict detection engine flag 2 cross-meeting conflicts against locked memory with rose alerts.",
    targetHref: "/studio",
    expectedObservation: "2 Conflicts Detected: Launch Date (1 Dec vs 15 Nov) and Platform Scope.",
    icon: Cpu,
  },
  {
    step: 4,
    title: "Review Tray & 3D Split Resolution",
    tagline: "Human-in-the-loop gate & server sync",
    description:
      "Resolve the Launch Date conflict in the 3D Split-Diff card by choosing 'Accept & Supersede'. Accept the suggested fix for Arjun's 5 Nov deadline, then execute 2-step Sync.",
    targetHref: "/review",
    expectedObservation: "Sync writes to internal board and schedules 24h & 2h reminders.",
    icon: CheckSquare,
  },
  {
    step: 5,
    title: "Time Machine & Automated Weekly Digests",
    tagline: "Advance clock to fire reminders and digests",
    description:
      "Use the Time Machine pill at the bottom-left to jump to Next Monday 9:00 AM IST. Watch deadline reminders fire in the notification bell and fresh Weekly Digests generate for all 5 team members.",
    targetHref: "/digest",
    expectedObservation: "Notification bell rings; personalized executive briefs generated.",
    icon: Clock,
  },
  {
    step: 6,
    title: "AI Institutional Memory with Evidence",
    tagline: "Cross-meeting grounded retrieval with verbatim citations",
    description:
      "Open the AI Memory panel on the right. Ask: 'Did our launch date change and why?' Inspect the verbatim Evidence Chips citing both Launch Planning and Tech Workshop.",
    targetHref: "/home",
    expectedObservation: "Answer cites DEC-001 (15 Nov) superseded by 1 Dec with clickable transcript chips.",
    icon: Sparkles,
  },
];

interface GuidedDemoCoachProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
}

export function GuidedDemoCoach({ isOpen, onClose, onOpen }: GuidedDemoCoachProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const step = DEMO_STEPS[currentStepIndex];
  const StepIcon = step.icon;
  const isLast = currentStepIndex === DEMO_STEPS.length - 1;
  const progressPercent = ((currentStepIndex + 1) / DEMO_STEPS.length) * 100;

  // Listen to custom event to launch tour from anywhere
  useEffect(() => {
    const handleStartTour = () => {
      setCurrentStepIndex(0);
      setIsMinimized(false);
      if (onOpen) onOpen();
    };
    window.addEventListener("momentum:start-demo-tour", handleStartTour);
    window.addEventListener("closeloop:start-demo-tour", handleStartTour);
    return () => {
      window.removeEventListener("momentum:start-demo-tour", handleStartTour);
      window.removeEventListener("closeloop:start-demo-tour", handleStartTour);
    };
  }, [onOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (!isLast) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      const nextStep = DEMO_STEPS[nextIdx];
      if (nextStep && pathname !== nextStep.targetHref) {
        router.push(nextStep.targetHref);
      }
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      const prevStep = DEMO_STEPS[prevIdx];
      if (prevStep && pathname !== prevStep.targetHref) {
        router.push(prevStep.targetHref);
      }
    }
  };

  const handleNavigateTarget = () => {
    if (pathname !== step.targetHref) {
      router.push(step.targetHref);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.button
            key="minimized"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setIsMinimized(false)}
            className="neu-raised px-4 py-2.5 rounded-full flex items-center gap-2.5 text-xs font-mono font-bold text-ember border border-ember/30 shadow-[0_0_20px_rgba(255,122,26,0.3)] bg-bg-1"
          >
            <Sparkles size={14} className="animate-spin text-ember" />
            <span>Guided Tour · Step {step.step}/6</span>
            <Maximize2 size={12} className="text-text-3" />
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="w-[420px] max-w-[calc(100vw-32px)] neu-raised rounded-2xl p-5 shadow-2xl border border-ember/30 bg-bg-1/95 backdrop-blur-xl relative overflow-hidden"
          >
            {/* Top Ember Ambient Bloom Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
              <motion.div
                className="h-full bg-ember-gradient shadow-[0_0_12px_#FF7A1A]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-3 pt-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-ember/15 flex items-center justify-center text-ember">
                  <StepIcon size={14} />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ember">
                    3-Minute Golden Demo · Step {step.step} of 6
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 rounded-lg hover:bg-white/5 text-text-3 hover:text-text-1"
                  title="Minimize Coach"
                >
                  <Minimize2 size={13} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-white/5 text-text-3 hover:text-text-1"
                  title="Close Tour"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Step Title & Tagline */}
            <div className="mb-2.5">
              <h3 className="text-sm font-display font-bold text-text-1 leading-snug">
                {step.title}
              </h3>
              <p className="text-[11px] font-mono text-ember/90 mt-0.5">
                {step.tagline}
              </p>
            </div>

            {/* Narrative Description */}
            <p className="text-xs text-text-2 leading-relaxed font-ui mb-3 bg-bg-0/50 p-2.5 rounded-xl border border-white/5">
              {step.description}
            </p>

            {/* Expected Observation */}
            <div className="neu-inset p-2 rounded-lg text-[10px] font-mono text-text-3 mb-3 flex items-start gap-1.5 border border-white/5">
              <CheckCircle2 size={12} className="text-action flex-shrink-0 mt-0.5" />
              <span>{step.expectedObservation}</span>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrev}
                  disabled={currentStepIndex === 0}
                  className="p-1.5 rounded-lg neu-button text-text-3 hover:text-text-1 disabled:opacity-30 disabled:pointer-events-none"
                  title="Previous Step"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={handleNavigateTarget}
                  className="neu-button px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-text-2 hover:text-ember flex items-center gap-1"
                >
                  <span>Go to screen</span>
                  <ArrowRight size={10} />
                </button>
              </div>

              <button
                onClick={handleNext}
                className="neu-button px-4 py-1.5 rounded-xl text-xs font-mono font-bold text-white bg-ember-gradient shadow-[0_0_12px_rgba(255,122,26,0.3)] hover:opacity-95 flex items-center gap-1.5"
              >
                <span>{isLast ? "Complete Tour ✓" : "Next Step"}</span>
                {!isLast && <ChevronRight size={14} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

