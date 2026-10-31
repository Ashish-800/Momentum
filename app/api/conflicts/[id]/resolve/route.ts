// app/api/conflicts/[id]/resolve/route.ts
// 3D Split-Diff Conflict Resolution Endpoint
// Supports 4 concrete actions with lineage tracking and audit logging.

import { NextRequest } from "next/server";
import { getInMemoryStore, SEED_IDS } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const resolution = body.resolution || body.action;
    const note = body.note || body.resolutionNote || "";
    const actorName = body.actorName || body.resolvedBy || "Priya Nair";

    const store = getInMemoryStore();
    if (!store.auditLogs) store.auditLogs = [];

    const conflict = store.conflicts.find((c: any) => c.id === id);
    if (!conflict) {
      return new Response(
        JSON.stringify({ error: `Conflict ${id} not found` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const oldDecision = store.decisions.find((d: any) => d.id === conflict.oldDecisionId);
    const newDecision = store.decisions.find((d: any) => d.id === conflict.newDecisionId);

    const beforeState = {
      conflictStatus: conflict.status,
      oldDecisionStatus: oldDecision?.status,
      newDecisionStatus: newDecision?.status,
    };

    // Execute one of 4 concrete resolution actions
    switch (resolution) {
      case "resolved_keep_old":
        conflict.status = "resolved_keep_old";
        conflict.resolutionNote = note || "Confirmed historical decision; rejected new proposal.";
        conflict.resolvedAt = new Date();
        if (newDecision) {
          newDecision.status = "rejected";
        }
        if (oldDecision) {
          oldDecision.status = "active";
        }
        break;

      case "resolved_supersede":
        conflict.status = "resolved_supersede";
        conflict.resolutionNote = note || "Approved new proposal; historical decision superseded.";
        conflict.resolvedAt = new Date();
        if (oldDecision) {
          oldDecision.status = "superseded";
        }
        if (newDecision) {
          newDecision.status = "active";
          newDecision.supersedesId = oldDecision?.id || null;
        }
        // Flag affected downstream tasks for deadline review
        if (conflict.downstreamActionIds && conflict.downstreamActionIds.length > 0) {
          store.actionItems.forEach((a: any) => {
            if (conflict.downstreamActionIds.includes(a.id)) {
              a.needsInput = true;
              a.needsInputReason = `Upstream decision superseded by ${newDecision?.statement || "revised date"}`;
              a.suggestedFix = "Align task deadline with new 1 Dec milestone";
            }
          });
        }
        break;

      case "resolved_escalated":
        conflict.status = "resolved_escalated";
        conflict.resolutionNote = note || "Escalated to decision owner for clarification.";
        conflict.resolvedAt = new Date();
        break;

      case "resolved_both_valid":
        conflict.status = "resolved_both_valid";
        conflict.resolutionNote = note || "Marked both decisions compatible (dual-track scope).";
        conflict.resolvedAt = new Date();
        if (newDecision) {
          newDecision.status = "active";
        }
        if (oldDecision) {
          oldDecision.status = "active";
        }
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Invalid resolution action: ${resolution}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    // Write audit log entry
    store.auditLogs.push({
      id: `audit_${Date.now()}`,
      workspaceId: conflict.workspaceId || SEED_IDS.WORKSPACE_ID,
      actorName,
      action: "resolve_conflict",
      entityType: "conflict",
      entityId: conflict.id,
      beforeState,
      afterState: {
        resolution,
        conflictStatus: conflict.status,
        oldDecisionStatus: oldDecision?.status,
        newDecisionStatus: newDecision?.status,
        note: conflict.resolutionNote,
      },
      createdAt: new Date(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        conflict,
        oldDecision,
        newDecision,
        message: `Conflict successfully resolved via ${resolution}.`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Conflict resolution failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

