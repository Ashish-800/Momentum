// app/api/review/route.ts
// Review Tray State & Mutation Endpoint
// Handles inline editing, one-click suggested fix acceptance, bulk approvals, and approval gate checks.

import { NextRequest } from "next/server";
import { getInMemoryStore, SEED_IDS } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getInMemoryStore();

  const stagedDecisions = store.decisions.filter(
    (d: any) => d.status === "proposed" || d.status === "discussion"
  );
  const stagedActions = store.actionItems.filter(
    (a: any) => a.status === "proposed"
  );
  const approvedActions = store.actionItems.filter(
    (a: any) => a.status === "approved"
  );
  const openConflicts = store.conflicts.filter(
    (c: any) => c.status === "open"
  );

  return new Response(
    JSON.stringify({
      stagedDecisions,
      stagedActions,
      approvedActions,
      openConflicts,
      readyToSyncCount: approvedActions.length,
      people: store.people,
      meetings: store.meetings,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, itemId, updates = {}, actorName = "Priya Nair" } = body;

    const store = getInMemoryStore();
    if (!store.auditLogs) store.auditLogs = [];

    // Helper: Find item across decisions or actionItems
    const findItem = (id: string) => {
      const act = store.actionItems.find((a: any) => a.id === id);
      if (act) return { item: act, type: "action_item" as const };
      const dec = store.decisions.find((d: any) => d.id === id);
      if (dec) return { item: dec, type: "decision" as const };
      return null;
    };

    switch (action) {
      // ── 1. APPROVE SINGLE ITEM ─────────────────────────────
      case "approve": {
        const found = findItem(itemId);
        if (!found) {
          return new Response(JSON.stringify({ error: `Item ${itemId} not found` }), { status: 404 });
        }

        const { item, type } = found;

        // Needs-Input Guard: Block approval if missing input
        if (item.needsInput) {
          return new Response(
            JSON.stringify({
              error: `Cannot approve item: missing input required (${item.needsInputReason || "Accept suggested fix first"})`,
              code: "NEEDS_INPUT_BLOCK",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Conflict Dependency Lock: Block approval if open conflict exists
        const openConflicts = store.conflicts.filter((c: any) => c.status === "open");
        const hasConflict = openConflicts.some((c: any) => {
          return (
            c.newDecisionId === item.id ||
            c.oldDecisionId === item.id ||
            c.newDecisionId === item.decisionId ||
            (c.downstreamActionIds || []).includes(item.id)
          );
        });

        if (hasConflict) {
          return new Response(
            JSON.stringify({
              error: "Blocked by unresolved conflict — resolve conflict in 3D Split-Diff above first.",
              code: "CONFLICT_LOCK",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const beforeStatus = item.status;
        item.status = "approved";

        store.auditLogs.push({
          id: `audit_${Date.now()}`,
          workspaceId: SEED_IDS.WORKSPACE_ID,
          actorName,
          action: "approve_item",
          entityType: type,
          entityId: item.id,
          beforeState: { status: beforeStatus },
          afterState: { status: "approved" },
          createdAt: new Date(),
        });

        return new Response(JSON.stringify({ success: true, item }), { status: 200 });
      }

      // ── 2. REJECT SINGLE ITEM ──────────────────────────────
      case "reject": {
        const found = findItem(itemId);
        if (!found) {
          return new Response(JSON.stringify({ error: `Item ${itemId} not found` }), { status: 404 });
        }

        found.item.status = "rejected";
        return new Response(JSON.stringify({ success: true, item: found.item }), { status: 200 });
      }

      // ── 3. ACCEPT SUGGESTED FIX (needs_input) ──────────────
      case "accept_suggested_fix": {
        const found = findItem(itemId);
        if (!found) {
          return new Response(JSON.stringify({ error: `Item ${itemId} not found` }), { status: 404 });
        }

        const item = found.item;
        if (item.suggestedFix) {
          item.dueDate = new Date(item.suggestedFix);
          item.deadlineText = `${item.suggestedFix} (Confirmed)`;
        }
        item.needsInput = false;
        item.needsInputReason = null;

        return new Response(JSON.stringify({ success: true, item }), { status: 200 });
      }

      // ── 4. BULK APPROVE HIGH CONFIDENCE ────────────────────
      case "bulk_approve": {
        const openConflicts = store.conflicts.filter((c: any) => c.status === "open");
        const approvedIds: string[] = [];

        store.actionItems.forEach((a: any) => {
          if (a.status === "proposed" && !a.needsInput && (a.confidence || 0) >= 0.85) {
            const isConflicted = openConflicts.some((c: any) =>
              c.newDecisionId === a.decisionId || (c.downstreamActionIds || []).includes(a.id)
            );
            if (!isConflicted) {
              a.status = "approved";
              approvedIds.push(a.id);
            }
          }
        });

        store.decisions.forEach((d: any) => {
          if (d.status === "proposed" && (d.confidence || 0) >= 0.85) {
            const isConflicted = openConflicts.some(
              (c: any) => c.newDecisionId === d.id || c.oldDecisionId === d.id
            );
            if (!isConflicted) {
              d.status = "approved";
              approvedIds.push(d.id);
            }
          }
        });

        store.auditLogs.push({
          id: `audit_${Date.now()}`,
          workspaceId: SEED_IDS.WORKSPACE_ID,
          actorName,
          action: "bulk_approve_high_confidence",
          entityType: "batch",
          entityId: `bulk_${Date.now()}`,
          beforeState: { previousProposed: approvedIds.length },
          afterState: { approvedIds },
          createdAt: new Date(),
        });

        return new Response(
          JSON.stringify({ success: true, approvedCount: approvedIds.length, approvedIds }),
          { status: 200 }
        );
      }

      // ── 5. INLINE EDIT ITEM ────────────────────────────────
      case "edit_item": {
        const found = findItem(itemId);
        if (!found) {
          return new Response(JSON.stringify({ error: `Item ${itemId} not found` }), { status: 404 });
        }

        const item = found.item;
        if (updates.title) item.title = updates.title;
        if (updates.statement) item.statement = updates.statement;
        if (updates.ownerId) {
          item.ownerId = updates.ownerId;
          const person = store.people.find((p: any) => p.id === updates.ownerId);
          if (person) {
            item.ownerNameRaw = person.name;
            item.ownerName = person.name;
          }
        }
        if (updates.dueDate) {
          item.dueDate = new Date(updates.dueDate);
          item.deadlineText = updates.dueDate;
        }
        if (updates.priority) item.priority = updates.priority;

        return new Response(JSON.stringify({ success: true, item }), { status: 200 });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action ${action}` }), { status: 400 });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Review mutation failed" }), {
      status: 500,
    });
  }
}

