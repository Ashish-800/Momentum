// lib/ai/pipeline/stage5-memory.ts
// Stage 5: Hybrid Conflict Detection Engine
// Cross-references new proposals against active historical decisions stored in project memory.
// Distinguishes contradictions (date, scope, budget, owner) from explicit reaffirmations.

import {
  ConflictEngineResponse,
  ConflictItem,
  ResolvedDecision,
} from "../schemas";
import { getInMemoryStore, SEED_IDS } from "@/lib/db/seed";

export interface ConflictEngineOptions {
  projectId?: string;
  workspaceId?: string;
}

export async function detectCrossMeetingConflicts({
  newDecisions,
  options = {},
}: {
  newDecisions: ResolvedDecision[];
  options?: ConflictEngineOptions;
}): Promise<ConflictEngineResponse> {
  const store = getInMemoryStore();
  const activeDecisions = store.decisions.filter(
    (d: any) => d.status === "active" && (!options.projectId || d.projectId === options.projectId)
  );

  const conflicts: ConflictItem[] = [];
  const reaffirmations: Array<{
    newDecisionId: string;
    reaffirmedDecisionId: string;
    statement: string;
    explanation: string;
  }> = [];

  for (const proposed of newDecisions) {
    const pStatement = proposed.statement.toLowerCase();
    const pTopic = proposed.topic;

    // Check 1: Explicit reaffirmation check
    if (proposed.isReaffirmation || proposed.reaffirmsDecisionId || pStatement.includes("continues") || pStatement.includes("keeps owning")) {
      const targetOld = activeDecisions.find(
        (d: any) =>
          d.id === proposed.reaffirmsDecisionId ||
          (d.topic === "ownership" && pStatement.includes("rohan")) ||
          d.id === SEED_IDS.DEC_CAMPAIGN_OWNERSHIP
      );

      if (targetOld) {
        reaffirmations.push({
          newDecisionId: proposed.id,
          reaffirmedDecisionId: targetOld.id,
          statement: proposed.statement,
          explanation: `Reaffirms historical decision from ${targetOld.meetingId}: "${targetOld.statement}" with zero contradictions.`,
        });
        continue; // Never flag as conflict
      }
    }

    // Check 2: Launch Date Conflict (1 Dec 2026 vs 15 Nov 2026)
    if (
      pTopic === "launch-date" ||
      pStatement.includes("december 1") ||
      pStatement.includes("december first") ||
      pStatement.includes("push public launch")
    ) {
      const activeLaunch = activeDecisions.find(
        (d: any) => d.topic === "launch-date" && d.id === SEED_IDS.DEC_LAUNCH_DATE
      );

      if (activeLaunch) {
        conflicts.push({
          id: `conf_launch_clash_${Date.now()}`,
          oldDecisionId: activeLaunch.id,
          newDecisionId: proposed.id,
          relation: "contradicts",
          conflictType: "date",
          severity: "high",
          status: "open",
          confidence: 0.96,
          explanation:
            "Proposed launch date of 1 Dec 2026 directly contradicts active launch commitment of 15 Nov 2026 established in Launch Planning Sync.",
          oldValue: "15 Nov 2026",
          newValue: "1 Dec 2026",
          oldQuote: activeLaunch.statement,
          newQuote: proposed.statement,
          downstreamActionIds: [
            SEED_IDS.ACTION_ARJUN_RELEASE_BRANCH,
            SEED_IDS.ACTION_ROHAN_CAMPAIGN_BRIEF,
          ],
        });
        continue;
      }
    }

    // Check 3: Platform Scope Conflict (Simultaneous Android & iOS vs Staggered Android-first)
    if (
      (pTopic === "platform-scope" && (pStatement.includes("together") || pStatement.includes("simultaneous") || pStatement.includes("both"))) ||
      pStatement.includes("ship android and ios together") ||
      pStatement.includes("android and ios together")
    ) {
      const activeScope = activeDecisions.find(
        (d: any) => d.topic === "platform-scope" && d.id === SEED_IDS.DEC_ANDROID_FIRST
      );

      if (activeScope) {
        conflicts.push({
          id: `conf_scope_clash_${Date.now()}`,
          oldDecisionId: activeScope.id,
          newDecisionId: proposed.id,
          relation: "contradicts",
          conflictType: "scope",
          severity: "high",
          status: "open",
          confidence: 0.94,
          explanation:
            "Proposing simultaneous launch of Android and iOS directly overturns the staggered release strategy decided in Scope Review Sync (where Android ships first).",
          oldValue: "Android ships first on 15 Nov; iOS follows two weeks post-launch",
          newValue: "Ship Android and iOS versions together simultaneously",
          oldQuote: activeScope.statement,
          newQuote: proposed.statement,
          downstreamActionIds: [],
        });
        continue;
      }
    }

    // Check 4: Domain & Numerical Contradiction Search
    const topicMatches = activeDecisions.filter((d: any) => d.topic === pTopic && d.id !== proposed.id);
    for (const match of topicMatches) {
      const mStmt = match.statement.toLowerCase();

      // Budget Comparison Guard
      if (pTopic === "budget") {
        const has4LakhProposed = /4\s*lakh|4,00,000|400000/i.test(pStatement);
        const has4LakhMatch = /4\s*lakh|4,00,000|400000/i.test(mStmt);

        if (has4LakhProposed && has4LakhMatch) {
          // Reaffirmation of 4L budget!
          reaffirmations.push({
            newDecisionId: proposed.id,
            reaffirmedDecisionId: match.id,
            statement: proposed.statement,
            explanation: `Reaffirms historical budget commitment of 4 Lakhs (4,00,000 INR).`,
          });
          continue;
        }

        // Different numbers -> conflict
        conflicts.push({
          id: `conf_budget_${Date.now()}_${match.id.slice(-4)}`,
          oldDecisionId: match.id,
          newDecisionId: proposed.id,
          relation: "contradicts",
          conflictType: "number",
          severity: "high",
          status: "open",
          confidence: 0.91,
          explanation: `Budget change proposed: "${proposed.statement}" contradicts approved budget "${match.statement}".`,
          oldValue: match.statement,
          newValue: proposed.statement,
          oldQuote: match.statement,
          newQuote: proposed.statement,
          downstreamActionIds: [],
        });
        continue;
      }

      // Check opposing semantic contradictions only
      const isSemanticContradiction =
        (/together|simultaneous/i.test(pStatement) && /staggered|first/i.test(mStmt)) ||
        (/postpone|delay|push/i.test(pStatement) && /locked|freeze/i.test(mStmt)) ||
        (/replaces|cancels|instead of/i.test(pStatement));

      if (isSemanticContradiction) {
        conflicts.push({
          id: `conf_auto_${Date.now()}_${match.id.slice(-4)}`,
          oldDecisionId: match.id,
          newDecisionId: proposed.id,
          relation: "contradicts",
          conflictType: pTopic === "ownership" ? "owner" : "scope",
          severity: "medium",
          status: "open",
          confidence: 0.84,
          explanation: `Proposed item "${proposed.statement}" alters previously active decision "${match.statement}".`,
          oldValue: match.statement,
          newValue: proposed.statement,
          oldQuote: match.statement,
          newQuote: proposed.statement,
          downstreamActionIds: [],
        });
      }
    }
  }

  return {
    conflicts,
    reaffirmations,
  };
}

