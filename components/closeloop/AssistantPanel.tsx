"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Mic,
  Send,
  CornerDownLeft,
  Quote,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AssistantPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const SAMPLE_CITATIONS = [
  {
    role: "assistant",
    content:
      "Public launch is confirmed for **15 November 2026** with an Android-first rollout. iOS follows two weeks later on 29 November.",
    citations: [
      {
        meeting: "Launch Planning",
        date: "12 Oct",
        quote: "Public launch date is officially November 15th, 2026.",
        id: "dec_launch_date_001",
      },
      {
        meeting: "Scope Review",
        date: "19 Oct",
        quote: "Android ships first on Nov 15; iOS follows two weeks post-launch.",
        id: "dec_android_first_001",
      },
    ],
  },
  {
    role: "assistant",
    content:
      "⚠️ **Detected Conflict:** In the Tech Innovations Workshop (22 Oct), an engineering proposal suggested delaying to 1 Dec for vector re-indexing, but this was never promoted to an approved decision.",
    citations: [
      {
        meeting: "Tech Innovations Workshop",
        date: "22 Oct",
        quote: "Postpone Android public launch date to 1 December 2026.",
        id: "conf_schedule_clash_001",
      },
    ],
  },
];

const PROMPT_CHIPS = [
  "Summarize my previous two meetings.",
  "What did we decide about the launch date, and did anything change?",
  "Which tasks are due soon or affected by open conflicts?",
  "Show open conflicts",
];

export function AssistantPanel({ isOpen, onToggle }: AssistantPanelProps) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<any[]>(SAMPLE_CITATIONS);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSend(text?: string) {
    const q = (text || query).trim();
    if (!q || isLoading) return;

    const userMsg = {
      role: "user",
      content: q,
      citations: [],
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) throw new Error("Assistant response failed");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          citations: data.citations || [],
          toolsUsed: data.toolsUsed || [],
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Encountered an error querying memory: " + (err?.message || "Unknown error"),
          citations: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.aside
      initial={false}
      animate={{
        width: isOpen ? 380 : 0,
        opacity: isOpen ? 1 : 0,
      }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className={cn(
        "h-dvh sticky top-0 flex-shrink-0 flex flex-col border-l z-30 overflow-hidden",
        "bg-bg-1 border-white/5",
        !isOpen && "pointer-events-none"
      )}
      style={{ width: isOpen ? 380 : 0 }}
    >
      <div className="w-[380px] h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-ember/15 border border-ember/30 flex items-center justify-center">
              <Sparkles size={14} className="text-ember" />
            </div>
            <div>
              <div className="font-display font-bold text-xs text-text-1 flex items-center gap-1.5">
                <span>Grounded Memory Assistant</span>
                <span className="w-1.5 h-1.5 rounded-full bg-action animate-pulse" />
              </div>
              <div className="text-[10px] font-mono text-text-3">
                Cross-Meeting RAG · Zero Hallucination
              </div>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="neu-button p-1.5 rounded-lg text-text-3 hover:text-text-1"
            title="Collapse Assistant"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "p-3 rounded-xl text-xs leading-relaxed",
                msg.role === "user"
                  ? "neu-inset ml-6 text-text-1 border border-white/5"
                  : "neu-raised text-text-2 border border-white/5"
              )}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* Tools Executed indicator */}
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {msg.toolsUsed.map((t: string, tIdx: number) => (
                    <span
                      key={tIdx}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-text-3 border border-white/5"
                    >
                      ⚡ {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Clickable Grounded Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-white/5 space-y-1.5">
                  <div className="text-[9px] font-mono font-semibold uppercase tracking-wider text-text-3 flex items-center gap-1">
                    <ShieldCheck size={10} className="text-action" />
                    <span>Evidence Sources</span>
                  </div>
                  {msg.citations.map((c: any, cIdx: number) => (
                    <div
                      key={cIdx}
                      className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5 hover:border-decision/40 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-decision mb-0.5">
                        <span className="font-semibold flex items-center gap-1">
                          <Quote size={9} />
                          {c.meeting}
                        </span>
                        <span className="text-text-3">{c.date}</span>
                      </div>
                      <p className="text-[11px] text-text-3 italic line-clamp-1 group-hover:text-text-2">
                        "{c.quote}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="p-3 rounded-xl neu-raised border border-ember/20 bg-ember/5 text-xs text-text-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-ember animate-ping" />
              <span className="font-mono text-[11px] text-ember">Synthesizing institutional memory...</span>
            </div>
          )}
        </div>

        {/* Clickable Prompt Chips */}
        <div className="py-2.5">
          <div className="text-[10px] font-mono text-text-3 mb-1.5 uppercase tracking-wider">
            Quick Inquiries
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PROMPT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                className="text-[10px] font-ui px-2 py-1 rounded-lg bg-raised hover:bg-surface text-text-2 hover:text-text-1 border border-white/5 transition-all text-left"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Deep Recessed Input with Wispr Flow Dictation Badge */}
        <div className="pt-2 border-t border-white/5">
          <div className="neu-inset p-2 rounded-xl relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything across meetings..."
              rows={2}
              className="w-full bg-transparent text-xs text-text-1 placeholder:text-text-3 outline-none resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between pt-1 mt-1 border-t border-white/5">
              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-ember/90 bg-ember/10 px-1.5 py-0.5 rounded border border-ember/20">
                <Mic size={9} />
                <span>Wispr Flow dictation ready</span>
              </span>
              <button
                onClick={() => handleSend()}
                className="neu-button p-1.5 rounded-lg text-text-1 hover:text-ember transition-colors"
                title="Send inquiry"
              >
                <CornerDownLeft size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

