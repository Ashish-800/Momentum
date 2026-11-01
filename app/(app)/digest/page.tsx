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

  const [selectedPersonId, setSelectedPersonId] = useState<string>(SEED_IDS.PERSON_ARJUN || people[0]?.id || "per_arjun");
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

  const humanMeetingLabel = (meetingId?: string) => {
    if (!meetingId) return "Launch Planning (12 Oct)";
    if (meetingId.includes("001") || meetingId.includes("launch")) return "Launch Planning (12 Oct)";
    if (meetingId.includes("002") || meetingId.includes("mobile")) return "Mobile v2 Sync (Today)";
    return meetingId.replace(/^meet_/, "").replace(/_/g, " ");
  };

  return (
    <div className="p-6 max-w-[1240px] mx-auto space-y-6">
      {/* ── Top Header & Consolidated Member Switcher ─────────── */}
      <div className="neu-raised p-6 rounded-2xl border border-border-subtle bg-surface space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Mail size={16} className="text-ember" />
              <span className="text-xs font-mono text-text-3 uppercase tracking-wider">
                Autonomous Weekly Briefing
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl text-text-1">
              Personalized <span className="font-accent text-decision font-normal">Weekly Digest</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={isSending}
              onClick={handleSendDigest}
              className="btn-primary px-4 py-2.5 rounded-xl text-xs font-display font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Send size={13} />
              <span>{isSending ? "Dispatching..." : "Send Digest Now"}</span>
            </button>
          </div>
        </div>

        {/* Member Selector directly in Header */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-subtle">
          <span className="text-xs font-mono text-text-3 uppercase tracking-wider mr-1">Recipient:</span>
          {people.map((person: any) => {
            const isSelected = person.id === selectedPersonId;
            const color = person.accentColor || "#FF7A1A";

            return (
              <button
                key={person.id}
                onClick={() => setSelectedPersonId(person.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer",
                  isSelected
                    ? "bg-surface border border-border-strong shadow-sm font-bold text-text-1"
                    : "btn-secondary text-text-2 hover:text-text-1"
                )}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                  style={{
                    background: `${color}25`,
                    color,
                    border: `1px solid ${color}40`,
                  }}
                >
                  {initials(person.name)}
                </div>
                <span>{person.name.split(" ")[0]}</span>
                <span className="text-[10px] text-text-3 font-normal hidden sm:inline">({person.role.split(" ")[0]})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Editorial Digest Preview Card ────────────────────── */}
      <div className="neu-raised p-8 rounded-2xl border border-border-subtle bg-surface space-y-8">
        {/* Editorial Heading */}
        <div className="border-b border-border-subtle pb-6">
          <div className="flex items-center justify-between text-xs font-mono text-text-3 mb-2">
            <span>Week 45 · November 2, 2026</span>
            <span>Northstar Labs · Mobile v2 Launch</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-text-1 tracking-wide">
            Executive Briefing for {selectedPerson.name}
          </h2>
          <p className="text-xs font-mono text-ember mt-1">
            Role: {selectedPerson.role} · Direct Email: {selectedPerson.email || `${selectedPerson.name.toLowerCase().replace(" ", ".")}@northstar.ai`}
          </p>
        </div>

        {/* Section 1: Personalized Executive Intro (Warm High-Contrast Editorial Callout) */}
        <div className="p-5 rounded-xl border-l-4 border-l-[#EA580C] bg-[#FFF7ED] dark:bg-amber-950/20 border border-amber-500/20 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#EA580C] uppercase tracking-wider">
            <Sparkles size={13} />
            <span>Weekly Executive Intro</span>
          </div>
          <p className="text-[16px] text-[#0F172A] dark:text-slate-100 leading-relaxed font-sans font-medium">
            {executiveIntro}
          </p>
        </div>

        {/* Section 2: Commitments Due This Week & Overdue (Max 3 Short Bullet Cards) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <h3 className="text-xs font-mono font-bold text-text-3 uppercase tracking-wider flex items-center gap-2">
              <Calendar size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Deliverables & Commitments ({Math.min(activeTasks.length, 3)})</span>
            </h3>
            {overdueTasks.length > 0 && (
              <span className="text-[10px] font-mono font-bold pill-conflict px-2 py-0.5 rounded">
                {overdueTasks.length} Overdue
              </span>
            )}
          </div>

          {activeTasks.length > 0 ? (
            <div className="space-y-3">
              {activeTasks.slice(0, 3).map((t: any) => (
                <div key={t.id} className="p-4 rounded-xl border border-border-subtle bg-recessed flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                        t.priority === "critical" ? "pill-conflict" : t.priority === "high" ? "pill-warning" : "bg-surface text-text-3"
                      )}>
                        {t.priority}
                      </span>
                      <span className={cn("text-xs font-mono font-bold", t.status === "overdue" ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-400")}>
                        {t.deadlineText || "Due this week"}
                      </span>
                    </div>
                    <p className="text-[16px] font-semibold text-text-1">
                      {t.title}
                    </p>
                  </div>
                  {t.meetingId && (
                    <div className="flex items-center gap-2 text-xs font-mono text-text-3 flex-shrink-0">
                      <span>{humanMeetingLabel(t.meetingId)}</span>
                      {t.evidenceUtteranceIds?.[0] && (
                        <EvidenceChip utteranceId={t.evidenceUtteranceIds[0]} />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-3 font-medium">
              Zero pending tasks assigned to {selectedPerson.name.split(" ")[0]} this week.
            </p>
          )}
        </div>

        {/* Section 3: Decisions Affecting Your Domain (Max 3 Clean Bullets) */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold text-text-3 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-border-subtle">
            <FileText size={14} className="text-ember" />
            <span>Institutional Decisions Affecting Your Domain ({Math.min(relevantDecisions.length, 3)})</span>
          </h3>

          <div className="space-y-2.5">
            {relevantDecisions.slice(0, 3).map((d: any) => (
              <div key={d.id} className="p-4 rounded-xl border border-border-subtle bg-recessed flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface border border-border-subtle text-text-2 font-bold">
                      {d.topic}
                    </span>
                    <span className="text-[10px] font-mono pill-success font-semibold uppercase">
                      {d.status}
                    </span>
                  </div>
                  <p className="text-[16px] font-semibold text-text-1 leading-snug">
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

        {/* Section 4: Open Policy Conflicts (Max 1 Clean Alert) */}
        {conflicts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-border-subtle">
              <ShieldAlert size={14} className="text-rose-600 dark:text-rose-400" />
              <span>Cross-Meeting Conflicts Requiring Domain Alignment (1)</span>
            </h3>

            <div className="space-y-2">
              {conflicts.slice(0, 1).map((c: any) => (
                <div key={c.id} className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-rose-700 dark:text-rose-300 font-bold uppercase">
                    <span>{c.conflictType} conflict · {c.severity} severity</span>
                    <Link href="/review" className="underline hover:text-text-1 flex items-center gap-1 font-semibold">
                      <span>Resolve in Review Gate</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                  <p className="text-[15px] text-text-1 font-medium leading-relaxed">
                    {c.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Sent Digest History Log ──────────────────────────── */}
      <div className="neu-raised p-6 rounded-2xl border border-border-subtle bg-surface space-y-3">
        <h4 className="text-xs font-mono font-bold text-text-3 uppercase tracking-wider">
          Sent Digest History Log ({digests.length} Generated)
        </h4>

        {digests.length > 0 ? (
          <div className="space-y-2">
            {digests.map((dig: any) => {
              const recipient = people.find((p: any) => p.id === dig.personId);
              return (
                <div key={dig.id} className="p-3 rounded-xl flex items-center justify-between text-xs font-mono border border-border-subtle bg-recessed">
                  <div className="flex items-center gap-2">
                    <span className="text-text-1 font-semibold">{recipient?.name || dig.personId}</span>
                    <span className="text-text-3">· Week of {new Date(dig.weekStart).toLocaleDateString()}</span>
                  </div>
                  <span className="pill-success px-2 py-0.5 rounded text-[10px] font-bold">Dispatched ({dig.channel})</span>
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
