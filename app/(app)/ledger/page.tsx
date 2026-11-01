"use client";
// app/(app)/ledger/page.tsx — Institutional Decision Ledger & 3D Conflict Radar

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Zap,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  GitBranch,
  ShieldAlert,
  Flame,
  Check,
  RotateCcw,
  ExternalLink,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { ConfidenceRing } from "@/components/closeloop/ConfidenceRing";
import { EvidenceChip } from "@/components/closeloop/EvidenceChip";
import { ConflictRadar3D } from "@/components/three/ConflictRadar3D";
import { getInMemoryStore, SEED_IDS } from "@/lib/db/seed";
import {
  topicIcon,
  statusLabel,
  statusClass,
  formatDateIST,
  formatIST,
  cn,
} from "@/lib/utils";

export default function LedgerPage() {
  const [store, setStore] = useState(() => getInMemoryStore());
  const { decisions, meetings, people, conflicts } = store;

  // View Tabs
  const [activeTab, setActiveTab] = useState<"ledger" | "radar">("ledger");

  // Filter States
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Radar Inspector Selection
  const [selectedConflictId, setSelectedConflictId] = useState<string>(
    conflicts[0]?.id || ""
  );
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getPersonById = (id: string | null | undefined) =>
    people.find((p: any) => p.id === id);

  const getMeetingById = (id: string | null | undefined) =>
    meetings.find((m: any) => m.id === id);

  // Filtered decisions
  const filteredDecisions = useMemo(() => {
    return decisions.filter((d: any) => {
      if (selectedTopic !== "all" && d.topic !== selectedTopic) return false;
      if (selectedStatus !== "all" && d.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesStatement = d.statement?.toLowerCase().includes(q);
        const matchesRationale = d.rationale?.toLowerCase().includes(q);
        const matchesTopic = d.topic?.toLowerCase().includes(q);
        if (!matchesStatement && !matchesRationale && !matchesTopic) return false;
      }
      return true;
    });
  }, [decisions, selectedTopic, selectedStatus, searchQuery]);

  // Group decisions by topic
  const groupedByTopic = useMemo(() => {
    const map = new Map<string, any[]>();
    filteredDecisions.forEach((d: any) => {
      const list = map.get(d.topic) || [];
      list.push(d);
      map.set(d.topic, list);
    });
    return Array.from(map.entries());
  }, [filteredDecisions]);

  // Selected conflict for radar inspector
  const activeConflict = useMemo(() => {
    return conflicts.find((c: any) => c.id === selectedConflictId) || conflicts[0];
  }, [conflicts, selectedConflictId]);

  // Lineage lookup helper
  const findLineageChain = (dec: any) => {
    const chain: any[] = [];
    // If this dec supersedes something
    if (dec.supersedesId) {
      const prior = decisions.find((d: any) => d.id === dec.supersedesId);
      if (prior) chain.push({ item: prior, relation: "prior" });
    }
    // If another decision supersedes this dec
    const successor = decisions.find((d: any) => d.supersedesId === dec.id);
    if (successor) {
      chain.push({ item: successor, relation: "successor" });
    }
    return chain;
  };

  // Export Ledger to Markdown
  const handleExportMarkdown = () => {
    const lines: string[] = [
      "# Momentum Institutional Decision Ledger",
      `**Workspace:** Northstar Labs (Mobile v2)`,
      `**Exported:** ${formatIST(new Date(), "yyyy-MM-dd HH:mm")} IST`,
      `**Total Records:** ${filteredDecisions.length}`,
      "",
      "---",
      "",
    ];

    groupedByTopic.forEach(([topic, decs]) => {
      lines.push(`## Topic: ${topic.toUpperCase().replace("-", " ")}`);
      lines.push("");
      decs.forEach((d) => {
        const owner = getPersonById(d.ownerId);
        const meeting = getMeetingById(d.meetingId);
        lines.push(`### [${d.status.toUpperCase()}] ${d.statement}`);
        if (d.rationale) lines.push(`> ${d.rationale}`);
        lines.push(`- **Owner:** ${owner ? owner.name : "Unassigned"}`);
        if (meeting) lines.push(`- **Provenance Meeting:** ${meeting.title} (${formatDateIST(meeting.meetingDate)})`);
        if (d.effectiveDate) lines.push(`- **Effective Date:** ${formatDateIST(d.effectiveDate)}`);
        lines.push(`- **Confidence Score:** ${d.confidence ? Math.round(d.confidence * 100) + "%" : "N/A"}`);
        if (d.supersedesId) lines.push(`- **Supersedes:** Decision ID \`${d.supersedesId}\``);
        lines.push("");
      });
      lines.push("");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `momentum-decision-ledger-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage("Institutional Decision Ledger exported to Markdown.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Resolve conflict directly from Radar Inspector
  const handleResolveConflict = async (
    conflictId: string,
    action: "resolved_keep_old" | "resolved_supersede" | "resolved_escalated" | "resolved_both_valid"
  ) => {
    setResolvingId(conflictId);
    try {
      const res = await fetch(`/api/conflicts/${conflictId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          resolutionNote: `Resolved via 3D Conflict Radar inspector (${action.replace("resolved_", "").replace("_", " ")})`,
          resolvedBy: "Priya Nair",
        }),
      });

      if (res.ok) {
        // Refresh local store
        const updatedStore = getInMemoryStore();
        setStore({ ...updatedStore });
        setToastMessage(`Conflict successfully resolved: ${action.replace("resolved_", "").replace("_", " ")}.`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch {
      setToastMessage("Failed to resolve conflict. Check network.");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      {/* ── Header Row ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-ember" />
            <span className="text-[11px] font-mono text-text-3 uppercase tracking-wider">
              Persistent Institutional Memory
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-text-1">
            Decision Ledger & <span className="font-accent text-decision">Lineage</span>
          </h1>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-3">
          <div className="neu-inset p-1 rounded-xl flex items-center gap-1 border border-border-subtle bg-recessed">
            <button
              onClick={() => setActiveTab("ledger")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-2 cursor-pointer",
                activeTab === "ledger"
                  ? "bg-surface text-ember font-bold shadow-sm border border-border-subtle"
                  : "text-text-3 hover:text-text-1"
              )}
            >
              <BookOpen size={13} />
              <span>Decision Ledger</span>
            </button>
            <button
              onClick={() => setActiveTab("radar")}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-2 relative cursor-pointer",
                activeTab === "radar"
                  ? "bg-surface text-rose-600 dark:text-rose-400 font-bold shadow-sm border border-border-subtle"
                  : "text-text-3 hover:text-text-1"
              )}
            >
              <ShieldAlert size={13} />
              <span>3D Conflict Radar</span>
              {conflicts.filter((c: any) => c.status === "open").length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="neu-raised px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-mono flex items-center gap-2 shadow-lg"
          >
            <CheckCircle2 size={14} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TAB 1: DECISION LEDGER ───────────────────────────── */}
      {activeTab === "ledger" && (
        <div className="space-y-6">
          {/* Streamlined Filter & Search Bar */}
          <div className="neu-raised p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-border-subtle bg-surface">
            {/* Search */}
            <div className="flex-1 neu-inset px-3 py-2 rounded-xl flex items-center gap-2 border border-border-subtle bg-recessed">
              <Search size={14} className="text-text-3 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search decisions, rationales, owners, topics..."
                className="w-full bg-transparent text-xs text-text-1 placeholder:text-text-3 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-text-3 hover:text-text-1 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Topic Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-mono bg-surface border border-border-subtle text-text-1 outline-none cursor-pointer"
              >
                <option value="all">All Topics</option>
                <option value="launch-date">Launch Date</option>
                <option value="platform-scope">Platform Scope</option>
                <option value="budget">Budget</option>
                <option value="ownership">Ownership</option>
                <option value="design">Design</option>
                <option value="qa">QA</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 border-l border-border-subtle pl-2">
              {["all", "active", "superseded", "proposed"].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-[11px] font-mono capitalize transition-all cursor-pointer",
                    selectedStatus === st
                      ? "btn-secondary font-bold text-text-1 border-border-strong"
                      : "text-text-3 hover:text-text-2"
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Grouped Decisions List */}
          <div className="space-y-6">
            {groupedByTopic.map(([topic, decList]) => (
              <div key={topic} className="space-y-3">
                {/* Topic Header */}
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <span className="text-lg">{topicIcon(topic)}</span>
                  <h2 className="font-display font-semibold text-sm text-text-1 capitalize tracking-wide">
                    {topic.replace("-", " ")} Domain
                  </h2>
                  <span className="text-[10px] font-mono text-text-3">
                    ({decList.length} {decList.length === 1 ? "record" : "records"})
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {decList.map((dec: any, i: number) => {
                    const owner = getPersonById(dec.ownerId);
                    const meeting = getMeetingById(dec.meetingId);
                    const lineage = findLineageChain(dec);
                    const isSuperseded = (dec.status as string) === "superseded";

                    return (
                      <motion.div
                        key={dec.id}
                        className={cn(
                          "neu-raised p-5 rounded-2xl relative overflow-hidden transition-all bg-surface border border-border-subtle",
                          isSuperseded && "opacity-75 border-l-4 border-l-text-3"
                        )}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.04 }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Status & Topic Badges */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span
                                className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider",
                                  dec.status === "active" ? "pill-success" : dec.status === "superseded" ? "pill-warning" : "pill-info"
                                )}
                              >
                                {statusLabel(dec.status)}
                              </span>

                              {meeting && (
                                <Link
                                  href={`/meetings/${meeting.id}`}
                                  className="text-[10px] font-mono text-text-3 hover:text-ember transition-colors flex items-center gap-1"
                                >
                                  <span>{meeting.title}</span>
                                  <ExternalLink size={10} />
                                </Link>
                              )}

                              {dec.effectiveDate && (
                                <span className="text-[10px] font-mono text-text-3">
                                  · Effective: {formatDateIST(dec.effectiveDate)}
                                </span>
                              )}
                            </div>

                            {/* Statement */}
                            <h3
                              className={cn(
                                "text-sm font-display font-semibold text-text-1 leading-snug mb-3",
                                isSuperseded && "line-through text-text-3"
                              )}
                            >
                              {dec.statement}
                            </h3>

                            {/* ── VISUAL LINEAGE CHAIN ────────────────── */}
                            {lineage.length > 0 && (
                              <div className="rounded-xl p-3 mb-3 border-l-[3px] border-l-indigo-500 bg-recessed border border-border-subtle space-y-1.5">
                                <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
                                  <GitBranch size={11} />
                                  <span>Decision Lineage Chain</span>
                                </div>
                                {lineage.map(({ item, relation }: any) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-2 text-xs font-mono"
                                  >
                                    {relation === "prior" ? (
                                      <>
                                        <span className="text-text-3">Supersedes:</span>
                                        <span className="line-through text-text-3">
                                          {item.statement}
                                        </span>
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface border border-border-subtle text-text-3 font-bold">
                                          Previous
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-text-3">↳ Superseded by:</span>
                                        <ArrowRight size={12} className="text-ember" />
                                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                          {item.statement}
                                        </span>
                                        <span className="text-[9px] px-1.5 py-0.2 rounded pill-success">
                                          Active Consensus
                                        </span>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Meta & Evidence Chips */}
                            <div className="flex items-center gap-3 flex-wrap pt-1">
                              {owner && (
                                <span className="text-[10px] font-mono text-text-3 flex items-center gap-1">
                                  <span>Owner:</span>
                                  <span
                                    className="font-semibold"
                                    style={{ color: owner.accentColor ?? "#FF7A1A" }}
                                  >
                                    {owner.name}
                                  </span>
                                </span>
                              )}

                              <span className="text-[10px] font-mono text-text-3">
                                Logged: {formatDateIST(dec.createdAt)}
                              </span>

                              {Array.isArray(dec.evidenceUtteranceIds) && dec.evidenceUtteranceIds.length > 0 && (
                                <EvidenceChip
                                  utteranceId={dec.evidenceUtteranceIds[0]}
                                  speakerName="View Source Transcript"
                                />
                              )}
                            </div>
                          </div>

                          {/* Radial Confidence Ring */}
                          <div className="flex-shrink-0 pt-1">
                            {dec.confidence != null && (
                              <ConfidenceRing
                                score={dec.confidence}
                                size={44}
                                strokeWidth={2.8}
                              />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}

            {filteredDecisions.length === 0 && (
              <div className="neu-inset rounded-2xl p-12 text-center">
                <BookOpen size={24} className="mx-auto text-text-3 mb-2 opacity-50" />
                <p className="text-sm font-semibold text-text-2">
                  No matching decisions in ledger
                </p>
                <p className="text-xs text-text-3 mt-1">
                  Adjust filters or reset the search query to view all institutional memory.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: 3D CONFLICT RADAR & INSPECTOR ─────────────── */}
      {activeTab === "radar" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Cols: Interactive 3D Radar */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className="text-conflict" />
                  <span className="text-xs font-mono font-semibold text-text-2 uppercase tracking-wider">
                    Cross-Meeting Contradiction Radar
                  </span>
                </div>
                <span className="text-[11px] font-mono text-text-3">
                  Click any glowing node to inspect
                </span>
              </div>

              <ConflictRadar3D
                conflicts={conflicts}
                selectedConflictId={activeConflict?.id}
                onSelectConflict={(c) => setSelectedConflictId(c.id)}
                className="h-[460px]"
              />

              {/* Radar Legend */}
              <div className="neu-raised p-3 rounded-xl flex items-center justify-around text-xs font-mono border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-conflict shadow-[0_0_8px_#FF4D6D]" />
                  <span className="text-text-3">High Severity (Outer)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-warning shadow-[0_0_8px_#FFC247]" />
                  <span className="text-text-3">Medium (Mid)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-decision shadow-[0_0_8px_#38BDF8]" />
                  <span className="text-text-3">Low / Contextual</span>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Deep Conflict Inspector & Resolution Panel */}
            <div className="lg:col-span-5 space-y-4">
              <div className="neu-raised p-5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        activeConflict?.severity === "high"
                          ? "bg-conflict animate-pulse"
                          : "bg-warning"
                      )}
                    />
                    <h3 className="text-sm font-display font-bold text-text-1">
                      Conflict Inspector
                    </h3>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase",
                      activeConflict?.status === "open"
                        ? "bg-conflict/20 text-conflict border border-conflict/30"
                        : "bg-action/20 text-action border border-action/30"
                    )}
                  >
                    {activeConflict?.status}
                  </span>
                </div>

                {activeConflict ? (
                  <div className="space-y-4">
                    {/* Conflict Explanation */}
                    <div>
                      <span className="text-[10px] font-mono text-text-3 uppercase tracking-wider block mb-1">
                        Detected Contradiction
                      </span>
                      <p className="text-xs text-text-2 leading-relaxed font-ui">
                        {activeConflict.explanation}
                      </p>
                    </div>

                    {/* Historical vs Proposed Comparison */}
                    <div className="space-y-2">
                      {/* Left / Historical */}
                      <div className="neu-inset p-3 rounded-xl border border-white/5">
                        <span className="text-[9px] font-mono text-text-3 uppercase tracking-wider block mb-0.5">
                          Active Baseline Memory
                        </span>
                        <div className="text-xs font-semibold text-text-1 mb-1">
                          {activeConflict.oldValue}
                        </div>
                        {activeConflict.oldQuote && (
                          <div className="text-[11px] text-text-3 italic border-l-2 border-decision/40 pl-2">
                            "{activeConflict.oldQuote}"
                          </div>
                        )}
                      </div>

                      {/* Right / Proposed */}
                      <div className="neu-inset p-3 rounded-xl border border-conflict/20 bg-conflict/5">
                        <span className="text-[9px] font-mono text-conflict uppercase tracking-wider block mb-0.5">
                          New Incoming Proposal
                        </span>
                        <div className="text-xs font-semibold text-conflict mb-1">
                          {activeConflict.newValue}
                        </div>
                        {activeConflict.newQuote && (
                          <div className="text-[11px] text-text-3 italic border-l-2 border-conflict/40 pl-2">
                            "{activeConflict.newQuote}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Downstream Actions impacted */}
                    {activeConflict.downstreamActionIds &&
                      activeConflict.downstreamActionIds.length > 0 && (
                        <div className="p-3 rounded-xl border border-border-subtle bg-recessed">
                          <span className="text-[10px] font-mono text-text-3 uppercase tracking-wider block mb-2 font-bold">
                            Downstream Impacted Tasks ({activeConflict.downstreamActionIds.length})
                          </span>
                          <div className="text-xs font-mono space-y-1.5">
                            {activeConflict.downstreamActionIds.map((aid: string) => {
                              let label = aid;
                              if (aid.includes("arjun") || aid.includes("release_branch")) label = "Arjun Rao — Cut release branch";
                              else if (aid.includes("rohan") || aid.includes("campaign_brief")) label = "Rohan Gupta — Deliver launch campaign brief";
                              return (
                                <div key={aid} className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border-subtle">
                                  <span className="text-text-1 font-semibold">{label}</span>
                                  <span className="text-rose-600 dark:text-rose-400 font-bold text-[10px]">Review Required</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    {/* Immediate 4-Action Resolution Buttons */}
                    {activeConflict.status === "open" ? (
                      <div className="space-y-2 pt-2 border-t border-border-subtle">
                        <span className="text-[10px] font-mono text-text-3 uppercase tracking-wider block font-bold">
                          Execute Resolution Gate
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() =>
                              handleResolveConflict(activeConflict.id, "resolved_supersede")
                            }
                            disabled={resolvingId === activeConflict.id}
                            className="btn-primary p-2.5 rounded-xl text-left cursor-pointer transition-all shadow-sm"
                          >
                            <span className="block font-bold text-xs text-white">Accept 1 Dec</span>
                            <span className="text-[10px] text-white/80 font-normal">
                              Supersede baseline
                            </span>
                          </button>

                          <button
                            onClick={() =>
                              handleResolveConflict(activeConflict.id, "resolved_keep_old")
                            }
                            disabled={resolvingId === activeConflict.id}
                            className="btn-secondary p-2.5 rounded-xl text-left cursor-pointer transition-all"
                          >
                            <span className="block font-bold text-xs text-text-1">Keep 15 Nov</span>
                            <span className="text-[10px] text-text-3 font-normal">
                              Reject 1 Dec slip
                            </span>
                          </button>

                          <button
                            onClick={() =>
                              handleResolveConflict(activeConflict.id, "resolved_escalated")
                            }
                            disabled={resolvingId === activeConflict.id}
                            className="btn-secondary p-2.5 rounded-xl text-left cursor-pointer transition-all"
                          >
                            <span className="block font-bold text-xs text-text-1">Escalate</span>
                            <span className="text-[10px] text-text-3 font-normal">
                              Flag to Priya
                            </span>
                          </button>

                          <button
                            onClick={() =>
                              handleResolveConflict(activeConflict.id, "resolved_both_valid")
                            }
                            disabled={resolvingId === activeConflict.id}
                            className="btn-secondary p-2.5 rounded-xl text-left cursor-pointer transition-all"
                          >
                            <span className="block font-bold text-xs text-text-1">Both Valid</span>
                            <span className="text-[10px] text-text-3 font-normal">
                              Dual track
                            </span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pill-success p-3 rounded-xl text-xs font-mono font-bold">
                        ✓ This conflict was resolved ({activeConflict.status}). Lineage chain has been synchronized.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-3 text-xs">
                    Select a node on the radar to inspect.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
