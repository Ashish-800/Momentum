// app/api/tasks/[id]/route.ts
// Update task status, priority, or details, syncing to internal task store

import { NextRequest, NextResponse } from "next/server";
import { getInMemoryStore } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = getInMemoryStore();
  const task = store.actionItems.find((t: any) => t.id === id);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const owner = store.people.find((p: any) => p.id === task.ownerId);
  const meeting = store.meetings.find((m: any) => m.id === task.meetingId);
  const decision = store.decisions.find((d: any) => d.id === task.decisionId);
  const reminders = (store.reminders || []).filter((r: any) => r.actionItemId === task.id);
  const auditLogs = (store.auditLogs || []).filter(
    (l: any) => l.entityId === task.id || l.metadata?.actionItemId === task.id
  );

  return NextResponse.json({
    task: {
      ...task,
      owner,
      meeting,
      decision,
      reminders,
      auditLogs,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const store = getInMemoryStore();

    const taskIndex = store.actionItems.findIndex((t: any) => t.id === id);
    if (taskIndex === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = store.actionItems[taskIndex];
    const prevStatus = task.status;

    if (body.status !== undefined) {
      task.status = body.status;
    }
    if (body.priority !== undefined) {
      task.priority = body.priority;
    }
    if (body.dueDate !== undefined) {
      task.dueDate = new Date(body.dueDate);
    }
    if (body.title !== undefined) {
      task.title = body.title;
    }
    if (body.description !== undefined) {
      task.description = body.description;
    }

    // Sync to internalTasks if exists
    if (!store.internalTasks) store.internalTasks = [];
    const internalCard = store.internalTasks.find((c: any) => c.actionItemId === id || c.id === task.externalRef?.card_id);
    if (internalCard && body.status) {
      internalCard.status = body.status;
    }

    // Log audit event
    if (!store.auditLogs) store.auditLogs = [];
    store.auditLogs.unshift({
      id: `audit_task_${Date.now()}`,
      action: "task_updated",
      entityType: "action_item",
      entityId: id,
      actor: "Priya Nair",
      timestamp: new Date(),
      details: `Status transitioned from ${prevStatus} to ${task.status}`,
      metadata: { prevStatus, newStatus: task.status, fields: Object.keys(body) },
    });

    return NextResponse.json({
      ok: true,
      task,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update task" },
      { status: 500 }
    );
  }
}

