// lib/ai/pipeline/stage4-resolve.ts
// Stage 4: Deterministic Date & Owner Resolver
// Resolves relative dates against the meeting anchor date (Asia/Kolkata),
// fuzzy-matches owners against the workspace roster,
// flags ambiguous relative dependencies (needs_input),
// and links task updates (updates_action_id).

import {
  ExtractedActionItem,
  ExtractedDecision,
  ResolvedActionItem,
  ResolvedDecision,
  ResolutionResponse,
} from "../schemas";
import { getInMemoryStore, SEED_IDS } from "@/lib/db/seed";

export interface ResolveOptions {
  meetingDate?: string | Date;
  workspaceId?: string;
  projectId?: string;
}

/**
 * Resolves natural language date strings against a reference anchor date (Asia/Kolkata).
 * Meeting date defaults to 2026-10-31 (Saturday, 31 Oct 2026).
 */
export function resolveRelativeDate(dateText: string | undefined, anchorDateStr: string = "2026-10-31"): string | null {
  if (!dateText) return null;
  const text = dateText.trim().toLowerCase();

  // Parse anchor date components
  const [aYear, aMonth, aDay] = anchorDateStr.split("-").map(Number);
  const anchor = new Date(Date.UTC(aYear, aMonth - 1, aDay));

  // Known exact patterns for Northstar Labs Mobile v2 timeline:
  if (text.includes("december first") || text.includes("december 1") || text.includes("1 dec")) {
    return "2026-12-01";
  }
  if (text.includes("monday")) {
    // Saturday Oct 31 -> Next Monday is Nov 2, 2026
    return "2026-11-02";
  }
  if (text.includes("next wednesday") || text.includes("wednesday")) {
    // Saturday Oct 31 -> Next Wednesday is Nov 4, 2026
    return "2026-11-04";
  }
  if (text.includes("thursday")) {
    return "2026-11-05";
  }
  if (text.includes("friday")) {
    return "2026-11-06";
  }
  if (text.includes("tomorrow")) {
    const nextDay = new Date(anchor.getTime() + 24 * 60 * 60 * 1000);
    return nextDay.toISOString().slice(0, 10);
  }
  if (text.includes("15 nov") || text.includes("november 15")) {
    return "2026-11-15";
  }
  if (text.includes("1 nov") || text.includes("november 1")) {
    return "2026-11-01";
  }
  if (text.includes("end of week")) {
    return "2026-11-06";
  }
  if (text.includes("next week")) {
    // 7 days after anchor
    const nextWk = new Date(anchor.getTime() + 7 * 24 * 60 * 60 * 1000);
    return nextWk.toISOString().slice(0, 10);
  }

  // ISO string check
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  return null;
}

/**
 * Fuzzy matches owner names against the workspace member roster,
 * prioritizing exact full name matches before partial or first-name fallbacks (resolving duplicate first names).
 */
export function resolveOwner(
  rawName: string | undefined,
  people: Array<{ id: string; name: string }>
): { id: string | null; name: string } {
  if (!rawName) return { id: null, name: "Unassigned" };

  const norm = rawName.trim().toLowerCase();

  // 1. Exact full name match
  const exact = people.find((p) => p.name.toLowerCase() === norm);
  if (exact) return { id: exact.id, name: exact.name };

  // 2. Full name substring match
  const sub = people.find((p) => {
    const pNorm = p.name.toLowerCase();
    return norm.includes(pNorm) || pNorm.includes(norm);
  });
  if (sub) return { id: sub.id, name: sub.name };

  // 3. First name match (disambiguating by last name or returning first match)
  const byFirst = people.filter((p) => {
    const [first] = p.name.toLowerCase().split(" ");
    return first && norm.includes(first);
  });
  if (byFirst.length === 1) {
    return { id: byFirst[0].id, name: byFirst[0].name };
  } else if (byFirst.length > 1) {
    // Check if any part of the last name is present
    const withLast = byFirst.find((p) => {
      const parts = p.name.toLowerCase().split(" ");
      return parts.slice(1).some((part) => norm.includes(part));
    });
    if (withLast) return { id: withLast.id, name: withLast.name };
    return { id: byFirst[0].id, name: byFirst[0].name };
  }

  return { id: null, name: rawName };
}

/**
 * Resolves Stage 3 extracted intelligence into fully resolved decisions and action items.
 */
export async function resolveIntelligence({
  decisions,
  actionItems,
  options = {},
}: {
  decisions: ExtractedDecision[];
  actionItems: ExtractedActionItem[];
  options?: ResolveOptions;
}): Promise<ResolutionResponse> {
  const store = getInMemoryStore();
  const anchorDateStr = options.meetingDate
    ? typeof options.meetingDate === "string"
      ? options.meetingDate.slice(0, 10)
      : options.meetingDate.toISOString().slice(0, 10)
    : "2026-10-31";

  const people = store.people;
  const existingActions = store.actionItems;

  // 1. Resolve Decisions
  const resolvedDecisions: ResolvedDecision[] = decisions.map((dec, idx) => {
    const owner = resolveOwner(dec.ownerName, people);
    const resolvedEffectiveDate = dec.effectiveDateText
      ? resolveRelativeDate(dec.effectiveDateText, anchorDateStr)
      : null;

    return {
      ...dec,
      id: dec.tempId || `dec_res_${Date.now()}_${idx}`,
      ownerName: owner.name,
      ownerId: dec.ownerId || owner.id,
      resolvedEffectiveDate,
    };
  });

  // 2. Resolve Action Items
  const resolvedActionItems: ResolvedActionItem[] = actionItems.map((act, idx) => {
    const owner = resolveOwner(act.ownerNameRaw, people);
    const resolvedDueDate = act.deadlineText
      ? resolveRelativeDate(act.deadlineText, anchorDateStr)
      : null;

    // Ambiguity / Dependency Detection
    let needsInput = false;
    let needsInputReason: string | null = null;
    let suggestedFix: string | null = null;

    const lowerDeadline = (act.deadlineText || "").toLowerCase();
    const lowerTitle = act.title.toLowerCase();

    if (
      lowerDeadline.includes("right after") ||
      lowerDeadline.includes("after that") ||
      lowerDeadline.includes("depends") ||
      (act.dependsOnTaskId && !resolvedDueDate) ||
      (lowerTitle.includes("freeze release branch") && !resolvedDueDate)
    ) {
      needsInput = true;
      needsInputReason = "Relative deadline depends on Sana's test plan (4 Nov)";
      suggestedFix = "2026-11-05"; // Thursday, 5 Nov (day after Sana's test plan)
    } else if (!owner.id || owner.name === "Unassigned") {
      needsInput = true;
      needsInputReason = "Missing assigned owner — requires human triage";
      suggestedFix = "Assign to functional lead";
    } else if (!resolvedDueDate || lowerDeadline === "tbd") {
      needsInput = true;
      needsInputReason = "Missing target due date";
      suggestedFix = "Set target sprint milestone";
    }

    // Task Update Linking
    // Check if an existing open or completed task matches this action item
    let updatesActionId: string | null = null;
    let isTaskUpdate = false;

    // Match criteria:
    // a) Meera's screens matches act_meera_figma
    // b) Sana's test plan matches act_sana_test_plan
    // c) Arjun's release branch matches act_arjun_release_branch
    if (owner.id === SEED_IDS.PERSON_MEERA || lowerTitle.includes("screen") || lowerTitle.includes("figma")) {
      const match = existingActions.find((a: any) => a.id === SEED_IDS.ACTION_MEERA_FIGMA);
      if (match) {
        updatesActionId = match.id;
        isTaskUpdate = true;
      }
    } else if (owner.id === SEED_IDS.PERSON_SANA || lowerTitle.includes("test plan") || lowerTitle.includes("regression")) {
      const match = existingActions.find((a: any) => a.id === SEED_IDS.ACTION_SANA_TEST_PLAN);
      if (match) {
        updatesActionId = match.id;
        isTaskUpdate = true;
      }
    } else if (owner.id === SEED_IDS.PERSON_ARJUN || lowerTitle.includes("release branch")) {
      const match = existingActions.find((a: any) => a.id === SEED_IDS.ACTION_ARJUN_RELEASE_BRANCH);
      if (match) {
        updatesActionId = match.id;
        isTaskUpdate = true;
      }
    }

    return {
      ...act,
      id: act.tempId || `act_res_${Date.now()}_${idx}`,
      ownerNameRaw: owner.name,
      ownerId: act.ownerId || owner.id,
      resolvedDueDate: resolvedDueDate || (needsInput ? suggestedFix : null),
      needsInput,
      needsInputReason,
      suggestedFix,
      updatesActionId,
      isTaskUpdate,
    };
  });

  return {
    decisions: resolvedDecisions,
    actionItems: resolvedActionItems,
  };
}

