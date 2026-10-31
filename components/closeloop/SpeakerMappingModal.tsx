"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Check, AlertCircle, Plus, X } from "lucide-react";
import { Person } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface SpeakerMappingModalProps {
  unmappedSpeakers: string[];
  roster: Person[];
  onConfirm: (mapping: Record<string, string>) => void;
  onClose: () => void;
}

export function SpeakerMappingModal({
  unmappedSpeakers,
  roster,
  onConfirm,
  onClose,
}: SpeakerMappingModalProps) {
  // Mapping state: { rawSpeakerName: personId }
  const [mapping, setMapping] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    unmappedSpeakers.forEach((s) => {
      // Simple fuzzy match: check if roster name contains speaker word
      const match = roster.find((p) =>
        p.name.toLowerCase().includes(s.toLowerCase()) ||
        s.toLowerCase().includes(p.name.toLowerCase().split(" ")[0])
      );
      if (match) initial[s] = match.id;
    });
    return initial;
  });

  const [bulkSpeakerId, setBulkSpeakerId] = useState<string>("");

  function handleBulkAssign() {
    if (!bulkSpeakerId) return;
    const updated: Record<string, string> = { ...mapping };
    unmappedSpeakers.forEach((s) => {
      updated[s] = bulkSpeakerId;
    });
    setMapping(updated);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg neu-raised p-6 rounded-2xl border border-white/10 shadow-2xl relative space-y-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-decision/15 border border-decision/30 flex items-center justify-center text-decision">
              <Users size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-text-1">
                Speaker Identity Mapping
              </h3>
              <p className="text-[11px] font-mono text-text-3">
                Map imported transcript labels to workspace team members
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-text-3 hover:text-text-1">
            <X size={16} />
          </button>
        </div>

        {/* Bulk Assign Section for unlabelled streams */}
        <div className="neu-inset p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
          <span className="text-text-3 font-mono text-[11px]">Bulk assign all unmapped:</span>
          <select
            value={bulkSpeakerId}
            onChange={(e) => setBulkSpeakerId(e.target.value)}
            className="neu-button px-2.5 py-1.5 rounded-lg text-xs text-text-1 bg-surface outline-none"
          >
            <option value="">Select team member...</option>
            {roster.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.role || "Member"})
              </option>
            ))}
          </select>
          <button
            onClick={handleBulkAssign}
            disabled={!bulkSpeakerId}
            className="neu-button px-3 py-1.5 rounded-lg text-xs font-semibold text-ember disabled:opacity-50"
          >
            Apply
          </button>
        </div>

        {/* Speaker Row Table */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {unmappedSpeakers.map((speaker) => {
            const assignedPersonId = mapping[speaker];
            return (
              <div
                key={speaker}
                className="p-3 rounded-xl neu-raised flex items-center justify-between gap-3 border border-white/5"
              >
                <div>
                  <div className="text-xs font-semibold text-text-1">{speaker}</div>
                  <div className="text-[10px] font-mono text-text-3">Imported Label</div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={assignedPersonId || ""}
                    onChange={(e) =>
                      setMapping((prev) => ({ ...prev, [speaker]: e.target.value }))
                    }
                    className="neu-button px-3 py-1.5 rounded-xl text-xs text-text-1 bg-surface outline-none font-ui"
                  >
                    <option value="">Select match...</option>
                    {roster.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
          <button
            onClick={onClose}
            className="neu-button px-4 py-2 rounded-xl text-xs font-medium text-text-3 hover:text-text-1"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(mapping)}
            className="neu-button neu-ember-glow px-5 py-2 rounded-xl text-xs font-semibold text-ember flex items-center gap-1.5"
          >
            <Check size={14} />
            <span>Confirm Mapping & Ingest</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

