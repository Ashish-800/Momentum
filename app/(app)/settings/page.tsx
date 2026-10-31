"use client";
// app/(app)/settings/page.tsx — Workspace Settings, Team Roster & Integration Testing

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Users,
  Link2,
  Bell,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Download,
  Key,
  Check,
  X,
  Volume2,
} from "lucide-react";
import { getInMemoryStore, resetInMemoryStore } from "@/lib/db/seed";
import { formatIST, formatDateIST, cn } from "@/lib/utils";

export default function SettingsPage() {
  const [store, setStore] = useState(() => getInMemoryStore());
  const { workspace, people, integrations } = store;

  // State
  const [teamMembers, setTeamMembers] = useState(people);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");

  // Trello configuration
  const [trelloKey, setTrelloKey] = useState(process.env.NEXT_PUBLIC_TRELLO_KEY || "");
  const [trelloToken, setTrelloToken] = useState(process.env.NEXT_PUBLIC_TRELLO_TOKEN || "");
  const [trelloBoardId, setTrelloBoardId] = useState("board_northstar_mobile_v2");
  const [isTestingTrello, setIsTestingTrello] = useState(false);
  const [trelloStatus, setTrelloStatus] = useState<{
    tested: boolean;
    ok: boolean;
    message: string;
    boardName?: string;
  } | null>(null);

  // Reminders preferences
  const [reminder24h, setReminder24h] = useState(true);
  const [reminder2h, setReminder2h] = useState(true);
  const [soundChime, setSoundChime] = useState(true);

  // Demo reset
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Test Trello integration
  const handleTestTrello = async () => {
    setIsTestingTrello(true);
    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "trello",
          apiKey: trelloKey,
          apiToken: trelloToken,
          boardId: trelloBoardId,
        }),
      });
      const data = await res.json();
      setTrelloStatus({
        tested: true,
        ok: data.ok,
        message: data.message || (data.ok ? "Connected" : "Failed"),
        boardName: data.boardName,
      });
    } catch {
      setTrelloStatus({
        tested: true,
        ok: false,
        message: "Network error testing integration.",
      });
    } finally {
      setIsTestingTrello(false);
    }
  };

  // Reset demo state
  const handleResetDemoData = async () => {
    setIsResetting(true);
    try {
      const res = await fetch("/api/demo/seed", { method: "POST" });
      if (res.ok) {
        const fresh = resetInMemoryStore();
        setStore({ ...fresh });
        setTeamMembers(fresh.people);
        setToastMessage("Workspace restored to Northstar Labs baseline.");
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch {
      const fresh = resetInMemoryStore();
      setStore({ ...fresh });
      setToastMessage("Reset in-memory state.");
      setTimeout(() => setToastMessage(null), 2500);
    } finally {
      setIsResetting(false);
    }
  };

  // Save role edit
  const handleSaveRole = (personId: string) => {
    const updated = teamMembers.map((p: any) =>
      p.id === personId ? { ...p, role: editRole } : p
    );
    setTeamMembers(updated);
    // sync to store
    const target = store.people.find((p: any) => p.id === personId);
    if (target) target.role = editRole;

    setEditingPersonId(null);
    setToastMessage("Team member role updated.");
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Export workspace state
  const handleExportStateJSON = () => {
    const current = getInMemoryStore();
    const blob = new Blob([JSON.stringify(current, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `closeloop-workspace-state-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage("Workspace state JSON downloaded.");
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-8">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings size={16} className="text-ember" />
            <span className="text-[11px] font-mono text-text-3 uppercase tracking-wider">
              System Configuration
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-text-1">
            Workspace <span className="font-accent text-ember">Settings</span>
          </h1>
          <p className="text-text-3 text-xs mt-1">
            Manage team members, task tracker integrations, automated reminder triggers, and demo state.
          </p>
        </div>

        <button
          onClick={handleExportStateJSON}
          className="neu-button px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-mono text-text-2 hover:text-ember transition-colors"
        >
          <Download size={13} />
          <span>Export State JSON</span>
        </button>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="neu-raised px-4 py-2.5 rounded-xl border border-action/30 bg-action/10 text-action text-xs font-mono flex items-center gap-2"
          >
            <CheckCircle2 size={14} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. Team Roster Editor ──────────────────────────────── */}
      <section className="neu-raised p-6 rounded-2xl border border-white/5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-ember" />
            <h2 className="text-sm font-display font-bold text-text-1">
              Northstar Labs Team Roster ({teamMembers.length} Members)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-text-3">
            All members receive personalized Weekly Digests
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {teamMembers.map((person: any) => {
            const isEditing = editingPersonId === person.id;

            return (
              <div
                key={person.id}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-black"
                    style={{ background: person.accentColor || "#FF7A1A" }}
                  >
                    {person.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text-1">
                        {person.name}
                      </span>
                      <span className="text-[10px] font-mono text-text-3">
                        {person.email}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="neu-inset px-2.5 py-1 rounded text-xs text-text-1 outline-none w-64"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRole(person.id)}
                          className="p-1 rounded bg-action text-black text-xs font-mono"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => setEditingPersonId(null)}
                          className="p-1 rounded bg-raised text-text-3 text-xs"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-text-3 font-mono">
                        {person.role}
                      </p>
                    )}
                  </div>
                </div>

                {!isEditing && (
                  <button
                    onClick={() => {
                      setEditingPersonId(person.id);
                      setEditRole(person.role || "");
                    }}
                    className="neu-button px-2.5 py-1 rounded-lg text-[10px] font-mono text-text-3 hover:text-text-1"
                  >
                    Edit Role
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 2. Integrations: Trello & Internal Board ───────────── */}
      <section className="neu-raised p-6 rounded-2xl border border-white/5 space-y-5">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-action" />
            <h2 className="text-sm font-display font-bold text-text-1">
              External & Internal Task Tracker Adapters
            </h2>
          </div>
          <span className="text-[11px] font-mono text-action">
            Server Gate Active
          </span>
        </div>

        {/* Internal Board Status */}
        <div className="neu-inset p-4 rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-action shadow-[0_0_8px_#34D399]" />
              <span className="text-xs font-semibold text-text-1">
                Internal Board Adapter
              </span>
              <span className="text-[9px] font-mono px-2 py-0.2 rounded bg-action/20 text-action uppercase font-bold">
                Connected
              </span>
            </div>
            <p className="text-[11px] text-text-3 mt-1">
              In-memory institutional task store with zero external dependencies. Always active.
            </p>
          </div>
          <span className="text-xs font-mono text-text-3">4 Kanban Columns</span>
        </div>

        {/* Trello Integration Form */}
        <div className="neu-inset p-4 rounded-xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  trelloStatus?.ok
                    ? "bg-action shadow-[0_0_8px_#34D399]"
                    : "bg-warning"
                )}
              />
              <span className="text-xs font-semibold text-text-1">
                Trello Integration (Pluggable Adapter)
              </span>
            </div>
            {trelloStatus && (
              <span
                className={cn(
                  "text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase",
                  trelloStatus.ok
                    ? "bg-action/20 text-action"
                    : "bg-conflict/20 text-conflict"
                )}
              >
                {trelloStatus.ok ? "Connected & Verified" : "Unconfigured"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[10px] font-mono text-text-3 uppercase block mb-1">
                Trello API Key
              </label>
              <input
                type="text"
                value={trelloKey}
                onChange={(e) => setTrelloKey(e.target.value)}
                placeholder="Enter TRELLO_KEY or leave blank for demo mock"
                className="w-full neu-raised px-3 py-2 rounded-lg text-text-1 placeholder:text-text-3 outline-none font-mono text-xs border border-white/5"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-text-3 uppercase block mb-1">
                Trello API Token
              </label>
              <input
                type="password"
                value={trelloToken}
                onChange={(e) => setTrelloToken(e.target.value)}
                placeholder="Enter TRELLO_TOKEN"
                className="w-full neu-raised px-3 py-2 rounded-lg text-text-1 placeholder:text-text-3 outline-none font-mono text-xs border border-white/5"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-text-3 uppercase block mb-1">
                Target Board ID
              </label>
              <input
                type="text"
                value={trelloBoardId}
                onChange={(e) => setTrelloBoardId(e.target.value)}
                className="w-full neu-raised px-3 py-2 rounded-lg text-text-1 outline-none font-mono text-xs border border-white/5"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-text-3 font-mono">
              Creates cards with verbatim provenance, parent decision, and deep link.
            </span>
            <button
              onClick={handleTestTrello}
              disabled={isTestingTrello}
              className="neu-button px-4 py-2 rounded-xl text-xs font-mono font-semibold text-text-1 hover:text-ember transition-colors flex items-center gap-2"
            >
              {isTestingTrello ? (
                <RotateCcw size={12} className="animate-spin text-ember" />
              ) : (
                <Key size={12} />
              )}
              <span>{isTestingTrello ? "Testing Ping..." : "Test Connection"}</span>
            </button>
          </div>

          {trelloStatus && (
            <div
              className={cn(
                "p-3 rounded-lg text-xs font-mono flex items-center gap-2",
                trelloStatus.ok
                  ? "bg-action/10 text-action border border-action/20"
                  : "bg-warning/10 text-warning border border-warning/20"
              )}
            >
              {trelloStatus.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              <span>{trelloStatus.message}</span>
            </div>
          )}
        </div>
      </section>

      {/* ── 3. Notification & Reminder Lead Times ──────────────── */}
      <section className="neu-raised p-6 rounded-2xl border border-white/5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-warning" />
            <h2 className="text-sm font-display font-bold text-text-1">
              Time Machine Automated Reminder Preferences
            </h2>
          </div>
          <span className="text-[11px] font-mono text-text-3">
            Evaluated on every clock tick
          </span>
        </div>

        <div className="space-y-3">
          <label className="neu-inset p-3.5 rounded-xl flex items-center justify-between cursor-pointer border border-white/5">
            <div>
              <span className="text-xs font-semibold text-text-1 block">
                24-Hour Lead-Time Deadline Alert
              </span>
              <span className="text-[11px] text-text-3">
                Fire an in-app notification and email reminder 24 hours prior to task due date.
              </span>
            </div>
            <input
              type="checkbox"
              checked={reminder24h}
              onChange={(e) => setReminder24h(e.target.checked)}
              className="w-4 h-4 accent-ember rounded cursor-pointer"
            />
          </label>

          <label className="neu-inset p-3.5 rounded-xl flex items-center justify-between cursor-pointer border border-white/5">
            <div>
              <span className="text-xs font-semibold text-text-1 block">
                2-Hour Lead-Time Imminent Deadline Alert
              </span>
              <span className="text-[11px] text-text-3">
                Fire high-urgency alert when deadline is within 2 hours.
              </span>
            </div>
            <input
              type="checkbox"
              checked={reminder2h}
              onChange={(e) => setReminder2h(e.target.checked)}
              className="w-4 h-4 accent-ember rounded cursor-pointer"
            />
          </label>

          <label className="neu-inset p-3.5 rounded-xl flex items-center justify-between cursor-pointer border border-white/5">
            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-text-3" />
              <div>
                <span className="text-xs font-semibold text-text-1 block">
                  Audio Chime on Notification
                </span>
                <span className="text-[11px] text-text-3">
                  Play gentle tactile chime when new reminders fire.
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={soundChime}
              onChange={(e) => setSoundChime(e.target.checked)}
              className="w-4 h-4 accent-ember rounded cursor-pointer"
            />
          </label>
        </div>
      </section>

      {/* ── 4. Simulated Clock & Demo Reset ────────────────────── */}
      <section className="neu-raised p-6 rounded-2xl border border-white/5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-ember" />
            <h2 className="text-sm font-display font-bold text-text-1">
              Simulated Clock & Demonstration Controls
            </h2>
          </div>
          <span className="text-[11px] font-mono text-text-3">
            Current Anchor: Asia/Kolkata
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 neu-inset p-4 rounded-xl border border-white/5">
          <div>
            <span className="text-[10px] font-mono text-text-3 uppercase tracking-wider block mb-1">
              Active Simulation Clock
            </span>
            <div className="text-sm font-mono font-bold text-text-1">
              {formatIST(workspace.simNow, "EEEE, d MMM yyyy · HH:mm:ss")} IST
            </div>
          </div>

          <button
            onClick={handleResetDemoData}
            disabled={isResetting}
            className="neu-button px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-mono font-semibold text-text-1 hover:text-ember transition-colors"
          >
            <RotateCcw size={14} className={isResetting ? "animate-spin text-ember" : ""} />
            <span>{isResetting ? "Resetting Baseline..." : "Reset All Demo Data"}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
