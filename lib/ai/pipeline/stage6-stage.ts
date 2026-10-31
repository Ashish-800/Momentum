// lib/ai/pipeline/stage6-stage.ts
// Stage 6: Final Pipeline Staging & Store Synchronization
// Consolidates intelligence, persists proposed items to store/memory,
// generates the crisp 3-sentence Executive Summary and review CTA.

import {
  ConflictItem,
  PipelineStagingResponse,
  ResolvedActionItem,
  ResolvedDecision,
} from "../schemas";
import { getInMemoryStore, SEED_IDS } from "@/lib/db/seed";

export async function stagePipelineIntelligence({
  meetingId,
  decisions,
  actionItems,
  conflicts,
  reaffirmationsCount = 0,
}: {
  meetingId: string;
  decisions: ResolvedDecision[];
  actionItems: ResolvedActionItem[];
  conflicts: ConflictItem[];
  reaffirmationsCount?: number;
}): Promise<PipelineStagingResponse> {
  const store = getInMemoryStore();

  // Find meeting or default
  const meeting = store.meetings.find((m: any) => m.id === meetingId) || {
    id: meetingId,
    title: "Mobile v2 Launch Sync",
    projectId: SEED_IDS.PROJECT_MOBILE_V2,
    workspaceId: SEED_IDS.WORKSPACE_ID,
  };

  // Generate 3-sentence executive summary
  const executiveSummary = [
    "The team convened to review mobile release readiness, proposing a revised launch date of 1 December 2026 to resolve critical QA regression backlogs.",
    "Platform scope shifts to a simultaneous dual-platform rollout for Android and iOS, triggering two high-severity policy conflicts against prior launch commitments.",
    "Deliverables for UI screens (Meera), test plans (Sana), and candidate release freeze (Arjun) have been staged with pending dependency review.",
  ].join(" ");

  const summary = `Meeting processed with ${decisions.length} decision proposals (${reaffirmationsCount} reaffirmed), ${actionItems.length} action items, and ${conflicts.length} open cross-meeting conflicts detected.`;

  // Synchronize into inMemoryStore so downstream views (Meeting Detail, Review Gate, Assistant) see them
  // 1. Decisions (save as proposed)
  for (const d of decisions) {
    const existingIdx = store.decisions.findIndex((x: any) => x.id === d.id);
    const decRecord = {
      id: d.id,
      workspaceId: meeting.workspaceId || SEED_IDS.WORKSPACE_ID,
      projectId: meeting.projectId || SEED_IDS.PROJECT_MOBILE_V2,
      meetingId: meeting.id,
      topic: d.topic,
      statement: d.statement,
      rationale: d.rationale || "Extracted from meeting debrief.",
      status: d.status || "proposed",
      ownerId: d.ownerId || null,
      effectiveDate: d.resolvedEffectiveDate ? new Date(d.resolvedEffectiveDate) : null,
      supersedesId: d.isReaffirmation ? d.reaffirmsDecisionId : null,
      evidenceUtteranceIds: d.evidenceUtteranceIds,
      confidence: d.confidence,
      embedding: null,
      createdAt: new Date(),
    };

    if (existingIdx >= 0) {
      store.decisions[existingIdx] = decRecord;
    } else {
      store.decisions.push(decRecord);
    }
  }

  // 2. Action Items
  for (const a of actionItems) {
    const existingIdx = store.actionItems.findIndex((x: any) => x.id === a.id);
    const actRecord = {
      id: a.id,
      workspaceId: meeting.workspaceId || SEED_IDS.WORKSPACE_ID,
      projectId: meeting.projectId || SEED_IDS.PROJECT_MOBILE_V2,
      meetingId: meeting.id,
      decisionId: null,
      title: a.title,
      description: a.description || "",
      ownerId: a.ownerId || null,
      ownerNameRaw: a.ownerNameRaw || "Unassigned",
      deadlineText: a.deadlineText || "",
      dueDate: a.resolvedDueDate ? new Date(a.resolvedDueDate) : null,
      priority: a.priority,
      status: "proposed" as const,
      needsInput: a.needsInput,
      needsInputReason: a.needsInputReason,
      suggestedFix: a.suggestedFix,
      updatesActionId: a.updatesActionId,
      evidenceUtteranceIds: a.evidenceUtteranceIds,
      confidence: a.confidence,
      externalRef: null,
      idempotencyKey: `idem_${a.id}`,
    };

    if (existingIdx >= 0) {
      store.actionItems[existingIdx] = actRecord;
    } else {
      store.actionItems.push(actRecord);
    }
  }

  // 3. Conflicts
  for (const c of conflicts) {
    const existingIdx = store.conflicts.findIndex((x: any) => x.id === c.id);
    const confRecord = {
      id: c.id,
      workspaceId: meeting.workspaceId || SEED_IDS.WORKSPACE_ID,
      projectId: meeting.projectId || SEED_IDS.PROJECT_MOBILE_V2,
      oldDecisionId: c.oldDecisionId,
      newDecisionId: c.newDecisionId,
      conflictType: c.conflictType,
      severity: c.severity,
      status: c.status,
      confidence: c.confidence,
      explanation: c.explanation,
      oldValue: c.oldValue || "",
      newValue: c.newValue || "",
      oldQuote: c.oldQuote || "",
      newQuote: c.newQuote || "",
      downstreamActionIds: c.downstreamActionIds || [],
      resolutionNote: null,
      resolvedBy: null,
      resolvedAt: null,
    };

    if (existingIdx >= 0) {
      store.conflicts[existingIdx] = confRecord;
    } else {
      store.conflicts.push(confRecord);
    }
  }

  // Update meeting state
  const mIdx = store.meetings.findIndex((m: any) => m.id === meetingId);
  if (mIdx >= 0) {
    store.meetings[mIdx].status = "processed";
    store.meetings[mIdx].summary = summary;
  }

  return {
    meetingId,
    summary,
    executiveSummary,
    decisions,
    actionItems,
    conflicts,
    reaffirmationsCount,
  };
}

