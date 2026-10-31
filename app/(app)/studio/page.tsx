"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Users,
  Upload,
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Eye,
  FileText,
  Volume2,
  Trash2,
  Plus,
  ArrowUpDown,
  Check,
  ArrowRight,
  GitCompare,
  Flame,
  ShieldAlert,
} from "lucide-react";
import { VoiceOrb3D } from "@/components/three/VoiceOrb3D";
import { SelfCorrectionBadge } from "@/components/closeloop/SelfCorrectionBadge";
import { SpeakerMappingModal } from "@/components/closeloop/SpeakerMappingModal";
import { ConfidenceRing } from "@/components/closeloop/ConfidenceRing";
import { EvidenceChip } from "@/components/closeloop/EvidenceChip";
import { DEMO_SEED_DATA, SEED_IDS } from "@/lib/db/seed";
import { parseTranscriptContent, ParseResult } from "@/lib/parsers/transcript";
import { formatIST, initials, cn } from "@/lib/utils";

type CaptureMode = "debrief" | "roundtable" | "import";
type ViewMode = "clean" | "raw";

const DEMO_RECAP_TEXT =
  "Okay so, um, quick recap of today’s sync. So basically we, uh, talked about the launch and honestly I think we should push the launch to December first, like the fifteenth of November is just not realistic with the QA backlog. And, you know, we also decided to ship Android and iOS together, which, yeah, I know changes what we said last time. Meera will share the final screens by Friday, no, sorry, Monday, Monday is better for her. Side note, has anyone tried the new biryani place near the office? Anyway, back to it. Rohan keeps owning the launch campaign, nothing changes there. Oh and Sana, you’ll update the test plan by next Wednesday. Arjun, can you freeze the release branch right after that?";

interface PipelineStageState {
  stage: number;
  name: string;
  description: string;
  status: "idle" | "running" | "done" | "queued";
  durationMs?: number;
}

const INITIAL_STAGES: PipelineStageState[] = [
  { stage: 1, name: "Clean", description: "Filler strip, self-corrections & digressions", status: "idle" },
  { stage: 2, name: "Attribute", description: "Speaker mapping & recipient tagging", status: "idle" },
  { stage: 3, name: "Extract", description: "Decisions, actions, risks, questions (Phase 3)", status: "queued" },
  { stage: 4, name: "Resolve", description: "Epistemic taxonomy & deadline resolution", status: "queued" },
  { stage: 5, name: "Remember & Compare", description: "pgvector similarity vs historical ledger", status: "queued" },
  { stage: 6, name: "Stage", description: "Server approval gate preparation", status: "queued" },
];

export default function StudioPage() {
  const { people, workspace, projects } = DEMO_SEED_DATA;

  // ── Meeting Metadata Bar State ─────────────────────────────
  const [meetingTitle, setMeetingTitle] = useState("Mobile v2 Weekly Strategy & Alignment");
  const [meetingDate, setMeetingDate] = useState<string>(workspace.simNow.toISOString().slice(0, 16));
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || "proj_mobile_v2");
  const [activeParticipants, setActiveParticipants] = useState<string[]>(people.map((p) => p.id));

  // ── Capture Mode State ─────────────────────────────────────
  const [captureMode, setCaptureMode] = useState<CaptureMode>("debrief");
  const [viewMode, setViewMode] = useState<ViewMode>("clean");

  // Mode A: Debrief
  const [debriefText, setDebriefText] = useState("");
  const [isTypewriting, setIsTypewriting] = useState(false);
  const debriefTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Velocity telemetry for VoiceOrb3D
  const [charVelocity, setCharVelocity] = useState(0); // CPS
  const lastInputTimeRef = useRef<number>(Date.now());
  const inputCharCountRef = useRef<number>(0);

  // Mode B: Round-Table
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>(people[0]?.id || SEED_IDS.PERSON_PRIYA);
  const [roundTableInput, setRoundTableInput] = useState("");
  const [roundTableTurns, setRoundTableTurns] = useState<
    Array<{ id: string; speakerId: string; speakerName: string; text: string }>
  >([]);

  // Mode C: Transcript Import
  const [importResult, setImportResult] = useState<ParseResult | null>(null);
  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [unmappedSpeakers, setUnmappedSpeakers] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Pipeline & Extraction Rail State ───────────────────────
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasStartedProcessing, setHasStartedProcessing] = useState(false);
  const [stages, setStages] = useState<PipelineStageState[]>(INITIAL_STAGES);
  const [cleanedUtterances, setCleanedUtterances] = useState<any[]>([]);
  const [pipelineSummary, setPipelineSummary] = useState<string | null>(null);
  const [hiddenDigressions, setHiddenDigressions] = useState<Record<string, boolean>>({});

  // Phase 3 Intelligence State
  const [stagedDecisions, setStagedDecisions] = useState<any[]>([]);
  const [stagedActions, setStagedActions] = useState<any[]>([]);
  const [stagedConflicts, setStagedConflicts] = useState<any[]>([]);
  const [executiveSummary, setExecutiveSummary] = useState<string | null>(null);
  const [createdMeetingId, setCreatedMeetingId] = useState<string | null>(null);
  const [pipelineCta, setPipelineCta] = useState<{ label: string; href: string } | null>(null);

  // ── Velocity calculation for VoiceOrb3D ─────────────────────
  function handleTextInput(text: string) {
    setDebriefText(text);

    const now = Date.now();
    const diffSec = (now - lastInputTimeRef.current) / 1000;
    if (diffSec > 0.05) {
      const cps = Math.min(25, Math.round(text.length / Math.max(diffSec, 1)));
      setCharVelocity(cps);
      lastInputTimeRef.current = now;
    }
  }

  // Decay velocity back to idle breathing after 2 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastInputTimeRef.current > 2000 && charVelocity > 0) {
        setCharVelocity(0);
      }
    }, 400);
    return () => clearInterval(timer);
  }, [charVelocity]);

  const normalizedVelocity = Math.min(1, charVelocity / 15);
  const orbState = isProcessing ? "processing" : charVelocity > 0 ? "listening" : "idle";

  // ── Typewriter Stream Effect for Demo Recap ─────────────────
  function handleLoadDemoRecap() {
    if (isTypewriting) return;
    setDebriefText("");
    setIsTypewriting(true);
    let index = 0;

    const interval = setInterval(() => {
      index += 3;
      if (index >= DEMO_RECAP_TEXT.length) {
        setDebriefText(DEMO_RECAP_TEXT);
        setIsTypewriting(false);
        setCharVelocity(0);
        clearInterval(interval);
      } else {
        setDebriefText(DEMO_RECAP_TEXT.slice(0, index));
        setCharVelocity(12);
        lastInputTimeRef.current = Date.now();
      }
    }, 18);
  }

  // ── Round-Table Keyboard Controls ──────────────────────────
  function handleRoundTableKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      // Cycle active speaker
      const currIdx = people.findIndex((p) => p.id === selectedSpeakerId);
      const nextIdx = (currIdx + 1) % people.length;
      setSelectedSpeakerId(people[nextIdx].id);
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commitRoundTableTurn();
    }
  }

  function commitRoundTableTurn() {
    if (!roundTableInput.trim()) return;
    const speaker = people.find((p) => p.id === selectedSpeakerId);
    setRoundTableTurns((prev) => [
      ...prev,
      {
        id: `turn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        speakerId: selectedSpeakerId,
        speakerName: speaker?.name || "Speaker",
        text: roundTableInput.trim(),
      },
    ]);
    setRoundTableInput("");
  }

  // ── Multi-Format File Ingestion ────────────────────────────
  async function handleFileUpload(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      alert("File exceeds maximum allowed size of 10MB");
      return;
    }

    const text = await file.text();
    const result = parseTranscriptContent(text, file.name);
    setImportResult(result);

    // Identify speakers not matching roster
    const unknown = result.uniqueSpeakers.filter(
      (s) => !people.some((p) => p.name.toLowerCase() === s.toLowerCase())
    );

    if (unknown.length > 0) {
      setUnmappedSpeakers(unknown);
      setMappingModalOpen(true);
    }
  }

  function handleConfirmSpeakerMapping(mapping: Record<string, string>) {
    if (!importResult) return;
    const mappedTurns = importResult.turns.map((t) => {
      const matchId = mapping[t.speakerName];
      const matchedPerson = people.find((p) => p.id === matchId);
      return {
        ...t,
        speakerName: matchedPerson?.name || t.speakerName,
      };
    });
    setImportResult({ ...importResult, turns: mappedTurns });
    setMappingModalOpen(false);
  }

  // ── Process Meeting Intelligence (SSE Streaming) ───────────
  async function handleProcessIntelligence() {
    setIsProcessing(true);
    setHasStartedProcessing(true);
    setStagedDecisions([]);
    setStagedActions([]);
    setStagedConflicts([]);
    setExecutiveSummary(null);
    setStages((prev) =>
      prev.map((s) => ({ ...s, status: s.stage === 1 ? "running" : "idle", durationMs: undefined }))
    );

    try {
      // 1. Create meeting in store
      const createRes = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: meetingTitle,
          meetingDate,
          projectId: selectedProjectId,
          captureMode,
        }),
      });

      const createData = await createRes.json();
      const meetingId = createData.meeting?.id || `meet_${Date.now()}`;

      // 2. Persist Utterances
      let utterancesPayload: any[] = [];
      if (captureMode === "debrief") {
        utterancesPayload = [{ rawText: debriefText || DEMO_RECAP_TEXT }];
      } else if (captureMode === "roundtable") {
        utterancesPayload = roundTableTurns.map((t, idx) => ({
          speakerId: t.speakerId,
          speakerNameRaw: t.speakerName,
          seq: idx + 1,
          rawText: t.text,
        }));
      } else if (importResult) {
        utterancesPayload = importResult.turns.map((t) => ({
          speakerNameRaw: t.speakerName,
          seq: t.seq,
          tStart: t.tStart,
          rawText: t.rawText,
        }));
      }

      await fetch(`/api/meetings/${meetingId}/utterances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utterances: utterancesPayload,
          captureMode,
        }),
      });

      // 3. Initiate SSE Pipeline Stream
      const response = await fetch(`/api/meetings/${meetingId}/process`, {
        method: "POST",
      });

      if (!response.body) throw new Error("No response body from SSE process route");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const rawEvent of events) {
          if (!rawEvent.trim()) continue;
          const lines = rawEvent.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event: "));
          const dataLine = lines.find((l) => l.startsWith("data: "));

          if (!eventLine || !dataLine) continue;
          const eventType = eventLine.replace("event: ", "").trim();
          const eventData = JSON.parse(dataLine.replace("data: ", "").trim());

          if (eventType === "stage_start") {
            setStages((prev) =>
              prev.map((s) =>
                s.stage === eventData.stage ? { ...s, status: "running" } : s
              )
            );
          } else if (eventType === "stage_complete") {
            setStages((prev) =>
              prev.map((s) =>
                s.stage === eventData.stage
                  ? { ...s, status: "done", durationMs: eventData.durationMs }
                  : s
              )
            );
          } else if (eventType === "item_staged") {
            if (eventData.kind === "decision") {
              setStagedDecisions((prev) => {
                if (prev.some((x) => x.id === eventData.item.id)) return prev;
                return [...prev, eventData.item];
              });
            } else if (eventData.kind === "action") {
              setStagedActions((prev) => {
                if (prev.some((x) => x.id === eventData.item.id)) return prev;
                return [...prev, eventData.item];
              });
            } else if (eventData.kind === "conflict") {
              setStagedConflicts((prev) => {
                if (prev.some((x) => x.id === eventData.item.id)) return prev;
                return [...prev, eventData.item];
              });
            }
          } else if (eventType === "pipeline_complete") {
            setCleanedUtterances(eventData.utterances || []);
            setPipelineSummary(eventData.summaryOfCorrections || null);
            if (eventData.decisions) setStagedDecisions(eventData.decisions);
            if (eventData.actionItems) setStagedActions(eventData.actionItems);
            if (eventData.conflicts) setStagedConflicts(eventData.conflicts);
            if (eventData.executiveSummary) setExecutiveSummary(eventData.executiveSummary);
            if (eventData.meetingId) setCreatedMeetingId(eventData.meetingId);
            if (eventData.cta) setPipelineCta({ label: eventData.cta, href: eventData.ctaHref });
            setIsProcessing(false);
          }
        }
      }
    } catch (err) {
      console.error("[Studio Pipeline Error]", err);
      setIsProcessing(false);
    }
  }

  // Word count & estimated time
  const currentText =
    captureMode === "debrief"
      ? debriefText
      : captureMode === "roundtable"
      ? roundTableTurns.map((t) => t.text).join(" ")
      : importResult?.turns.map((t) => t.rawText).join(" ") || "";

  const wordCount = useMemo(() => {
    return currentText.trim().split(/\s+/).filter(Boolean).length;
  }, [currentText]);

  const estimatedProcessingTimeSec = useMemo(() => {
    return Math.max(0.8, Number((wordCount * 0.008).toFixed(1)));
  }, [wordCount]);

  const currentSpeaker = people.find((p) => p.id === selectedSpeakerId);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Top Clean Header Bar ──────────────────────────────── */}
      <div className="neu-raised p-4 flex flex-wrap items-center justify-between gap-4 bg-surface border border-border-subtle">
        {/* Meeting Title Input */}
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            className="w-full bg-recessed px-3.5 py-2 rounded-xl font-display font-bold text-sm text-text-1 outline-none border border-border-subtle focus:border-ember/40 transition-colors"
            placeholder="Meeting title..."
          />
        </div>

        {/* Mode Switcher Tabs */}
        <div className="bg-recessed p-1 rounded-xl flex items-center gap-1 border border-border-subtle">
          <button
            onClick={() => setCaptureMode("debrief")}
            className={cn(
              "py-1.5 px-3 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              captureMode === "debrief"
                ? "bg-surface text-ember font-bold shadow-sm border border-border-subtle"
                : "text-text-3 hover:text-text-1"
            )}
          >
            <Mic size={13} />
            <span>Voice Debrief</span>
          </button>

          <button
            onClick={() => setCaptureMode("roundtable")}
            className={cn(
              "py-1.5 px-3 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              captureMode === "roundtable"
                ? "bg-surface text-action font-bold shadow-sm border border-border-subtle"
                : "text-text-3 hover:text-text-1"
            )}
          >
            <Users size={13} />
            <span>Round-Table</span>
          </button>

          <button
            onClick={() => setCaptureMode("import")}
            className={cn(
              "py-1.5 px-3 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              captureMode === "import"
                ? "bg-surface text-decision font-bold shadow-sm border border-border-subtle"
                : "text-text-3 hover:text-text-1"
            )}
          >
            <Upload size={13} />
            <span>Import Transcript</span>
          </button>
        </div>

        {/* Load Demo Recap Button */}
        <button
          onClick={handleLoadDemoRecap}
          disabled={isTypewriting}
          className="btn-secondary px-3.5 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles size={13} className={isTypewriting ? "animate-spin text-ember" : "text-ember"} />
          <span>{isTypewriting ? "Streaming..." : "Load Demo Recap"}</span>
        </button>
      </div>

      {/* Roster Chips ONLY shown in Round-Table Mode */}
      {captureMode === "roundtable" && (
        <div className="neu-raised p-3 rounded-xl flex items-center gap-2 flex-wrap border border-border-subtle bg-surface">
          <span className="text-[11px] font-mono text-text-3 font-semibold uppercase mr-1">Active Roster:</span>
          {people.map((p) => {
            const isSelected = activeParticipants.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  setActiveParticipants((prev) =>
                    isSelected ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                  )
                }
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all border cursor-pointer",
                  isSelected
                    ? "bg-recessed text-text-1 border-border-strong font-semibold"
                    : "opacity-40 text-text-3 border-transparent hover:opacity-75"
                )}
                style={{
                  borderColor: isSelected ? `${p.accentColor}50` : undefined,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: p.accentColor || "#FF7A1A" }}
                />
                <span>{p.name.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Main Studio Stage: Single-Column or Multi-Column with Stepper ── */}
      <div className={cn(
        hasStartedProcessing ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : "max-w-3xl mx-auto space-y-6"
      )}>
        {/* Center Capture Stage */}
        <div className={cn(hasStartedProcessing && "lg:col-span-2", "space-y-6")}>
          {/* Free-Floating 3D Voice Orb (No Recessed Dark Box) */}
          <div className="flex flex-col items-center justify-center my-2 relative">
            <div className="relative w-44 h-44 flex items-center justify-center">
              {/* Soft concentric soundwave rings */}
              <div className="absolute inset-0 rounded-full border border-border-subtle/60 flex items-center justify-center">
                <div className="w-36 h-36 rounded-full border border-border-subtle/40 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full border border-ember/20" />
                </div>
              </div>

              {/* 3D Voice Orb */}
              <VoiceOrb3D
                state={orbState}
                intensity={normalizedVelocity}
                size={130}
              />
            </div>

            {/* Clean Status Text below Orb */}
            <div className="mt-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-recessed text-xs font-mono text-text-3 border border-border-subtle">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    orbState === "listening"
                      ? "bg-ember animate-ping"
                      : orbState === "processing"
                      ? "bg-action animate-spin"
                      : "bg-text-3"
                  )}
                />
                <span>
                  {orbState === "listening"
                    ? "Dictation active (Wispr Flow)"
                    : orbState === "processing"
                    ? "Running AI speech normalization..."
                    : "Ready for Wispr Flow dictation"}
                </span>
              </span>
            </div>
          </div>

          {/* Mode Capture Surface */}
          <div className="neu-raised p-6 relative bg-surface border border-border-subtle">
            {/* Mode A: Voice Debrief */}
            {captureMode === "debrief" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-text-1 uppercase tracking-wider">
                      Single-Speaker Recap
                    </span>
                    <span className="text-[10px] font-mono text-text-3">
                      Speaker: Priya Nair (PM)
                    </span>
                  </div>

                  {/* Tactile "Load Demo Recap" Button */}
                  <button
                    onClick={handleLoadDemoRecap}
                    disabled={isTypewriting}
                    className="neu-button px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold text-ember flex items-center gap-1.5 hover:bg-ember/10 transition-colors"
                  >
                    <Sparkles size={13} className={isTypewriting ? "animate-spin" : ""} />
                    <span>{isTypewriting ? "Streaming Demo..." : "Load Demo Recap"}</span>
                  </button>
                </div>

                <div className="neu-inset p-4 rounded-2xl relative border border-white/5">
                  <textarea
                    ref={debriefTextareaRef}
                    value={debriefText}
                    onChange={(e) => handleTextInput(e.target.value)}
                    placeholder="Press your Wispr Flow shortcut and dictate what happened in the meeting..."
                    className="w-full bg-transparent text-[16px] lg:text-[18px] text-text-1 placeholder:text-text-3 outline-none resize-none min-h-[220px] leading-relaxed font-ui"
                  />

                  {/* Telemetry Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] font-mono text-text-3">
                    <span className="flex items-center gap-2">
                      <span className="text-text-2 font-semibold">{wordCount} words</span>
                      <span>·</span>
                      <span>{debriefText.length} chars</span>
                    </span>
                    <span className="text-ember">
                      Est. Processing Time: ~{estimatedProcessingTimeSec}s
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Mode B: Round-Table (Multi-Speaker Pass-The-Mic) */}
            {captureMode === "roundtable" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-text-1 uppercase tracking-wider">
                    Pass-The-Mic Turn Tagger
                  </span>
                  <span className="text-[10px] font-mono text-text-3">
                    Tab cycles speaker · Enter commits turn
                  </span>
                </div>

                {/* Tactile Speaker Selection Chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  {people.map((p) => {
                    const isActive = p.id === selectedSpeakerId;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedSpeakerId(p.id)}
                        className={cn(
                          "neu-button px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-mono transition-all",
                          isActive
                            ? "neu-inset font-bold shadow-md"
                            : "text-text-3 hover:text-text-1"
                        )}
                        style={{
                          color: isActive ? p.accentColor || "#FF7A1A" : undefined,
                          borderColor: isActive ? `${p.accentColor}40` : undefined,
                        }}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: p.accentColor || "#FF7A1A" }}
                        />
                        <span>{p.name}</span>
                        <span className="text-[9px] opacity-60">({p.role?.split(" ")[0]})</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Utterance Input */}
                <div className="neu-inset p-3.5 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-text-3">Speaking now:</span>
                    <span
                      className="font-bold"
                      style={{ color: currentSpeaker?.accentColor || "#FF7A1A" }}
                    >
                      {currentSpeaker?.name}
                    </span>
                  </div>
                  <textarea
                    value={roundTableInput}
                    onChange={(e) => setRoundTableInput(e.target.value)}
                    onKeyDown={handleRoundTableKeyDown}
                    placeholder={`Type what ${currentSpeaker?.name.split(" ")[0]} is saying... (Press Enter to commit)`}
                    rows={2}
                    className="w-full bg-transparent text-sm text-text-1 placeholder:text-text-3 outline-none resize-none leading-relaxed"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={commitRoundTableTurn}
                      disabled={!roundTableInput.trim()}
                      className="neu-button px-3 py-1 rounded-lg text-xs font-semibold text-action disabled:opacity-50"
                    >
                      Commit Turn (Enter)
                    </button>
                  </div>
                </div>

                {/* Committed Conversation Stream */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {roundTableTurns.map((turn, idx) => {
                    const speaker = people.find((p) => p.id === turn.speakerId);
                    return (
                      <div
                        key={turn.id}
                        className="p-3 rounded-xl neu-raised flex items-start gap-3 border-l-4 border border-white/5"
                        style={{ borderLeftColor: speaker?.accentColor || "#FF7A1A" }}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                          style={{
                            background: `${speaker?.accentColor || "#FF7A1A"}20`,
                            color: speaker?.accentColor || "#FF7A1A",
                          }}
                        >
                          {initials(speaker?.name || "?")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-xs font-mono mb-1">
                            <span className="font-semibold text-text-1">{speaker?.name}</span>
                            <span className="text-[10px] text-text-3">Turn #{idx + 1}</span>
                          </div>
                          <p className="text-xs text-text-2 leading-relaxed">{turn.text}</p>
                        </div>
                        <button
                          onClick={() =>
                            setRoundTableTurns((prev) => prev.filter((t) => t.id !== turn.id))
                          }
                          className="text-text-3 hover:text-conflict p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                  {roundTableTurns.length === 0 && (
                    <div className="p-6 text-center text-xs font-mono text-text-3 neu-inset rounded-xl">
                      No turns committed yet. Select a speaker and press Enter to start pass-the-mic.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mode C: Multi-Format Transcript Import */}
            {captureMode === "import" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-text-1 uppercase tracking-wider">
                    Multi-Format Ingestion
                  </span>
                  <span className="text-[10px] font-mono text-text-3">
                    Supports .txt, .vtt, .srt, .docx, .pdf (Max 10MB)
                  </span>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="neu-inset p-8 rounded-2xl border-2 border-dashed border-white/10 hover:border-decision/40 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.vtt,.srt,.docx,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-decision/15 border border-decision/30 flex items-center justify-center text-decision mb-2">
                    <Upload size={20} />
                  </div>
                  <h4 className="text-sm font-semibold text-text-1">
                    Drag and drop your transcript file here
                  </h4>
                  <p className="text-xs text-text-3 mt-1 font-mono">
                    or click to browse from device
                  </p>
                </div>

                {/* Parsed Preview Table */}
                {importResult && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-mono text-text-3">
                      <span>Detected Format: {importResult.format.toUpperCase()}</span>
                      <span className="text-action font-semibold">
                        {importResult.turns.length} turns extracted
                      </span>
                    </div>

                    <div className="neu-inset p-3 rounded-xl max-h-56 overflow-y-auto space-y-2 border border-white/5">
                      {importResult.turns.slice(0, 8).map((turn) => (
                        <div key={turn.id} className="text-xs flex gap-2">
                          <span className="font-mono text-decision font-semibold flex-shrink-0">
                            {turn.speakerName}:
                          </span>
                          <span className="text-text-2 truncate">{turn.rawText}</span>
                        </div>
                      ))}
                      {importResult.turns.length > 8 && (
                        <div className="text-[10px] font-mono text-text-3 text-center pt-1">
                          + {importResult.turns.length - 8} more turns
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Prominent Tactile CTA: Process Meeting Intelligence */}
            <div className="mt-6 pt-4 border-t border-border-subtle flex items-center justify-between gap-4">
              <span className="text-xs font-mono text-text-3">
                Ready to extract decisions, lineage, and conflicts
              </span>
              <button
                onClick={handleProcessIntelligence}
                disabled={isProcessing || !currentText.trim()}
                className="btn-primary px-6 py-3 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-40"
              >
                <Zap size={15} className={isProcessing ? "animate-spin text-white" : "text-white"} />
                <span>{isProcessing ? "Processing Intelligence..." : "Process Meeting Intelligence →"}</span>
              </button>
            </div>
          </div>

          {/* Cleaned Utterance Stream & Speech Normalization Display */}
          {cleanedUtterances.length > 0 && (
            <div className="neu-raised p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-sm text-text-1 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-action" />
                    <span>Normalized Speech & Self-Correction Review</span>
                  </h3>
                  <p className="text-[11px] font-mono text-text-3 mt-0.5">
                    {pipelineSummary}
                  </p>
                </div>

                {/* Raw vs Clean Segmented Toggle */}
                <div className="neu-inset p-1 rounded-xl flex items-center gap-1 border border-white/5">
                  <button
                    onClick={() => setViewMode("clean")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all",
                      viewMode === "clean"
                        ? "neu-button neu-inset text-action"
                        : "text-text-3 hover:text-text-1"
                    )}
                  >
                    Clean View
                  </button>
                  <button
                    onClick={() => setViewMode("raw")}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all",
                      viewMode === "raw"
                        ? "neu-button neu-inset text-warning"
                        : "text-text-3 hover:text-text-1"
                    )}
                  >
                    Raw Verbatim
                  </button>
                </div>
              </div>

              {/* Utterance List */}
              <div className="space-y-3">
                {cleanedUtterances.map((utt) => {
                  const selfCorrection = utt.corrections?.find(
                    (c: any) => c.kind === "self-correction"
                  );
                  const isDigression = utt.isDigression;
                  const isHidden = hiddenDigressions[utt.id] ?? false;

                  return (
                    <motion.div
                      key={utt.id || utt.seq}
                      layout
                      className={cn(
                        "p-4 rounded-xl border border-white/5 transition-all",
                        isDigression ? "bg-white/[0.01] opacity-40 hover:opacity-100" : "neu-raised",
                        selfCorrection && "border-ember/30 shadow-[0_0_16px_-6px_rgba(255,122,26,0.2)]"
                      )}
                    >
                      <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                        <span className="font-bold text-text-1">{utt.speakerNameRaw || "Priya Nair"}</span>
                        {isDigression && (
                          <span className="text-[10px] text-conflict font-semibold px-2 py-0.5 rounded bg-conflict/10 border border-conflict/20">
                            Off-Topic Digression
                          </span>
                        )}
                      </div>

                      {/* Content rendering based on viewMode */}
                      {viewMode === "raw" ? (
                        <p className="text-xs text-text-2 font-mono leading-relaxed">
                          {utt.rawText}
                        </p>
                      ) : (
                        <div className="text-xs text-text-1 leading-relaxed space-y-1">
                          {/* If this sentence contains self-correction, highlight with interactive badge */}
                          {selfCorrection ? (
                            <div>
                              <span>Meera will share the final screens </span>
                              <SelfCorrectionBadge
                                original={selfCorrection.original}
                                replacement={selfCorrection.replacement}
                                rationale={selfCorrection.rationale}
                              />
                            </div>
                          ) : isDigression ? (
                            <div>
                              <button
                                onClick={() =>
                                  setHiddenDigressions((prev) => ({
                                    ...prev,
                                    [utt.id]: !isHidden,
                                  }))
                                }
                                className="text-[10px] font-mono text-text-3 underline hover:text-text-2 flex items-center gap-1"
                              >
                                <span>[Off-topic digression: biryani discussion hidden]</span>
                                <span className="text-ember font-bold">
                                  {isHidden ? "Hide" : "Show"}
                                </span>
                              </button>
                              {isHidden && (
                                <p className="text-xs text-text-3 italic mt-1">{utt.rawText}</p>
                              )}
                            </div>
                          ) : (
                            <p>{utt.cleanText || utt.rawText}</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Right-Hand Live Extraction Rail (6-Stage Stepper) ── */}
        {hasStartedProcessing && (
          <div className="space-y-6">
          <div className="neu-raised p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-ember" />
                <h3 className="font-display font-bold text-sm text-text-1">
                  6-Stage AI Stepper
                </h3>
              </div>
              <span className="text-[10px] font-mono text-text-3">
                {isProcessing ? "Executing..." : "Ready"}
              </span>
            </div>

            {/* Stage Progress Rows */}
            <div className="space-y-3">
              {stages.map((stage) => {
                const isRunning = stage.status === "running";
                const isDone = stage.status === "done";
                const isQueued = stage.status === "queued";

                return (
                  <div
                    key={stage.stage}
                    className={cn(
                      "p-3 rounded-xl border transition-all",
                      isRunning
                        ? "neu-inset border-ember/40 bg-ember/5"
                        : isDone
                        ? "neu-raised border-action/30"
                        : "neu-flat border-white/5 opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-5 h-5 rounded-full text-[10px] font-mono font-bold flex items-center justify-center",
                            isRunning
                              ? "bg-ember text-black animate-pulse"
                              : isDone
                              ? "bg-action text-black"
                              : "bg-raised text-text-3"
                          )}
                        >
                          {isDone ? <Check size={12} /> : stage.stage}
                        </span>
                        <span className="text-xs font-semibold text-text-1">
                          {stage.name}
                        </span>
                      </div>

                      {stage.durationMs && (
                        <span className="text-[10px] font-mono text-action font-semibold">
                          {stage.durationMs}ms
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-3 pl-7">
                      {stage.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Staged Review Rail ── */}
          <div className="neu-raised p-5 space-y-4 border border-white/5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-ember" />
                <h4 className="font-display font-bold text-sm text-text-1">
                  Staged Intelligence Rail
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-ember/10 text-ember border border-ember/20 font-bold">
                {stagedDecisions.length + stagedActions.length + stagedConflicts.length} Items
              </span>
            </div>

            {/* 3-Sentence Executive Summary */}
            {executiveSummary && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="neu-inset p-4 rounded-xl border-l-2 border-l-ember bg-ember/[0.03] space-y-2"
              >
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-ember uppercase tracking-wider">
                  <Flame size={13} />
                  <span>Executive Summary</span>
                </div>
                <p className="text-xs text-text-2 leading-relaxed">
                  {executiveSummary}
                </p>
              </motion.div>
            )}

            {/* Staged Conflicts (Rose Glow) */}
            {stagedConflicts.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-conflict uppercase tracking-wider">
                  <ShieldAlert size={14} />
                  <span>Cross-Meeting Conflicts ({stagedConflicts.length})</span>
                </div>
                {stagedConflicts.map((conf) => (
                  <motion.div
                    key={conf.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3.5 rounded-xl border border-conflict/30 bg-conflict/10 shadow-[0_0_20px_-6px_rgba(255,77,109,0.25)] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-conflict/20 text-conflict border border-conflict/30">
                        {conf.conflictType} conflict • {conf.severity}
                      </span>
                      <span className="text-[10px] font-mono text-conflict font-semibold">
                        {Math.round(conf.confidence * 100)}% match
                      </span>
                    </div>
                    <p className="text-xs text-text-1 font-medium leading-snug">
                      {conf.explanation}
                    </p>
                    <div className="neu-inset p-2 rounded-lg text-[11px] font-mono space-y-1">
                      <div className="text-text-3">Active: <span className="text-text-2 line-through">{conf.oldValue}</span></div>
                      <div className="text-conflict font-semibold">Proposed: {conf.newValue}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Staged Proposed Decisions */}
            {stagedDecisions.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-text-3 uppercase tracking-wider">
                  <span>Proposed Decisions ({stagedDecisions.length})</span>
                </div>
                {stagedDecisions.map((dec) => (
                  <motion.div
                    key={dec.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="neu-inset p-3.5 rounded-xl border border-white/5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ConfidenceRing score={dec.confidence} size={26} strokeWidth={2.5} showLabel={false} />
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 text-text-3 border border-white/5">
                          {dec.topic}
                        </span>
                        {dec.isReaffirmation && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            Reaffirmed
                          </span>
                        )}
                      </div>
                      {dec.resolvedEffectiveDate && (
                        <span className="text-[10px] font-mono text-ember font-bold">
                          {dec.resolvedEffectiveDate}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-1 font-semibold leading-snug">
                      {dec.statement}
                    </p>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                      <span className="text-text-3 flex items-center gap-1 font-mono">
                        Owner: <span className="text-text-2 font-medium">{dec.ownerName || "Priya Nair"}</span>
                      </span>
                      {dec.evidenceUtteranceIds?.[0] && (
                        <EvidenceChip
                          utteranceId={dec.evidenceUtteranceIds[0]}
                          quote={dec.statement.slice(0, 30)}
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Staged Action Items */}
            {stagedActions.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-text-3 uppercase tracking-wider">
                  <span>Action Items ({stagedActions.length})</span>
                </div>
                {stagedActions.map((act) => (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="neu-inset p-3.5 rounded-xl border border-white/5 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-raised text-text-2 border border-white/5">
                        {act.priority} priority
                      </span>
                      {act.isTaskUpdate && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                          Updates Task #{act.updatesActionId?.slice(-6)}
                        </span>
                      )}
                      {act.resolvedDueDate && (
                        <span className="text-[10px] font-mono text-action font-semibold">
                          Due: {act.resolvedDueDate}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-text-1 font-medium">
                      {act.title}
                    </p>

                    {/* Needs Input Amber Callout */}
                    {act.needsInput && (
                      <div className="p-2.5 rounded-lg border border-ember/30 bg-ember/10 space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-ember">
                          <AlertTriangle size={12} />
                          <span>Needs Input: Relative Dependency</span>
                        </div>
                        <p className="text-[11px] text-text-2">
                          {act.needsInputReason}
                        </p>
                        {act.suggestedFix && (
                          <div className="text-[10px] font-mono text-text-3">
                            Suggested Fix: <span className="text-ember font-bold">{act.suggestedFix}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                      <span className="text-text-3 font-mono">
                        Assignee: <span className="text-text-2 font-medium">{act.ownerNameRaw || "Unassigned"}</span>
                      </span>
                      {act.evidenceUtteranceIds?.[0] && (
                        <EvidenceChip
                          utteranceId={act.evidenceUtteranceIds[0]}
                          quote={act.title.slice(0, 30)}
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Empty State before execution */}
            {stagedDecisions.length === 0 && stagedActions.length === 0 && !isProcessing && (
              <div className="neu-inset p-4 rounded-xl text-xs text-text-3 text-center space-y-1 border border-white/5">
                <Clock size={16} className="mx-auto text-text-3 mb-1" />
                <p className="font-semibold text-text-2">No Items Staged Yet</p>
                <p className="text-[11px]">Click "Process Intelligence Stream" to run all 6 AI stages.</p>
              </div>
            )}

            {/* Review CTA Button */}
            {(stagedDecisions.length > 0 || stagedConflicts.length > 0) && (
              <Link
                href={pipelineCta?.href || `/meetings/${createdMeetingId || "meet_launch_planning_001"}`}
                className="neu-button neu-ember-glow w-full py-3.5 px-4 font-display font-bold text-sm text-ember text-center rounded-xl flex items-center justify-center gap-2 group transition-all"
              >
                <span>{pipelineCta?.label || "Review 7 Proposals & 2 Conflicts →"}</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Speaker Mapping Modal for Mode C */}
      {mappingModalOpen && (
        <SpeakerMappingModal
          unmappedSpeakers={unmappedSpeakers}
          roster={people}
          onConfirm={handleConfirmSpeakerMapping}
          onClose={() => setMappingModalOpen(false)}
        />
      )}
    </div>
  );
}
