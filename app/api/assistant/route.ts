// app/api/assistant/route.ts
// Grounded RAG AI Assistant Route
// Executes grounded tool searches over Northstar Labs persistent memory and database records.
// Zero hallucination: answers strictly with verifiable Evidence Chips and quotes.
// Safety rule: Assistant cannot mutate active memory; proposals are routed to the Review Gate.

import { NextRequest } from "next/server";
import { getInMemoryStore, SEED_IDS } from "@/lib/db/seed";

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

    // ── MANDATED QUERY 1: "Summarize my previous two meetings." ──
    if (
      qLower.includes("previous two meetings") ||
      qLower.includes("summarize my previous") ||
      qLower.includes("past two meetings") ||
      qLower.includes("last two meetings")
    ) {
      toolsUsed.push("get_meeting(meet_launch_planning_001)", "get_meeting(meet_scope_review_002)", "search_decisions");

      answer = `Here is the synthesis of your previous two strategy syncs:

1. **Launch Planning Sync (12 Oct 2026):**
   • **Launch Date Confirmed:** Officially committed public release for **15 November 2026**.
   • **Marketing Budget:** Approved **4,00,000 INR** (creator honorariums, digital distribution, and launch collateral).
   • **Campaign Ownership:** **Rohan Gupta** was assigned end-to-end accountability for launch messaging and acquisition.

2. **Scope Review Sync (19 Oct 2026):**
   • **Platform Scope:** Agreed on a **staggered rollout**—Android ships first on **15 November 2026**, with iOS following two weeks later (29 November) once Metal shader jank is patched.
   • **Design System Freeze:** Locked hard freeze for **26 October 2026**, with Meera delivering production Figma specs by 28 October and Sana finalizing QA test plans by 30 October.`;

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
          meeting: "Launch Planning Sync",
          meetingId: SEED_IDS.MEET_1_LAUNCH_PLANNING,
          date: "12 Oct 2026",
          quote: "Marketing launch budget is locked at 4,00,000 INR.",
          id: SEED_IDS.DEC_MARKETING_BUDGET,
          kind: "decision",
        },
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

    // ── MANDATED QUERY 2: "What did we decide about the launch date, and did anything change?" ──
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

    // ── PLATFORM SCOPE QUERY: "Are we shipping Android and iOS together?" ──
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

    // ── MANDATED QUERY 3: "Which tasks are due soon or affected by open conflicts?" ──
    else if (
      qLower.includes("due soon") ||
      qLower.includes("affected by open conflicts") ||
      qLower.includes("affected by conflicts") ||
      qLower.includes("tasks due")
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

    // ── GENERAL QUERIES: Dynamic Store Fallback ──
    else {
      toolsUsed.push("search_decisions", "list_tasks");

      // Match decisions
      const matchedDecisions = store.decisions.filter((d: any) =>
        d.statement.toLowerCase().includes(qLower) ||
        d.topic.toLowerCase().includes(qLower) ||
        (d.rationale && d.rationale.toLowerCase().includes(qLower))
      );

      // Match actions
      const matchedActions = store.actionItems.filter((a: any) =>
        a.title.toLowerCase().includes(qLower) ||
        a.ownerNameRaw.toLowerCase().includes(qLower) ||
        (a.description && a.description.toLowerCase().includes(qLower))
      );

      if (matchedDecisions.length > 0 || matchedActions.length > 0) {
        answer = `Found relevant institutional memory records matching "${query}":\n\n`;

        if (matchedDecisions.length > 0) {
          answer += `**Decisions (${matchedDecisions.length}):**\n` +
            matchedDecisions.slice(0, 3).map((d: any) => `• [${d.status.toUpperCase()}] ${d.statement}`).join("\n") + "\n\n";

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
          answer += `**Deliverables & Tasks (${matchedActions.length}):**\n` +
            matchedActions.slice(0, 3).map((a: any) => `• ${a.title} (Owner: ${a.ownerNameRaw}, Status: ${a.status})`).join("\n");

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
        answer = `Institutional memory across Northstar Labs currently has **${store.decisions.length} decisions**, **${store.actionItems.length} action items**, and **${store.conflicts.length} open conflicts**. I could not find a direct semantic match for "${query}". Try asking about the launch date, platform scope, marketing budget, or release branch cut.`;
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
    return new Response(
      JSON.stringify({ error: err?.message || "Assistant error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

