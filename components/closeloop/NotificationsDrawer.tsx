"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

export function NotificationsDrawer({
  isOpen,
  onClose,
  onCountChange,
}: NotificationsDrawerProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function loadNotifications() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        onCountChange?.(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("[Notifications Load Error]", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  async function handleAction(action: "mark_complete" | "snooze" | "dismiss", reminderId: string, actionItemId?: string) {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reminderId, actionItemId }),
      });
      loadNotifications();
    } catch (err) {
      console.error("[Notification Action Error]", err);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-md h-full bg-bg-1 border-l border-white/5 neu-raised p-6 flex flex-col justify-between shadow-2xl overflow-hidden"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-conflict/15 border border-conflict/30 flex items-center justify-center text-conflict">
                <Bell size={16} />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-text-1">
                  Automated Deadline Notifications
                </h3>
                <p className="text-[11px] font-mono text-text-3">
                  Time-Machine Fired Reminders (24h & 2h)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="neu-button p-2 rounded-xl text-text-3 hover:text-text-1"
            >
              <X size={15} />
            </button>
          </div>

          {/* Notification List */}
          <div className="space-y-3 max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="neu-inset p-4 rounded-xl border border-white/5 space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-conflict/20 text-conflict border border-conflict/30 font-bold uppercase text-[9px]">
                      {n.leadType} Lead Time
                    </span>
                    <span className="text-text-3 text-[10px]">
                      {n.personName || "Assignee"}
                    </span>
                  </div>

                  <p className="text-xs text-text-1 leading-relaxed font-medium">
                    {n.message || `Deadline alert for "${n.actionTitle}"`}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs font-mono">
                    {n.actionMeetingId && (
                      <Link
                        href={`/meetings/${n.actionMeetingId}`}
                        onClick={onClose}
                        className="text-[11px] text-ember hover:underline flex items-center gap-1 font-semibold"
                      >
                        <ExternalLink size={11} />
                        <span>Open Meeting</span>
                      </Link>
                    )}

                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        onClick={() => handleAction("snooze", n.id)}
                        className="neu-button px-2.5 py-1 rounded-lg text-[10px] text-text-3 hover:text-text-1 flex items-center gap-1"
                        title="Snooze for 4 hours"
                      >
                        <span>Snooze (+4h)</span>
                      </button>
                      <button
                        onClick={() => handleAction("mark_complete", n.id, n.actionItemId)}
                        className="neu-button px-2.5 py-1 rounded-lg text-[10px] text-action hover:bg-action/10 font-bold flex items-center gap-1"
                      >
                        <CheckCircle2 size={11} />
                        <span>Complete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="neu-inset p-8 rounded-2xl text-center space-y-2 border border-white/5">
                <CheckCircle2 size={24} className="mx-auto text-action mb-2" />
                <p className="text-xs font-semibold text-text-2">All Clear</p>
                <p className="text-[11px] text-text-3">
                  No fired reminders right now. Advance the Time Machine to trigger deadline alerts!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/5 text-[11px] font-mono text-text-3 flex items-center justify-between">
          <span>Simulation Clock: IST</span>
          <button
            onClick={loadNotifications}
            className="hover:text-ember flex items-center gap-1"
          >
            <RotateCw size={11} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </motion.aside>
    </div>
  );
}

