"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Send,
  Copy,
  Check,
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  FileText,
  User,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { EvidenceChip } from "@/components/closeloop/EvidenceChip";
import { getInMemoryStore, SEED_IDS } from "@/lib/db/seed";
import { formatIST, initials, cn } from "@/lib/utils";

export default function DigestPage() {
  const store = getInMemoryStore();
  const people = store.people;
  const actionItems = store.actionItems;
  const decisions = store.decisions;
  const conflicts = store.conflicts.filter((c: any) => c.status === "open");
  const meetings = store.meetings;
  const digests = store.digests || [];

  const [selectedPersonId, setSelectedPersonId] = useState<string>(people[0]?.id || SEED_IDS.PERSON_PRIYA);
  const [copiedMd, setCopiedMd] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  const selectedPerson = people.find((p: any) => p.id === selectedPersonId) || people[0];

  // Derive per-person items
  const personTasks = useMemo(() => {
    return actionItems.filter((a: any) => a.ownerId === selectedPersonId);
  }, [actionItems, selectedPersonId]);

  const overdueTasks = useMemo(() => {
    return personTasks.filter((a: any) => a.status === "overdue");
  }, [personTasks]);

  const activeTasks = useMemo(() => {
    return personTasks.filter((a: any) => a.status !== "completed" && a.status !== "rejected");
  }, [personTasks]);

  // Decisions affecting this person's domain
  const relevantDecisions = useMemo(() => {
    return decisions.filter((d: any) => {
      if (d.ownerId === selectedPersonId) return true;
      if (selectedPerson.role?.toLowerCase().includes("product") && (d.topic === "launch-date" || d.topic === "platform-scope")) return true;
      if (selectedPerson.role?.toLowerCase().includes("engineer") && (d.topic === "platform-scope" || d.topic === "launch-date")) return true;
      if (selectedPerson.role?.toLowerCase().includes("design") && d.topic === "design") return true;
      if (selectedPerson.role?.toLowerCase().includes("marketing") && (d.topic === "marketing" || d.topic === "budget" || d.topic === "ownership")) return true;
      if (selectedPerson.role?.toLowerCase().includes("qa") && (d.topic === "qa" || d.topic === "launch-date")) return true;
      return false;
    });
  }, [decisions, selectedPersonId, selectedPerson]);

  // Executive Intro per member
  const executiveIntro = useMemo(() => {
    const firstName = selectedPerson.name.split(" ")[0];
    if (selectedPerson.role?.includes("Product")) {
      return `Good Monday morning, ${firstName}. You have ${activeTasks.length} active roadmap commitments, with the launch date policy currently held under review for a potential 1 December shift. Both engineering and design syncs are awaiting your sign-off in the Review Gate.`;
    }
    if (selectedPerson.role?.includes("Engineering")) {
      return `Good Monday morning, ${firstName}. Your critical release branch cut is on the radar for this week, with candidate freeze scheduled immediately following Sana's test plan update. Ensure the Metal shader pipeline patches are merged before Thursday.`;
    }
    if (selectedPerson.role?.includes("Design")) {
      return `Good Monday morning, ${firstName}. Final production screen handoff is scheduled for today (Monday, 2 Nov) following the design freeze agreement. Localization team strings for Hindi and Japanese are staged for review.`;
    }
    if (selectedPerson.role?.includes("Marketing")) {
      return `Good Monday morning, ${firstName}. Your end-to-end campaign ownership has been reaffirmed with zero budget slips (4.0L locked). Creator honorarium guidelines should be distributed prior to the release freeze.`;
    }
    return `Good Monday morning, ${firstName}. QA regression testing begins Wednesday covering 42 test scenarios including Wispr Flow dictation benchmarks and offline fallback pipelines.`;
  }, [selectedPerson, activeTasks.length]);

  function handleExportMarkdown() {
    const md = `# Closeloop Weekly Digest: ${selectedPerson.name} (${selectedPerson.role})
**Week of 2 Nov 2026 · Northstar Labs**

> ${executiveIntro}

## 1. Commitments Due This Week (${activeTasks.length})
${activeTasks.map((t: any) => `- [${t.priority.toUpperCase()}] **${t.title}** (Due: ${t.deadlineText || "Scheduled"})`).join("\n")}

## 2. Institutional Decisions Affecting Your Domain (${relevantDecisions.length})
${relevantDecisions.map((d: any) => `- **[${d.topic.toUpperCase()}]** ${d.statement} *(Meeting: ${d.meetingId || "Sync"})*`).join("\n")}

## 3. Open Policy Conflicts Awaiting Resolution
${conflicts.map((c: any) => `- ⚠️ **${c.conflictType.toUpperCase()} CLASH:** ${c.explanation}`).join("\n")}

---
*Generated by Closeloop Institutional Memory System (IST)*
`;
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  }

  async function handleSendDigest() {
    setIsSending(true);
    try {
      // Simulate dispatching via In-App + optional Resend
      await new Promise((r) => setTimeout(r, 600));
      setSentNotice(`Digest successfully dispatched to ${selectedPerson.name} (${selectedPerson.email || "in-app notification"}).`);
      setTimeout(() => setSentNotice(null), 4000);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="p-6 max-w-[1240px] mx-auto space-y-8">
      {/* ── Top Header ───────────────────────────────────────── */}
      <div className="neu-raised p-6 rounded-2xl border border-white/5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Mail size={16} className="text-ember" />
            <span className="text-xs font-mono text-text-3 uppercase tracking-wider">
              Autonomous Weekly Briefing
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl text-text-1">
            Personalized <span className="font-serif italic text-decision font-normal">Weekly Digest</span>
          </h1>
          <p className="text-xs text-text-3 font-mono mt-1">
            Curated Monday morning intelligence: tasks, blockers, domain decisions, and conflict alerts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportMarkdown}
            className="neu-button px-3.5 py-2 rounded-xl text-xs font-mono flex items-center gap-1.5 text-text-2 hover:text-text-1 transition-colors"
          >
            {copiedMd ? <Check size={13} className="text-action" /> : <Copy size={13} />}
            <span>{copiedMd ? "Copied Markdown" : "Export Markdown"}</span>
          </button>

          <button
            disabled={isSending}
            onClick={handleSendDigest}
            className="neu-button neu-ember-glow px-4 py-2 rounded-xl text-xs font-display font-bold text-ember flex items-center gap-1.5 cursor-pointer"
          >
            <Send size={13} />
            <span>{isSending ? "Dispatching..." : "Send Digest Now"}</span>
          </button>
        </div>
      </div>

      {/* ── Team Member Switcher ──────────────────────────────── */}
      <div className="neu-raised p-2 rounded-2xl border border-white/5 flex flex-wrap items-center gap-2">
        {people.map((person: any) => {
          const isSelected = person.id === selectedPersonId;
          const color = person.accentColor || "#FF7A1A";

          return (
            <button
              key={person.id}
              onClick={() => setSelectedPersonId(person.id)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs flex items-center gap-2.5 transition-all cursor-pointer",
                isSelected
                  ? "neu-inset border border-white/10"
                  : "neu-flat hover:neu-raised border border-transparent hover:border-white/5"
              )}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: `${color}25`,
                  color,
                  border: `1px solid ${color}40`,
                }}
              >
                {initials(person.name)}
              </div>
              <div className="text-left">
                <div className={cn("font-medium", isSelected ? "text-text-1 font-bold" : "text-text-2")}>
                  {person.name}
                </div>
                <div className="text-[10px] font-mono text-text-3">
                  {person.role}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Editorial Digest Preview Card ────────────────────── */}
      <div className="neu-raised p-8 rounded-2xl border border-white/5 space-y-8">
        {/* Editorial Heading */}
        <div className="border-b border-white/5 pb-6">
          <div className="flex items-center justify-between text-xs font-mono text-text-3 mb-2">
            <span>Week 45 · November 2, 2026</span>
            <span>Northstar Labs · Mobile v2 Launch</span>
          </div>
          <h2 className="text-3xl font-serif italic text-text-1 font-normal tracking-wide">
            Executive Briefing for {selectedPerson.name}
          </h2>
          <p className="text-xs font-mono text-ember mt-1">
            Role: {selectedPerson.role} · Direct Email: {selectedPerson.email || `${selectedPerson.name.toLowerCase().replace(" ", ".")}@northstar.ai`}
          </p>
        </div>

        {/* Section 1: Personalized Executive Intro */}
        <div className="neu-inset p-5 rounded-xl border-l-2 border-l-decision bg-decision/[0.02] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-decision uppercase tracking-wider">
            <Sparkles size={13} />
            <span>Weekly Executive Intro</span>
          </div>
          <p className="text-sm text-text-1 leading-relaxed font-sans">
            {executiveIntro}
          </p>
        </div>

        {/* Section 2: Commitments Due This Week & Overdue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <h3 className="text-xs font-mono font-bold text-text-3 uppercase tracking-wider flex items-center gap-2">
              <Calendar size={14} className="text-action" />
              <span>Deliverables & Commitments ({activeTasks.length})</span>
            </h3>
            {overdueTasks.length > 0 && (
              <span className="text-[10px] font-mono font-bold text-conflict px-2 py-0.5 rounded bg-conflict/10 border border-conflict/20">
                {overdueTasks.length} Overdue
              </span>
            )}
          </div>

          {activeTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeTasks.map((t: any) => (
                <div key={t.id} className="neu-inset p-3.5 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-raised text-text-3 uppercase font-semibold">
                      {t.priority}
                    </span>
                    <span className={cn("font-bold", t.status === "overdue" ? "text-conflict" : "text-action")}>
                      {t.deadlineText || "Due this week"}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-text-1">
                    {t.title}
                  </p>
                  {t.meetingId && (
                    <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-text-3 border-t border-white/5">
                      <span>Source: {t.meetingId}</span>
                      <EvidenceChip utteranceId={t.evidenceUtteranceIds?.[0] || "utt_1"} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="neu-inset p-4 rounded-xl text-center text-xs text-text-3">
              Zero pending tasks assigned to {selectedPerson.name.split(" ")[0]} this week.
            </div>
          )}
        </div>

        {/* Section 3: Decisions Affecting Your Domain */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold text-text-3 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/5">
            <FileText size={14} className="text-ember" />
            <span>Institutional Decisions Affecting Your Domain ({relevantDecisions.length})</span>
          </h3>

          <div className="space-y-2.5">
            {relevantDecisions.map((d: any) => (
              <div key={d.id} className="neu-inset p-3.5 rounded-xl border border-white/5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 text-text-3">
                      {d.topic}
                    </span>
                    <span className="text-[10px] font-mono text-action font-semibold uppercase">
                      {d.status}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-text-1 leading-snug">
                    {d.statement}
                  </p>
                </div>
                {d.effectiveDate && (
                  <span className="text-xs font-mono text-text-3 flex-shrink-0">
                    {formatIST(d.effectiveDate)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Open Policy Conflicts or Clarifications */}
        {conflicts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-conflict uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/5">
              <ShieldAlert size={14} className="text-conflict" />
              <span>Cross-Meeting Conflicts Requiring Domain Alignment ({conflicts.length})</span>
            </h3>

            <div className="space-y-2">
              {conflicts.map((c: any) => (
                <div key={c.id} className="p-3.5 rounded-xl border border-conflict/30 bg-conflict/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-conflict font-bold uppercase">
                    <span>{c.conflictType} conflict · {c.severity} severity</span>
                    <Link href="/review" className="underline hover:text-text-1 flex items-center gap-1">
                      <span>Resolve in Review Gate</span>
                      <ArrowRight size={10} />
                    </Link>
                  </div>
                  <p className="text-xs text-text-1">
                    {c.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Sent Digest History Log ──────────────────────────── */}
      <div className="neu-raised p-6 rounded-2xl border border-white/5 space-y-3">
        <h4 className="text-xs font-mono font-bold text-text-3 uppercase tracking-wider">
          Sent Digest History Log ({digests.length} Generated)
        </h4>

        {digests.length > 0 ? (
          <div className="space-y-2">
            {digests.map((dig: any) => {
              const recipient = people.find((p: any) => p.id === dig.personId);
              return (
                <div key={dig.id} className="neu-inset p-3 rounded-xl flex items-center justify-between text-xs font-mono border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-text-1 font-semibold">{recipient?.name || dig.personId}</span>
                    <span className="text-text-3">· Week of {new Date(dig.weekStart).toLocaleDateString()}</span>
                  </div>
                  <span className="text-action">Dispatched ({dig.channel})</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-text-3 font-mono italic">
            No historical digests generated yet. Advance Time Machine past Monday 09:00 IST to trigger automatic weekly distribution.
          </p>
        )}
      </div>

      {/* Toast Feedback */}
      <AnimatePresence>
        {sentNotice && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-12 right-6 z-50 neu-raised px-4 py-3 rounded-xl border border-ember/30 bg-bg-1 text-xs font-mono text-ember flex items-center gap-2 shadow-2xl"
          >
            <Sparkles size={14} />
            <span>{sentNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
