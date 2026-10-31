// app/api/sync/route.ts
// Server-Enforced Sync Engine (POST /api/sync)
// Enforces:
// 1. Hard Approval Gate: Rejects with 409 Conflict if any item is unapproved or blocked by an open conflict.
// 2. Idempotency Key deduplication.
// 3. Automated 24h & 2h reminder generation.
// 4. Pluggable task creation (Trello / Internal Board).
// 5. Audit log tracking.

import { NextRequest } from "next/server";
import { getInMemoryStore, SEED_IDS } from "@/lib/db/seed";
import { getTaskAdapter } from "@/lib/integrations";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemIds = [], targetProvider = "internal" } = body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "itemIds must be a non-empty array", code: "EMPTY_ITEMS" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const store = getInMemoryStore();
    if (!store.reminders) store.reminders = [];
    if (!store.auditLogs) store.auditLogs = [];

    // ── 1. HARD SERVER GATE VERIFICATION ─────────────────────
    // Fetch all requested items from actionItems and decisions
    const requestedActions = store.actionItems.filter((a: any) => itemIds.includes(a.id));
    const requestedDecisions = store.decisions.filter((d: any) => itemIds.includes(d.id));

    // Check for unapproved action items
    const unapprovedActions = requestedActions.filter((a: any) => a.status !== "approved");

    // Check for unapproved decisions
    const unapprovedDecisions = requestedDecisions.filter(
      (d: any) => d.status !== "active" && d.status !== "approved"
    );

    // Check for unresolved open conflicts blocking any item
    const openConflicts = store.conflicts.filter((c: any) => c.status === "open");
    const blockedByConflict = requestedActions.some((a: any) => {
      // If action depends on a decision involved in an open conflict
      return openConflicts.some((c: any) => {
        const isOld = c.oldDecisionId === a.decisionId;
        const isNew = c.newDecisionId === a.decisionId;
        const isDownstream = (c.downstreamActionIds || []).includes(a.id);
        return isOld || isNew || isDownstream;
      });
    }) || requestedDecisions.some((d: any) => {
      return openConflicts.some(
        (c: any) => c.oldDecisionId === d.id || c.newDecisionId === d.id
      );
    });

    if (unapprovedActions.length > 0 || unapprovedDecisions.length > 0 || blockedByConflict) {
      const details = [];
      if (unapprovedActions.length > 0) {
        details.push(`${unapprovedActions.length} action items have status '${unapprovedActions[0]?.status}' (expected 'approved')`);
      }
      if (unapprovedDecisions.length > 0) {
        details.push(`${unapprovedDecisions.length} decisions are not approved`);
      }
      if (blockedByConflict) {
        details.push("1 or more items are blocked by an unresolved open conflict");
      }

      return new Response(
        JSON.stringify({
          error: "Strict Human-in-the-Loop gate violation: cannot publish unapproved items or items with active conflicts.",
          code: "UNAPPROVED_OR_CONFLICTED_ITEM",
          details,
          unapprovedActionIds: unapprovedActions.map((a: any) => a.id),
          unapprovedDecisionIds: unapprovedDecisions.map((d: any) => d.id),
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── 2. EXECUTE SYNC VIA TASK ADAPTER ─────────────────────
    const adapter = getTaskAdapter(targetProvider);
    const syncResults: any[] = [];
    const createdReminders: any[] = [];

    for (const action of requestedActions) {
      // Find parent meeting and decision for rich description
      const meeting = store.meetings.find((m: any) => m.id === action.meetingId);
      const decision = store.decisions.find((d: any) => d.id === action.decisionId);
      const owner = store.people.find((p: any) => p.id === action.ownerId);

      // Idempotency: generate or preserve unique key
      const idempotencyKey = action.idempotencyKey || `idem_${action.id}`;

      // Call adapter
      const taskResult = await adapter.createTask({
        idempotencyKey,
        title: action.title,
        description: action.description,
        dueDate: action.dueDate ? new Date(action.dueDate) : null,
        priority: action.priority,
        ownerName: owner?.name || action.ownerNameRaw,
        ownerEmail: owner?.email,
        meetingTitle: meeting?.title,
        meetingDate: meeting?.meetingDate,
        decisionStatement: decision?.statement,
        verbatimQuote: action.description,
        closeloopMeetingUrl: meeting ? `/meetings/${meeting.id}` : undefined,
      });

      // Update action status in store
      action.status = "synced";
      action.externalRef = taskResult.externalRef;

      // ── 3. AUTOMATED REMINDER SCHEDULING (24h & 2h) ────────
      if (action.dueDate) {
        const dueTime = new Date(action.dueDate).getTime();

        // 24 Hours Prior
        const remind24h = new Date(dueTime - 24 * 60 * 60 * 1000);
        const rem24Record = {
          id: `rem_24h_${action.id}`,
          workspaceId: action.workspaceId || SEED_IDS.WORKSPACE_ID,
          actionItemId: action.id,
          personId: action.ownerId || SEED_IDS.PERSON_PRIYA,
          remindAt: remind24h,
          leadType: "24h" as const,
          message: `Reminder: "${action.title}" is due in 24 hours (${new Date(action.dueDate).toLocaleDateString()}).`,
          status: "pending" as const,
          firedAt: null,
          createdAt: new Date(),
        };

        // 2 Hours Prior
        const remind2h = new Date(dueTime - 2 * 60 * 60 * 1000);
        const rem2Record = {
          id: `rem_2h_${action.id}`,
          workspaceId: action.workspaceId || SEED_IDS.WORKSPACE_ID,
          actionItemId: action.id,
          personId: action.ownerId || SEED_IDS.PERSON_PRIYA,
          remindAt: remind2h,
          leadType: "2h" as const,
          message: `Urgent: "${action.title}" is due in 2 hours!`,
          status: "pending" as const,
          firedAt: null,
          createdAt: new Date(),
        };

        // Upsert into store.reminders
        store.reminders = store.reminders.filter(
          (r: any) => r.id !== rem24Record.id && r.id !== rem2Record.id
        );
        store.reminders.push(rem24Record, rem2Record);
        createdReminders.push(rem24Record, rem2Record);
      }

      syncResults.push({
        actionId: action.id,
        title: action.title,
        externalRef: taskResult.externalRef,
        message: taskResult.message,
      });
    }

    // Update synced decisions to active
    for (const dec of requestedDecisions) {
      dec.status = "active";
    }

    // ── 4. RECORD AUDIT LOG ──────────────────────────────────
    store.auditLogs.push({
      id: `audit_${Date.now()}`,
      workspaceId: SEED_IDS.WORKSPACE_ID,
      actorName: "Priya Nair",
      action: "sync_approved_items",
      entityType: "batch_sync",
      entityId: `batch_${Date.now()}`,
      beforeState: { itemIds, previousStatus: "approved" },
      afterState: { syncedActions: syncResults.length, targetProvider, reminders: createdReminders.length },
      createdAt: new Date(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        provider: adapter.provider,
        providerName: adapter.name,
        syncedCount: syncResults.length,
        syncedDecisionsCount: requestedDecisions.length,
        results: syncResults,
        remindersScheduled: createdReminders.length,
        message: `Successfully published & synced ${syncResults.length} items to ${adapter.name}.`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[Sync API Error]", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Sync execution failed", code: "SYNC_ERROR" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

