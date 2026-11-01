"use client";

import React, { useState } from "react";
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
  "Summarize my current meeting",
  "What is the full form of MCP?",
  "What did we decide about the launch date?",
  "Which tasks are due soon or affected by conflicts?",
  "Show open conflicts",
];

/**
 * Parses inline formatting: **bold**, `code`, *italic*
 * Eliminates raw asterisks and renders crisp HTML elements.
 */
function renderFormattedInline(text: string): React.ReactNode {
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`|\*[^*]+?\*)/g);
  return tokens.map((token, i) => {
    if (token.startsWith("**") && token.endsWith("**") && token.length >= 4) {
      return (
        <strong key={i} className="font-bold text-text-1">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("`") && token.endsWith("`") && token.length >= 2) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-surface border border-border-subtle font-mono text-[10px] text-ember"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith("*") && token.endsWith("*") && token.length >= 2) {
      return (
        <em key={i} className="italic text-text-2">
          {token.slice(1, -1)}
        </em>
      );
    }
    return token;
  });
}

/**
 * FormattedMessage — Renders Markdown text with bullet lists, headings, and bold highlights.
 * Prevents raw Markdown asterisks (**) from rendering to users.
 */
function FormattedMessage({ content }: { content: string }) {
  if (!content) return null;
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;

  function flushList() {
    if (!listType || listItems.length === 0) return;
    const items = [...listItems];
    const type = listType;
    listItems = [];
    listType = null;

    if (type === "ul") {
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="my-1.5 space-y-1 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
              <span className="text-ember font-bold select-none text-[11px] leading-none mt-1">•</span>
              <span className="flex-1">{renderFormattedInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      nodes.push(
        <ol key={`ol-${nodes.length}`} className="my-1.5 space-y-1 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
              <span className="font-mono text-text-3 font-semibold select-none text-[10px] min-w-[14px]">
                {idx + 1}.
              </span>
              <span className="flex-1">{renderFormattedInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    }
  }

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      nodes.push(<div key={`blank-${lineIdx}`} className="h-1" />);
      return;
    }

    // Header 3 or 4: ### or ####
    if (trimmed.startsWith("### ") || trimmed.startsWith("#### ")) {
      flushList();
      const headerText = trimmed.replace(/^#{3,4}\s+/, "");
      nodes.push(
        <h4
          key={`h4-${lineIdx}`}
          className="font-display font-bold text-xs text-text-1 mt-2.5 mb-1"
        >
          {renderFormattedInline(headerText)}
        </h4>
      );
      return;
    }

    // Header 2: ##
    if (trimmed.startsWith("## ")) {
      flushList();
      const headerText = trimmed.replace(/^##\s+/, "");
      nodes.push(
        <h3
          key={`h3-${lineIdx}`}
          className="font-display font-bold text-sm text-text-1 mt-3 mb-1"
        >
          {renderFormattedInline(headerText)}
        </h3>
      );
      return;
    }

    // Unordered bullet item: •, -, or *
    const ulMatch = trimmed.match(/^[-*•]\s+(.+)/);
    if (ulMatch) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(ulMatch[1]);
      return;
    }

    // Ordered item: 1. or 2.
    const olMatch = trimmed.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(olMatch[1]);
      return;
    }

    // Regular line
    flushList();
    nodes.push(
      <p key={`p-${lineIdx}`} className="leading-relaxed">
        {renderFormattedInline(line)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-1 text-xs leading-relaxed font-ui">{nodes}</div>;
}

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
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I could not reach the intelligence service. Please verify your network connection and try again.",
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
        "border-border-subtle",
        !isOpen && "pointer-events-none"
      )}
      style={{
        width: isOpen ? 380 : 0,
        backgroundColor: "var(--bg-1)",
        borderColor: "var(--border-subtle)",
        color: "var(--text-1)",
      }}
    >
      <div className="w-[380px] h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-ember/15 border border-ember/30 flex items-center justify-center">
              <Sparkles size={14} className="text-ember" />
            </div>
            <div>
              <div className="font-display font-bold text-xs text-text-1 flex items-center gap-1.5">
                <span>Momentum AI Assistant</span>
                <span className="w-1.5 h-1.5 rounded-full bg-action animate-pulse" />
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-mono text-text-3">
                  Workspace Memory & General AI
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-ember/10 text-ember border border-ember/20 text-[9px] font-mono font-semibold">
                  ⚡ Gemini Flash
                </span>
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
                  ? "neu-inset ml-6 text-text-1 border border-border-subtle bg-recessed"
                  : "neu-raised text-text-2 border border-border-subtle bg-surface"
              )}
            >
              {/* Markdown parsed and formatted content — zero raw asterisks */}
              <FormattedMessage content={msg.content} />

              {/* Tools Executed indicator */}
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1">
                  {msg.toolsUsed.map((t: string, tIdx: number) => (
                    <span
                      key={tIdx}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface text-text-3 border border-border-subtle"
                    >
                      ⚡ {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Clickable Grounded Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-border-subtle space-y-1.5">
                  <div className="text-[9px] font-mono font-semibold uppercase tracking-wider text-text-3 flex items-center gap-1">
                    <ShieldCheck size={10} className="text-action" />
                    <span>Evidence Sources</span>
                  </div>
                  {msg.citations.map((c: any, cIdx: number) => (
                    <div
                      key={cIdx}
                      className="p-1.5 rounded-lg bg-recessed border border-border-subtle hover:border-decision/40 transition-colors cursor-pointer group"
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
              <span className="font-mono text-[11px] text-ember">
                Thinking with Gemini Flash...
              </span>
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
                className="text-[10px] font-ui px-2 py-1 rounded-lg bg-surface hover:bg-recessed text-text-2 hover:text-text-1 border border-border-subtle transition-all text-left cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Query Input Box */}
        <div className="pt-2 border-t border-border-subtle">
          <div className="neu-inset p-1.5 rounded-xl border border-border-subtle flex items-center gap-2 bg-recessed">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about meetings, launch date, tasks, or tech..."
              className="flex-1 bg-transparent border-0 px-2.5 py-1.5 text-xs text-text-1 focus:outline-none placeholder:text-text-3"
            />
            <button
              onClick={() => handleSend()}
              disabled={!query.trim() || isLoading}
              className="w-8 h-8 rounded-lg bg-ember hover:bg-ember-hot text-white flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer shadow-sm"
              title="Send Inquiry"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
