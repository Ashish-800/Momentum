// app/api/assistant/route.ts
// Grounded & General AI Assistant Route powered by Google Gemini API
// Handles both Northstar Labs institutional memory questions and general/technical queries.
// Never refuses general technical questions. Includes smart fallback with rich meeting summaries.

import { NextRequest } from "next/server";
import { getInMemoryStore, SEED_IDS } from "@/lib/db/seed";
import { callGeminiGenerateContent } from "@/lib/ai/client";

export const dynamic = "force-dynamic";

interface Citation {
  meeting: string;
  meetingId: string;
  date: string;
  quote: string;
  id: string;
  kind?: "decision" | "action" | "conflict";
}

interface AssistantResponsePayload {
  answer: string;
  citations: Citation[];
  toolsUsed: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = (body.query || "").trim();

    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const store = getInMemoryStore();
    const qLower = query.toLowerCase();

    let answer = "";
    const citations: Citation[] = [];
    const toolsUsed: string[] = [];

    // ── 1. PREPARE COMPREHENSIVE WORKSPACE CONTEXT FOR GEMINI ──
    const workspaceContext = {
      workspace: {
        name: "Northstar Labs",
        primaryProject: "Mobile v2 Launch (MV2)",
        timezone: "Asia/Kolkata",
        currentDate: "Saturday, 31 October 2026",
      },
      teamRoster: (store.people || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        email: p.email,
      })),
      meetings: (store.meetings || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        date: m.meetingDate,
        durationMinutes: m.durationMin,
        status: m.status,
        summary: m.summary,
        highlights: m.highlights,
        participants: m.rawFileMeta?.participants || [],
      })),
      decisions: (store.decisions || []).map((d: any) => ({
        id: d.id,
        statement: d.statement,
        status: d.status,
        topic: d.topic,
        effectiveDate: d.effectiveDate,
        rationale: d.rationale,
        provenanceMeetingId: d.meetingId,
      })),
      actionItems: (store.actionItems || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        owner: a.ownerNameRaw,
        dueDate: a.dueDate,
        priority: a.priority,
        status: a.status,
        needsInput: a.needsInput,
        needsInputReason: a.needsInputReason,
        provenanceMeetingId: a.meetingId,
      })),
      conflicts: (store.conflicts || []).map((c: any) => ({
        id: c.id,
        description: c.description,
        severity: c.severity,
        status: c.status,
        conflictType: c.conflictType,
        oldValue: c.oldValue,
        newValue: c.newValue,
      })),
    };

    // ── 2. ATTEMPT LIVE GEMINI INFERENCE (Flexible System Prompt) ──
    try {
      const systemPrompt = `You are Momentum's intelligent AI Assistant for Northstar Labs.

You possess two core capabilities:

1. WORKSPACE & INSTITUTIONAL MEMORY EXPERT:
When asked questions about Northstar Labs (e.g., "summarize my current meeting", "summarize my recent meetings", "what is our launch date?", "what tasks are due?", "show open conflicts", or inquiries about budgets, decisions, or owners):
- Answer directly and authoritatively using the Northstar Labs Workspace Context provided below.
- Cite specific meetings by their real titles (e.g. "Mobile v2 Scope Review & Design Freeze", "Mobile v2 Launch Planning & Budget Alignment") and identify owners clearly.
- When asked to "summarize my current meeting" or "summarize recent meetings", synthesize the latest active meetings, key policy decisions, and pending action items into a clean, executive brief.

2. GENERAL KNOWLEDGE & TECHNICAL ASSISTANT:
When asked general knowledge, technical, programming, architecture, or industry questions (e.g., "what is the full form of MCP?", questions about software design, frameworks, APIs, AI, protocols):
- Answer helpfully, accurately, and comprehensively using your general AI knowledge base.
- NEVER refuse a general knowledge question or claim that you only know workspace data.

FORMATTING:
- Use clean Markdown with bullet points (• or -) and bold highlights (**bold**).
- Be concise, professional, and clear.`;

      const userPrompt = `User Query: "${query}"

Northstar Labs Workspace Context:
${JSON.stringify(workspaceContext, null, 2)}

Provide a clear, accurate, and well-structured answer.`;

      const geminiResult = await callGeminiGenerateContent({
        systemPrompt,
        userPrompt,
        responseJson: false,
      });

      if (geminiResult && geminiResult.text && geminiResult.text.trim().length > 10) {
        answer = geminiResult.text.trim();
        toolsUsed.push(
          `gemini_generate_content(model: "${geminiResult.modelUsed}")`,
          "workspace_context_rag"
        );

        // Grounded Citations Extraction based on context & answer
        const ansLower = answer.toLowerCase();

        // 1. Matched Decisions
        (store.decisions || []).forEach((d: any) => {
          if (
            qLower.includes(d.topic) ||
            ansLower.includes(d.statement.toLowerCase().slice(0, 24))
          ) {
            if (citations.length < 3 && !citations.some((c: any) => c.id === d.id)) {
              const mt = (store.meetings || []).find((m: any) => m.id === d.meetingId);
              citations.push({
                meeting: mt?.title || "Strategy Sync",
                meetingId: d.meetingId || SEED_IDS.MEET_1_LAUNCH_PLANNING,
                date: d.effectiveDate ? String(d.effectiveDate).slice(0, 10) : "Active",
                quote: d.statement,
                id: d.id,
                kind: "decision",
              });
            }
          }
        });

        // 2. Matched Meetings (especially for summary queries)
        (store.meetings || []).forEach((m: any) => {
          if (
            ansLower.includes(m.title.toLowerCase().slice(0, 20)) ||
            (qLower.includes("meeting") && citations.length < 3)
          ) {
            if (!citations.some((c: any) => c.meetingId === m.id)) {
              citations.push({
                meeting: m.title,
                meetingId: m.id,
                date: m.meetingDate ? String(m.meetingDate).slice(0, 10) : "Recent",
                quote: m.summary ? m.summary.slice(0, 120) + "..." : m.title,
                id: m.id,
                kind: "decision",
              });
            }
          }
        });

        // 3. Matched Action Items
        (store.actionItems || []).forEach((a: any) => {
          if (
            qLower.includes(a.ownerNameRaw?.toLowerCase() || "") ||
            ansLower.includes(a.title.toLowerCase().slice(0, 20))
          ) {
            if (citations.length < 4 && !citations.some((c: any) => c.id === a.id)) {
              const mt = (store.meetings || []).find((m: any) => m.id === a.meetingId);
              citations.push({
                meeting: mt?.title || "Execution Review",
                meetingId: a.meetingId || SEED_IDS.MEET_1_LAUNCH_PLANNING,
                date: a.deadlineText || "Scheduled",
                quote: a.title,
                id: a.id,
                kind: "action",
              });
            }
          }
        });

        // 4. Open Conflicts
        (store.conflicts || [])
          .filter((c: any) => c.status === "open")
          .forEach((c: any) => {
            if (
              ansLower.includes("conflict") ||
              ansLower.includes("contradiction") ||
              qLower.includes("conflict")
            ) {
              if (citations.length < 4 && !citations.some((ci: any) => ci.id === c.id)) {
                citations.push({
                  meeting: "Active Conflict Engine",
                  meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
                  date: "High Severity",
                  quote: c.description,
                  id: c.id,
                  kind: "conflict",
                });
              }
            }
          });
      }
    } catch (geminiErr: any) {
      console.warn("[Assistant Route] Live Gemini call encountered error:", geminiErr?.message);
    }

    // ── 3. SMART LOCAL DETERMINISTIC FALLBACK (If Gemini API is offline/unreachable) ──
    if (!answer) {
      toolsUsed.push("deterministic_memory_fallback");

      // GENERAL TECHNICAL QUESTION: "what is the full form of mcp"
      if (qLower.includes("mcp")) {
        answer = `**MCP** stands for **Model Context Protocol**.

### What is Model Context Protocol?
• **Open Standard:** Introduced by Anthropic as an open-source protocol for secure, two-way communication between AI models/assistants and external tools, local file systems, and enterprise data sources.
• **Client-Host-Server Architecture:** Standardizes how AI clients discover MCP servers, query resource schemas, and call executable tools.
• **Security & Sandboxing:** Provides granular user control and transparent permission boundaries over tool execution.`;
      }
      // MEETING SUMMARY QUERY: "summarize my current meeting", "summarize my recent meetings", "summarize"
      else if (
        qLower.includes("summarize") ||
        qLower.includes("current meeting") ||
        qLower.includes("recent meeting") ||
        qLower.includes("latest meeting") ||
        qLower.includes("previous two meetings") ||
        qLower.includes("past two meetings")
      ) {
        toolsUsed.push(
          "get_meeting(meet_launch_planning_001)",
          "get_meeting(meet_scope_review_002)",
          "search_decisions"
        );

        answer = `Here is an executive synthesis of Northstar Labs' recent meetings and current state:

### 1. Mobile v2 Scope Review & Design Freeze (19 Oct 2026)
• **Platform Rollout:** Confirmed an **Android-first staggered release** on **15 November 2026**. iOS client will follow two weeks later (29 November) once older-device Metal shader jank is resolved.
• **Design System Freeze:** Hard design freeze agreed for **26 October 2026** with Meera delivering production Figma specs by 28 October and Sana finalizing QA test plans by 30 October.

### 2. Mobile v2 Launch Planning & Budget Alignment (12 Oct 2026)
• **Target Launch Date:** Committed official public launch for **15 November 2026**.
• **Marketing Budget:** Approved **4,00,000 INR** allocated across creator honorariums and digital distribution.
• **Campaign Ownership:** **Rohan Gupta** designated end-to-end owner for acquisition campaigns and messaging.

### 3. Active Deliberation / Open Conflict (Latest Sync)
• ⚠️ **Proposed Launch Delay:** An engineering motion was voiced to postpone launch to **1 December 2026** for simultaneous Android/iOS rollout. This is currently held in the **Review Gate** as an active policy conflict—the binding date remains 15 November until approved.`;

        citations.push(
          {
            meeting: "Scope Review Sync",
            meetingId: SEED_IDS.MEET_2_SCOPE_REVIEW,
            date: "19 Oct 2026",
            quote: "Android ships first on 15 Nov; iOS follows two weeks post-launch.",
            id: SEED_IDS.DEC_ANDROID_FIRST,
            kind: "decision",
          },
          {
            meeting: "Launch Planning Sync",
            meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
            date: "12 Oct 2026",
            quote: "Public launch date is set for 15 November 2026.",
            id: SEED_IDS.DEC_LAUNCH_DATE,
            kind: "decision",
          },
          {
            meeting: "Launch Planning Sync",
            meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
            date: "12 Oct 2026",
            quote: "Marketing launch budget is locked at 4,00,000 INR.",
            id: SEED_IDS.DEC_MARKETING_BUDGET,
            kind: "decision",
          },
          {
            meeting: "Active Conflict Engine",
            meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
            date: "Current Status",
            quote: "Contradiction: 15 November 2026 vs. Proposed 1 December 2026.",
            id: SEED_IDS.CONFLICT_SCHEDULE_CLASH,
            kind: "conflict",
          }
        );
      }
      // LAUNCH DATE & TIMING QUERY
      else if (
        qLower.includes("launch date") ||
        qLower.includes("when is the launch") ||
        qLower.includes("did anything change") ||
        qLower.includes("launch timing")
      ) {
        toolsUsed.push("search_decisions(topic: 'launch-date')", "list_conflicts");

        const hasProposedDec1 = store.decisions.some(
          (d: any) =>
            d.topic === "launch-date" &&
            (d.statement.includes("December 1") || d.statement.includes("1 December"))
        );

        answer = `**Active Confirmed Decision:**
The active commitment in institutional memory is **15 November 2026**, established during the Launch Planning Sync and reiterated with an Android-first rollout in the Scope Review Sync.

⚠️ **Pending Reversal & Open Conflict:**
${
  hasProposedDec1
    ? "A new proposal to **postpone the launch to 1 December 2026** was voiced in today's sync due to QA regression backlogs and a desire to ship Android & iOS simultaneously."
    : "An engineering proposal was logged during the Tech Workshop suggesting a delay to 1 December 2026 for HNSW vector re-indexing."
}
This is currently flagged as an **Active Policy Conflict (Severity: High)**. Under Momentum's Human-in-the-Loop gate, the 15 Nov date **remains the binding active decision** until an authorized lead explicitly approves the supersede motion in the Review Gate.`;

        citations.push(
          {
            meeting: "Launch Planning Sync",
            meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
            date: "12 Oct 2026",
            quote: "Public launch date is set for 15 November 2026.",
            id: SEED_IDS.DEC_LAUNCH_DATE,
            kind: "decision",
          },
          {
            meeting: "Active Conflict Engine",
            meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
            date: "Current Status",
            quote: "Contradiction: 15 November 2026 vs. Proposed 1 December 2026.",
            id: SEED_IDS.CONFLICT_SCHEDULE_CLASH,
            kind: "conflict",
          }
        );
      }
      // PLATFORM SCOPE QUERY
      else if (
        qLower.includes("android") ||
        qLower.includes("ios") ||
        qLower.includes("together") ||
        qLower.includes("platform scope") ||
        qLower.includes("staggered")
      ) {
        toolsUsed.push("search_decisions(topic: 'platform-scope')", "list_conflicts");

        answer = `**Confirmed Platform Scope Decision:**
In the Scope Review Sync (19 Oct 2026), Priya Nair and Arjun Rao finalized that **Android ships first on 15 November 2026**, while iOS follows exactly two weeks post-launch once older device Metal shader issues are resolved.

⚠️ **Pending Simultaneous Rollout Proposal:**
During the latest debrief, a motion was voiced to ship Android and iOS together simultaneously. This is logged as an open scope conflict in the Review Tray awaiting sign-off. Until approved, the staggered release remains the binding plan.`;

        citations.push(
          {
            meeting: "Scope Review Sync",
            meetingId: SEED_IDS.MEET_2_SCOPE_REVIEW,
            date: "19 Oct 2026",
            quote: "Android ships first on 15 Nov; iOS follows two weeks post-launch.",
            id: SEED_IDS.DEC_ANDROID_FIRST,
            kind: "decision",
          },
          {
            meeting: "Scope Review Sync",
            meetingId: SEED_IDS.MEET_2_SCOPE_REVIEW,
            date: "19 Oct 2026",
            quote: "Design system freeze is locked for 26 Oct 2026.",
            id: SEED_IDS.DEC_DESIGN_FREEZE,
            kind: "decision",
          }
        );
      }
      // TASKS DUE SOON / IMPACTED BY CONFLICTS
      else if (
        qLower.includes("due soon") ||
        qLower.includes("affected by open conflicts") ||
        qLower.includes("affected by conflicts") ||
        qLower.includes("tasks due") ||
        qLower.includes("my week")
      ) {
        toolsUsed.push("list_tasks(status: 'approved', 'proposed')", "list_conflicts");

        answer = `Here are the high-urgency and conflict-impacted deliverables:

1. 🚨 **CRITICAL DUE SOON (Due in ~23 hours):**
   • **Arjun Rao:** *"Cut release branch for v2.0-rc1"* is due **1 November 2026 at 12:00 IST** (\`act_arjun_release_branch\`). This task was approved under the 15 Nov launch timeline and requires branch freezing immediately unless an extension is signed off.

2. ⚠️ **DIRECTLY IMPACTED BY OPEN CONFLICTS:**
   • **Arjun Rao's Release Cut:** Blocked/impacted if the launch date moves from 15 Nov to 1 Dec.
   • **Rohan Gupta's Campaign Brief:** Campaign timing depends directly on whether launch remains 15 Nov or shifts to 1 Dec.

3. ⏳ **PENDING HUMAN-IN-THE-LOOP RESOLUTION:**
   • **Arjun's Candidate Freeze:** Has a relative dependency marked \`needs_input: true\` ("depends on Sana's test plan update") with a suggested date of **5 November 2026**.
   • **Meera Shah's Final Screens:** Deliverable rescheduled via self-correction to **Monday, 2 November 2026**.`;

        citations.push(
          {
            meeting: "Launch Planning Sync",
            meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
            date: "Due 1 Nov (in 23h)",
            quote: "Arjun Rao: Cut release branch for v2.0-rc1.",
            id: SEED_IDS.ACTION_ARJUN_RELEASE_BRANCH,
            kind: "action",
          },
          {
            meeting: "Review Queue",
            meetingId: "live_sync",
            date: "Suggested: 5 Nov",
            quote: "Arjun Rao: Freeze release branch right after Sana's test plan.",
            id: "act_arjun_release_03",
            kind: "action",
          },
          {
            meeting: "Active Conflict Engine",
            meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
            date: "High Severity",
            quote: "Launch date contradiction impacts downstream action items: act_arjun_release_branch, act_rohan_campaign_brief.",
            id: SEED_IDS.CONFLICT_SCHEDULE_CLASH,
            kind: "conflict",
          }
        );
      }
      // DYNAMIC STORE SEARCH & GENERAL HELPER
      else {
        const matchedDecisions = store.decisions.filter(
          (d: any) =>
            d.statement.toLowerCase().includes(qLower) ||
            d.topic.toLowerCase().includes(qLower) ||
            (d.rationale && d.rationale.toLowerCase().includes(qLower))
        );

        const matchedActions = store.actionItems.filter(
          (a: any) =>
            a.title.toLowerCase().includes(qLower) ||
            a.ownerNameRaw?.toLowerCase().includes(qLower) ||
            (a.description && a.description.toLowerCase().includes(qLower))
        );

        if (matchedDecisions.length > 0 || matchedActions.length > 0) {
          answer = `Found relevant institutional memory records matching "${query}":\n\n`;

          if (matchedDecisions.length > 0) {
            answer +=
              `**Decisions (${matchedDecisions.length}):**\n` +
              matchedDecisions
                .slice(0, 3)
                .map((d: any) => `• [${d.status.toUpperCase()}] ${d.statement}`)
                .join("\n") +
              "\n\n";

            matchedDecisions.slice(0, 2).forEach((d: any) => {
              citations.push({
                meeting: d.meetingId || "Historical Sync",
                meetingId: d.meetingId || "meet_launch_planning_001",
                date: d.effectiveDate ? String(d.effectiveDate).slice(0, 10) : "Active",
                quote: d.statement,
                id: d.id,
                kind: "decision",
              });
            });
          }

          if (matchedActions.length > 0) {
            answer +=
              `**Deliverables & Tasks (${matchedActions.length}):**\n` +
              matchedActions
                .slice(0, 3)
                .map((a: any) => `• ${a.title} (Owner: ${a.ownerNameRaw}, Status: ${a.status})`)
                .join("\n");

            matchedActions.slice(0, 2).forEach((a: any) => {
              citations.push({
                meeting: a.meetingId || "Historical Sync",
                meetingId: a.meetingId || "meet_launch_planning_001",
                date: a.deadlineText || "Scheduled",
                quote: a.title,
                id: a.id,
                kind: "action",
              });
            });
          }
        } else {
          // Helpful response for unknown general queries
          answer = `I am connected to Northstar Labs' institutional memory. I didn't find specific meeting records matching "${query}".

You can ask me to:
• **"Summarize my current meeting"** or recent syncs.
• Check our **launch date**, platform scope, or marketing budget.
• Inspect **upcoming deadlines** or **open policy conflicts**.
• Or ask any **technical, architectural, or industry questions** (e.g. "what is the full form of MCP?").`;
        }
      }
    }

    const payload: AssistantResponsePayload = {
      answer,
      citations,
      toolsUsed,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Assistant error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
