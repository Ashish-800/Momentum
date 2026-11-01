"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare,
  Zap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  Send,
  ExternalLink,
  CheckCircle2,
  Calendar,
  X,
  FileText,
} from "lucide-react";
import { ConflictResolutionSplit } from "@/components/closeloop/ConflictResolutionSplit";
import { ApprovalCard } from "@/components/closeloop/ApprovalCard";
import { DEMO_SEED_DATA } from "@/lib/db/seed";
import { formatIST, cn } from "@/lib/utils";

export default function ReviewPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessResult, setSyncSuccessResult] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<"internal" | "trello">("internal");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load review state from API
  const loadReviewData = useCallback(async () => {
    try {
      const res = await fetch("/api/review");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("[Review Load Error]", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviewData();
  }, [loadReviewData]);

  // Flattened list of actionable cards for J/K navigation
  const allStagedItems = useMemo(() => {
    if (!data) return [];
    const decs = (data.stagedDecisions || []).map((d: any) => ({ ...d, _itemType: "decision" as const }));
    const acts = (data.stagedActions || []).map((a: any) => ({ ...a, _itemType: "action" as const }));
    return [...decs, ...acts];
  }, [data]);

  // Open conflicts check
  const openConflicts = useMemo(() => {
    return (data?.openConflicts || []).filter((c: any) => c.status === "open");
  }, [data?.openConflicts]);

  // Helper: check if item is locked by an unresolved conflict
  const isItemConflictLocked = useCallback(
    (item: any) => {
      return openConflicts.some((c: any) => {
        return (
          c.newDecisionId === item.id ||
          c.oldDecisionId === item.id ||
          c.newDecisionId === item.decisionId ||
          (c.downstreamActionIds || []).includes(item.id)
        );
      });
    },
    [openConflicts]
  );

  // ── Keyboard Shortcuts (J / K / E / X / Cmd+Enter) ─────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isSyncModalOpen) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        return;
      }

      if (e.key === "j" || e.key === "J" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(allStagedItems.length - 1, prev + 1));
      } else if (e.key === "k" || e.key === "K" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(0, prev - 1));
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        const current = allStagedItems[focusedIndex];
        if (current && !isItemConflictLocked(current) && !current.needsInput) {
          handleApprove(current.id);
        }
      } else if (e.key === "x" || e.key === "X") {
        e.preventDefault();
        const current = allStagedItems[focusedIndex];
        if (current) {
          handleReject(current.id);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [allStagedItems, focusedIndex, isItemConflictLocked, isSyncModalOpen]);

  // ── Handlers ───────────────────────────────────────────────
  async function handleApprove(itemId: string) {
    try {
      const res = await fetch("/api/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", itemId }),
      });
      if (res.ok) {
        showToast("Item approved — staged for sync dock");
        loadReviewData();
      } else {
        const err = await res.json();
        showToast(err.error || "Cannot approve item");
      }
    } catch {
      showToast("Approval error");
    }
  }

  async function handleReject(itemId: string) {
    try {
      const res = await fetch("/api/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", itemId }),
      });
      if (res.ok) {
        showToast("Item rejected and excluded from sync");
        loadReviewData();
      }
    } catch {
      showToast("Reject error");
    }
  }

  async function handleAcceptSuggestedFix(itemId: string) {
    try {
      const res = await fetch("/api/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept_suggested_fix", itemId }),
      });
      if (res.ok) {
        showToast("Accepted suggested fix: 5 Nov 2026");
        loadReviewData();
      } else {
        showToast("Fix error");
      }
    } catch {
      showToast("Fix error");
    }
  }

  async function handleSaveInlineEdit(itemId: string, updates: any) {
    try {
      const res = await fetch("/api/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "edit_item", itemId, updates }),
      });
      if (res.ok) {
        showToast("Item updated successfully");
        loadReviewData();
      }
    } catch {
      showToast("Save error");
    }
  }

  async function handleBulkApprove() {
    try {
      const res = await fetch("/api/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_approve" }),
      });
      if (res.ok) {
        const result = await res.json();
        showToast(`Bulk approved ${result.approvedCount} high-confidence items`);
        loadReviewData();
      }
    } catch {
      showToast("Bulk approve error");
    }
  }

  // ── Two-Step Confirmation Gate: Publish & Sync ─────────────
  async function handlePublishAndSync() {
    setIsSyncing(true);
    try {
      const approvedActionIds = (data?.approvedActions || []).map((a: any) => a.id);
      const approvedDecisionIds = (data?.stagedDecisions || [])
        .filter((d: any) => d.status === "approved" || d.status === "active")
        .map((d: any) => d.id);

      const itemIds = [...approvedActionIds, ...approvedDecisionIds];

      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemIds,
          targetProvider: selectedProvider,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        showToast(`Sync Rejected (409): ${json.error}`);
        setIsSyncing(false);
        return;
      }

      setSyncSuccessResult(json);
      setIsSyncModalOpen(false);
      showToast(json.message || "Items successfully published and synced!");
      loadReviewData();
    } catch (err: any) {
      showToast(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  const readyToSyncCount = (data?.approvedActions?.length || 0);

  return (
    <div className="p-6 max-w-[1280px] mx-auto space-y-8 pb-36">
      {/* ── Top Header Bar ───────────────────────────────────── */}
      <div className="neu-raised p-6 rounded-2xl border border-border-subtle flex flex-wrap items-center justify-between gap-4 bg-surface">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} className="text-ember" />
            <span className="text-xs font-mono text-text-3 uppercase tracking-wider">
              Human-in-the-Loop Review Tray
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl text-text-1">
            Review <span className="font-accent text-ember">Gate</span> & 3D Split Diff
          </h1>
        </div>

        {/* Bulk Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBulkApprove}
            className="btn-primary px-4 py-2.5 rounded-xl text-xs font-display font-bold flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Sparkles size={14} />
            <span>Approve All High-Confidence (≥ 85%)</span>
          </button>
        </div>
      </div>

      {/* ── SECTION 1: 3D SPLIT-DIFF CONFLICT RESOLUTION ─────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <h2 className="font-display font-bold text-base text-text-1">
              Active Policy Contradictions ({openConflicts.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-text-3">
            3D Spatial Split-Diff with Lineage Audit
          </span>
        </div>

        {openConflicts.length > 0 ? (
          <div className="space-y-6">
            {openConflicts.map((c: any) => {
              const oldDec = (data?.meetings || []).flatMap((m: any) => data?.stagedDecisions || []).find((d: any) => d.id === c.oldDecisionId) ||
                DEMO_SEED_DATA.decisions.find((d) => d.id === c.oldDecisionId);
              const newDec = (data?.stagedDecisions || []).find((d: any) => d.id === c.newDecisionId) ||
                DEMO_SEED_DATA.decisions.find((d) => d.id === c.newDecisionId);

              return (
                <ConflictResolutionSplit
                  key={c.id}
                  conflict={c}
                  oldDecision={oldDec}
                  newDecision={newDec}
                  onResolved={(action) => {
                    showToast(`Resolved conflict via ${action}`);
                    loadReviewData();
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="neu-inset p-5 rounded-2xl text-center text-xs text-text-3 border border-border-subtle space-y-1 bg-surface">
            <CheckCircle2 size={18} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-1" />
            <p className="font-semibold text-text-2">Zero Open Policy Conflicts</p>
            <p>All extracted statements are consistent with active institutional memory.</p>
          </div>
        )}
      </section>

      {/* ── SECTION 2: PROPOSED DECISIONS & DELIVERABLES ─────── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <CheckSquare size={16} className="text-ember" />
            <h2 className="font-display font-bold text-base text-text-1">
              Staged Proposals Awaiting Confirmation ({allStagedItems.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-text-3">
            Grouped by source meeting
          </span>
        </div>

        {allStagedItems.length > 0 ? (
          <div className="space-y-4">
            {allStagedItems.map((item: any, idx: number) => {
              const isLocked = isItemConflictLocked(item);

              return (
                <ApprovalCard
                  key={item.id}
                  item={item}
                  itemType={item._itemType}
                  people={data?.people || []}
                  isFocused={idx === focusedIndex}
                  hasConflictLock={isLocked}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onAcceptSuggestedFix={handleAcceptSuggestedFix}
                  onSaveInlineEdit={handleSaveInlineEdit}
                />
              );
            })}
          </div>
        ) : (
          <div className="neu-inset p-8 rounded-2xl text-center space-y-2 border border-border-subtle bg-surface">
            <CheckCircle2 size={24} className="mx-auto text-emerald-600 dark:text-emerald-400 mb-2" />
            <p className="text-sm font-semibold text-text-2">Review Tray Clear</p>
            <p className="text-xs text-text-3">All items have been approved, rejected, or published.</p>
          </div>
        )}
      </section>

      {/* ── TWO-STEP CONFIRMATION GATE: BOTTOM DOCK ─────────── */}
      <div className="fixed bottom-6 left-0 right-0 z-40 px-6 max-w-[1280px] mx-auto pointer-events-none">
        <div className="neu-raised p-4 rounded-2xl border border-border-strong shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-wrap items-center justify-between gap-4 pointer-events-auto bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
              {readyToSyncCount}
            </div>
            <div>
              <div className="text-xs font-display font-bold text-text-1 flex items-center gap-2">
                <span>Ready to Publish & Sync</span>
                {readyToSyncCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                )}
              </div>
              <p className="text-[11px] font-mono text-text-3">
                {readyToSyncCount} item{readyToSyncCount === 1 ? "" : "s"} approved and staged for two-step confirmation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Target provider selector */}
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs font-mono bg-surface border border-border-subtle text-text-1 outline-none"
            >
              <option value="internal">Momentum Internal Board</option>
              <option value="trello">Trello Board Sync</option>
            </select>

            {/* Final Sync Confirmation Trigger */}
            <button
              disabled={readyToSyncCount === 0}
              onClick={() => setIsSyncModalOpen(true)}
              className={cn(
                "px-5 py-2.5 rounded-xl font-display font-bold text-xs flex items-center gap-2 transition-all cursor-pointer",
                readyToSyncCount > 0
                  ? "btn-primary shadow-sm"
                  : "opacity-40 cursor-not-allowed bg-surface border border-border-subtle text-text-3"
              )}
            >
              <span>Publish & Sync {readyToSyncCount} Approved Items</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── TWO-STEP CONFIRMATION MODAL ───────────────────────── */}
      <AnimatePresence>
        {isSyncModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="neu-raised max-w-[560px] w-full p-6 rounded-2xl border border-border-strong space-y-5 bg-surface text-text-1 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-display font-bold text-base text-text-1">
                    Confirm Publish & Sync Gate
                  </h3>
                </div>
                <button
                  onClick={() => setIsSyncModalOpen(false)}
                  className="p-1.5 rounded-lg text-text-3 hover:text-text-1 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-text-2">
                <p>
                  You are publishing <strong className="text-text-1">{readyToSyncCount} approved item{readyToSyncCount === 1 ? "" : "s"}</strong> to:
                </p>

                <div className="p-3 rounded-xl font-mono text-[11px] space-y-1 bg-recessed border border-border-subtle">
                  <div>Target Destination: <span className="text-ember font-bold">{selectedProvider === "trello" ? "Trello REST API" : "Momentum Internal Board"}</span></div>
                  <div>Automated Reminders: <span className="text-emerald-700 dark:text-emerald-400 font-semibold">24 Hours & 2 Hours prior to due dates</span></div>
                  <div>Audit Trail: <span className="text-text-3 font-semibold">Logged to audit_logs table</span></div>
                </div>

                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {(data?.approvedActions || []).map((a: any) => (
                    <div key={a.id} className="p-2 rounded-lg bg-surface border border-border-subtle flex items-center justify-between font-mono text-[11px]">
                      <span className="truncate max-w-[280px] text-text-1">{a.title}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{a.deadlineText || "No date"}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                <button
                  onClick={() => setIsSyncModalOpen(false)}
                  className="btn-secondary px-4 py-2 rounded-xl text-xs text-text-2 hover:text-text-1 font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={isSyncing}
                  onClick={handlePublishAndSync}
                  className="btn-primary px-5 py-2 rounded-xl text-xs font-display font-bold flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Syncing with Backoff...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Execute Publish & Sync</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Toast Notification ────────────────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-24 right-6 z-50 neu-raised px-4 py-3 rounded-xl border border-ember/30 bg-bg-1/95 text-xs font-mono text-ember flex items-center gap-2 shadow-2xl"
          >
            <Sparkles size={14} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
