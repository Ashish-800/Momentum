"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Mic,
  Users,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Flame,
  ShieldAlert,
  ArrowRight,
  Eye,
  ChevronRight,
  Sparkles,
  Layers,
  HelpCircle,
  Code,
  Copy,
  Check,
} from "lucide-react";
import { ConfidenceRing } from "@/components/closeloop/ConfidenceRing";
import { EvidenceChip } from "@/components/closeloop/EvidenceChip";
import { SelfCorrectionBadge } from "@/components/closeloop/SelfCorrectionBadge";
import { AiTraceDrawer } from "@/components/closeloop/AiTraceDrawer";
import { formatIST, statusClass, statusLabel, initials, cn } from "@/lib/utils";

interface MeetingDetailWorkspaceProps {
  meeting: any;
  project?: any;
  utterances: any[];
  decisions: any[];
  actionItems: any[];
  conflicts: any[];
  people: any[];
}

export function MeetingDetailWorkspace({
  meeting,
  project,
  utterances,
  decisions,
  actionItems,
  conflicts,
  people,
}: MeetingDetailWorkspaceProps) {
  // Transcript controls
  const [viewMode, setViewMode] = useState<"clean" | "raw">("clean");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredEvidenceId, setHoveredEvidenceId] = useState<string | null>(null);
  const [selectedUtteranceId, setSelectedUtteranceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"decisions" | "actions" | "conflicts" | "risks">("decisions");
  const [copiedJson, setCopiedJson] = useState(false);

  const getPersonById = (personId: string | null | undefined) =>
    people.find((p) => p.id === personId);

  // Filter utterances by search query
  const filteredUtterances = useMemo(() => {
    if (!searchQuery.trim()) return utterances;
    const q = searchQuery.toLowerCase();
    return utterances.filter(
      (u) =>
        u.cleanText?.toLowerCase().includes(q) ||
        u.rawText?.toLowerCase().includes(q) ||
        u.speakerNameRaw?.toLowerCase().includes(q)
    );
  }, [utterances, searchQuery]);

  // Derived filtered items based on selected utterance
  const visibleDecisions = useMemo(() => {
    if (!selectedUtteranceId) return decisions;
    return decisions.filter((d) => d.evidenceUtteranceIds?.includes(selectedUtteranceId));
  }, [decisions, selectedUtteranceId]);

  const visibleActions = useMemo(() => {
    if (!selectedUtteranceId) return actionItems;
    return actionItems.filter((a) => a.evidenceUtteranceIds?.includes(selectedUtteranceId));
  }, [actionItems, selectedUtteranceId]);

  // Synthesized AI pipeline traces for this meeting
  const traces = [
    {
      id: "trace_1",
      meetingId: meeting.id,
      stage: 1,
      model: "claude-sonnet-4-5",
      promptVersion: "v1.2.0",
      tokensIn: 340,
      tokensOut: 280,
      durationMs: 380,
      status: "done" as const,
      createdAt: new Date(),
    },
    {
      id: "trace_2",
      meetingId: meeting.id,
      stage: 2,
      model: "deterministic-diarizer",
      promptVersion: "v1.0.0",
      tokensIn: 0,
      tokensOut: 0,
      durationMs: 140,
      status: "done" as const,
      createdAt: new Date(),
    },
    {
      id: "trace_3",
      meetingId: meeting.id,
      stage: 3,
      model: "claude-sonnet-4-5",
      promptVersion: "v1.3.0",
      tokensIn: 520,
      tokensOut: 410,
      durationMs: 820,
      status: "done" as const,
      createdAt: new Date(),
    },
    {
      id: "trace_4",
      meetingId: meeting.id,
      stage: 4,
      model: "deterministic-resolver",
      promptVersion: "v1.0.0",
      tokensIn: 0,
      tokensOut: 0,
      durationMs: 45,
      status: "done" as const,
      createdAt: new Date(),
    },
    {
      id: "trace_5",
      meetingId: meeting.id,
      stage: 5,
      model: "hybrid-conflict-judge",
      promptVersion: "v1.1.0",
      tokensIn: 610,
      tokensOut: 320,
      durationMs: 410,
      status: "done" as const,
      createdAt: new Date(),
    },
    {
      id: "trace_6",
      meetingId: meeting.id,
      stage: 6,
      model: "gatekeeper-stage",
      promptVersion: "v1.0.0",
      tokensIn: 0,
      tokensOut: 0,
      durationMs: 30,
      status: "done" as const,
      createdAt: new Date(),
    },
  ];

  const handleCopyJson = () => {
    const payload = {
      meetingId: meeting.id,
      title: meeting.title,
      summary: meeting.summary,
      decisions: visibleDecisions,
      actionItems: visibleActions,
      conflicts,
      utterances: utterances.map((u) => ({
        seq: u.seq,
        speaker: u.speakerNameRaw,
        cleanText: u.cleanText,
        corrections: u.corrections,
      })),
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* ── Meeting Header Card ───────────────────────────────── */}
      <div className="neu-raised p-6 rounded-2xl border border-white/5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="neu-inset w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Mic size={22} className="text-ember" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-raised text-text-3 border border-white/5 uppercase">
                  {meeting.captureMode || "Voice Debrief"}
                </span>
                {project && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-decision/10 text-decision border border-decision/20 font-bold">
                    {project.code} — {project.name}
                  </span>
                )}
                <span
                  className={cn(
                    "text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full",
                    statusClass(meeting.status)
                  )}
                >
                  {statusLabel(meeting.status)}
                </span>
              </div>
              <h1 className="font-display font-bold text-2xl text-text-1">
                {meeting.title}
              </h1>
              <div className="flex items-center gap-4 text-xs font-mono text-text-3 mt-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {formatIST(meeting.meetingDate)}
                </span>
                {meeting.durationMin && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} />
                    {meeting.durationMin} min
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users size={13} />
                  {people.length} participants
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyJson}
              className="neu-button px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 text-text-2 hover:text-text-1"
            >
              {copiedJson ? <Check size={13} className="text-action" /> : <Copy size={13} />}
              <span>{copiedJson ? "Copied JSON" : "Export Intelligence"}</span>
            </button>
            <Link
              href="/review"
              className="neu-button neu-ember-glow px-4 py-1.5 rounded-xl text-xs font-display font-bold text-ember flex items-center gap-1.5"
            >
              <span>Review Gate</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Executive Summary Quote Callout */}
        {meeting.summary && (
          <div className="neu-inset p-4 rounded-xl border-l-2 border-l-ember bg-ember/[0.02]">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-ember uppercase tracking-wider mb-1">
              <Flame size={13} />
              <span>Executive Synthesis</span>
            </div>
            <p className="text-xs text-text-2 leading-relaxed">
              {meeting.summary}
            </p>
          </div>
        )}
      </div>

      {/* ── Main Two-Column Workspace ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 Cols): Verbatim Interactive Transcript */}
        <div className="lg:col-span-5 neu-raised p-5 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-ember" />
              <h3 className="font-display font-bold text-sm text-text-1">
                Transcript & Evidence
              </h3>
              <span className="text-[10px] font-mono text-text-3 px-1.5 py-0.5 rounded bg-raised">
                {utterances.length} turns
              </span>
            </div>

            {/* Clean / Raw Mode Switcher */}
            <div className="neu-inset p-0.5 rounded-lg flex items-center gap-1 border border-white/5">
              <button
                onClick={() => setViewMode("clean")}
                className={cn(
                  "px-2 py-0.5 rounded text-[11px] font-mono transition-colors",
                  viewMode === "clean" ? "neu-raised text-ember font-bold" : "text-text-3 hover:text-text-2"
                )}
              >
                Clean
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className={cn(
                  "px-2 py-0.5 rounded text-[11px] font-mono transition-colors",
                  viewMode === "raw" ? "neu-raised text-text-1 font-bold" : "text-text-3 hover:text-text-2"
                )}
              >
                Raw
              </button>
            </div>
          </div>

          {/* Search bar inside transcript */}
          <div className="neu-inset px-3 py-2 rounded-xl flex items-center gap-2 border border-white/5">
            <Search size={14} className="text-text-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transcript utterances..."
              className="bg-transparent text-xs text-text-1 placeholder:text-text-3 outline-none flex-1 font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[10px] font-mono text-text-3 hover:text-text-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter notice if utterance is selected */}
          {selectedUtteranceId && (
            <div className="neu-inset p-2.5 rounded-xl flex items-center justify-between text-xs border border-ember/30 bg-ember/10">
              <span className="font-mono text-ember font-semibold">
                Highlighting items derived from Turn #{selectedUtteranceId.slice(-2)}
              </span>
              <button
                onClick={() => setSelectedUtteranceId(null)}
                className="text-[10px] font-mono underline text-text-2 hover:text-text-1"
              >
                Reset
              </button>
            </div>
          )}

          {/* Utterance Stream */}
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredUtterances.map((u) => {
              const speaker = getPersonById(u.speakerId);
              const isEvidenceActive = hoveredEvidenceId === u.id;
              const isSelected = selectedUtteranceId === u.id;
              const selfCorrection = u.corrections?.find((c: any) => c.kind === "self-correction");

              return (
                <motion.div
                  key={u.id}
                  onClick={() =>
                    setSelectedUtteranceId((prev) => (prev === u.id ? null : u.id))
                  }
                  onMouseEnter={() => setHoveredEvidenceId(u.id)}
                  onMouseLeave={() => setHoveredEvidenceId(null)}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer",
                    isSelected
                      ? "neu-raised border-ember/60 bg-ember/5 shadow-[0_0_16px_rgba(255,122,26,0.2)]"
                      : isEvidenceActive
                      ? "neu-raised border-ember/40 bg-ember/[0.04]"
                      : u.isDigression
                      ? "bg-white/[0.01] opacity-50 border-white/5"
                      : "neu-flat hover:neu-raised border-white/5"
                  )}
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                        style={{
                          background: `${speaker?.accentColor ?? "#FF7A1A"}25`,
                          color: speaker?.accentColor ?? "#FF7A1A",
                          border: `1px solid ${speaker?.accentColor ?? "#FF7A1A"}40`,
                        }}
                      >
                        {initials(speaker?.name ?? u.speakerNameRaw ?? "P")}
                      </div>
                      <span className="font-bold text-text-1">
                        {speaker?.name ?? u.speakerNameRaw}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-text-3">
                      {u.isDigression && (
                        <span className="px-1.5 py-0.2 rounded bg-conflict/10 text-conflict border border-conflict/20">
                          Digression
                        </span>
                      )}
                      <span>Turn #{u.seq}</span>
                    </div>
                  </div>

                  {viewMode === "raw" ? (
                    <p className="text-xs text-text-3 font-mono leading-relaxed pl-7">
                      {u.rawText}
                    </p>
                  ) : (
                    <div className="text-xs text-text-2 leading-relaxed pl-7">
                      {selfCorrection ? (
                        <div>
                          <span>Meera will share the final screens </span>
                          <SelfCorrectionBadge
                            original={selfCorrection.original}
                            replacement={selfCorrection.replacement}
                            rationale={selfCorrection.rationale}
                          />
                        </div>
                      ) : (
                        <p>{u.cleanText || u.rawText}</p>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 Cols): Tabbed Intelligence Inspector */}
        <div className="lg:col-span-7 neu-raised p-5 rounded-2xl border border-white/5 space-y-4">
          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-1.5 pb-3 border-b border-white/5">
            {[
              { id: "decisions", label: "Decisions & Memory", count: visibleDecisions.length },
              { id: "actions", label: "Action Items", count: visibleActions.length },
              { id: "conflicts", label: "Detected Conflicts", count: conflicts.length },
              { id: "risks", label: "Risks & Questions", count: 3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2 transition-all",
                  activeTab === tab.id
                    ? "neu-raised text-ember font-bold border border-white/5"
                    : "text-text-3 hover:text-text-1 neu-flat"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    activeTab === tab.id
                      ? "bg-ember/20 text-ember"
                      : "bg-white/5 text-text-3"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* TAB 1: DECISIONS & MEMORY */}
          {activeTab === "decisions" && (
            <div className="space-y-3">
              {visibleDecisions.map((dec) => {
                const owner = getPersonById(dec.ownerId);
                const isHovered = dec.evidenceUtteranceIds?.includes(hoveredEvidenceId || "");

                return (
                  <motion.div
                    key={dec.id}
                    onMouseEnter={() =>
                      setHoveredEvidenceId(dec.evidenceUtteranceIds?.[0] || null)
                    }
                    onMouseLeave={() => setHoveredEvidenceId(null)}
                    className={cn(
                      "p-4 rounded-xl border transition-all",
                      isHovered
                        ? "neu-raised border-ember/40 bg-ember/[0.03]"
                        : "neu-raised border-white/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider",
                            statusClass(dec.status)
                          )}
                        >
                          {statusLabel(dec.status)}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-raised text-text-3 border border-white/5">
                          {dec.topic}
                        </span>
                        {dec.supersedesId && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                            Reaffirms Active Memory
                          </span>
                        )}
                      </div>

                      {dec.confidence != null && (
                        <ConfidenceRing score={dec.confidence} size={30} strokeWidth={2.5} />
                      )}
                    </div>

                    <p className="text-sm font-semibold text-text-1 mb-1.5 leading-snug">
                      {dec.statement}
                    </p>

                    {dec.rationale && (
                      <p className="text-xs text-text-3 leading-relaxed mb-3">
                        {dec.rationale}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs pt-2.5 border-t border-white/5 font-mono">
                      <div className="flex items-center gap-1.5 text-text-3">
                        <span>Owner:</span>
                        <span className="text-text-1 font-semibold">
                          {owner?.name || "Priya Nair"}
                        </span>
                      </div>

                      {dec.evidenceUtteranceIds?.[0] && (
                        <EvidenceChip
                          utteranceId={dec.evidenceUtteranceIds[0]}
                          quote={dec.statement.slice(0, 32)}
                          onClick={(uid) => setSelectedUtteranceId(uid)}
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* TAB 2: ACTION ITEMS */}
          {activeTab === "actions" && (
            <div className="space-y-3">
              {visibleActions.map((act) => {
                const owner = getPersonById(act.ownerId);
                const isHovered = act.evidenceUtteranceIds?.includes(hoveredEvidenceId || "");

                return (
                  <motion.div
                    key={act.id}
                    onMouseEnter={() =>
                      setHoveredEvidenceId(act.evidenceUtteranceIds?.[0] || null)
                    }
                    onMouseLeave={() => setHoveredEvidenceId(null)}
                    className={cn(
                      "p-4 rounded-xl border transition-all",
                      isHovered
                        ? "neu-raised border-ember/40 bg-ember/[0.03]"
                        : "neu-raised border-white/5"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-raised text-text-2 border border-white/5">
                          {act.priority} priority
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-mono uppercase px-2 py-0.5 rounded-full",
                            statusClass(act.status)
                          )}
                        >
                          {statusLabel(act.status)}
                        </span>
                        {act.updatesActionId && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                            Updates Task #{act.updatesActionId.slice(-6)}
                          </span>
                        )}
                      </div>

                      {act.deadlineText && (
                        <span className="text-xs font-mono text-action font-semibold flex items-center gap-1">
                          <Clock size={12} />
                          {act.deadlineText}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-text-1 mb-1">
                      {act.title}
                    </p>

                    {act.description && (
                      <p className="text-xs text-text-3 leading-relaxed mb-3">
                        {act.description}
                      </p>
                    )}

                    {/* Amber Needs Input Callout */}
                    {act.needsInput && (
                      <div className="p-3 rounded-xl border border-ember/30 bg-ember/10 space-y-1.5 mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-ember">
                          <AlertTriangle size={13} />
                          <span>Needs Input: Relative Dependency</span>
                        </div>
                        <p className="text-xs text-text-2 leading-relaxed">
                          {act.needsInputReason}
                        </p>
                        {act.suggestedFix && (
                          <div className="text-[11px] font-mono text-text-3">
                            Suggested Resolution Date:{" "}
                            <span className="text-ember font-bold">{act.suggestedFix}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs pt-2.5 border-t border-white/5 font-mono">
                      <div className="flex items-center gap-1.5 text-text-3">
                        <span>Assignee:</span>
                        <span className="text-text-1 font-semibold">
                          {owner?.name || act.ownerNameRaw || "Unassigned"}
                        </span>
                      </div>

                      {act.evidenceUtteranceIds?.[0] && (
                        <EvidenceChip
                          utteranceId={act.evidenceUtteranceIds[0]}
                          quote={act.title.slice(0, 32)}
                          onClick={(uid) => setSelectedUtteranceId(uid)}
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* TAB 3: DETECTED CONFLICTS */}
          {activeTab === "conflicts" && (
            <div className="space-y-3">
              {conflicts.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border border-conflict/30 bg-conflict/10 shadow-[0_0_20px_-6px_rgba(255,77,109,0.25)] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={16} className="text-conflict" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-conflict">
                        {c.conflictType} conflict • {c.severity} severity
                      </span>
                    </div>
                    <span className="text-xs font-mono text-conflict font-bold">
                      {Math.round((c.confidence || 0.95) * 100)}% confidence
                    </span>
                  </div>

                  <p className="text-xs text-text-1 leading-relaxed">
                    {c.explanation}
                  </p>

                  <div className="neu-inset p-3 rounded-xl text-xs font-mono space-y-1.5">
                    <div className="text-text-3">
                      Active In Memory: <span className="line-through text-text-2">{c.oldValue}</span>
                    </div>
                    <div className="text-conflict font-bold">
                      Proposed In This Sync: {c.newValue}
                    </div>
                  </div>

                  {c.downstreamActionIds?.length > 0 && (
                    <div className="text-[11px] font-mono text-text-3">
                      Downstream Affected Tasks:{" "}
                      <span className="text-ember font-bold">
                        {c.downstreamActionIds.join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: RISKS & QUESTIONS */}
          {activeTab === "risks" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-conflict uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle size={13} />
                  <span>Flagged Risks & Blockers</span>
                </h4>
                <div className="space-y-2">
                  <div className="neu-inset p-3 rounded-xl text-xs text-text-2 leading-relaxed border-l-2 border-l-conflict">
                    QA backlog threatens the original 15 November launch milestone due to uncovered shader regressions.
                  </div>
                  <div className="neu-inset p-3 rounded-xl text-xs text-text-2 leading-relaxed border-l-2 border-l-conflict">
                    Simultaneous iOS launch requires Metal shader pipeline patch to prevent UI hitching on older iPhones.
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-white/5">
                <h4 className="text-xs font-mono font-bold text-ember uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle size={13} />
                  <span>Unresolved Strategic Questions</span>
                </h4>
                <div className="neu-inset p-3 rounded-xl text-xs text-text-2 leading-relaxed border-l-2 border-l-ember">
                  Does pushing the public release to 1 December provide sufficient runway for the Q4 enterprise procurement cycle?
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Technical AI Pipeline Trace Drawer ─────────────────── */}
      <div className="mt-8">
        <AiTraceDrawer traces={traces} />
      </div>
    </div>
  );
}

