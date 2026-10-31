// app/api/clock/advance/route.ts
// Time Machine Simulation Clock & Scheduler Engine
// Supports +1h, +1d, +1w, next_monday_9am, reset, and numeric hours.
// Immediately runs the scheduler tick to fire reminders, mark overdue tasks, and generate digests.

import { NextRequest, NextResponse } from "next/server";
import { getInMemoryStore, SEED_IDS } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getInMemoryStore();
  const simNow = store.workspace?.simNow || new Date("2026-10-31T07:13:00Z");

  return NextResponse.json({
    simNow: simNow instanceof Date ? simNow.toISOString() : new Date(simNow).toISOString(),
    timezone: "Asia/Kolkata",
    workspaceId: SEED_IDS.WORKSPACE_ID,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getInMemoryStore();
    if (!store.reminders) store.reminders = [];
    if (!store.auditLogs) store.auditLogs = [];
    if (!store.digests) store.digests = [];

    const currentSimNow = new Date(store.workspace.simNow);
    let nextSimNow = new Date(currentSimNow);
    const { jump, hours, target } = body;
    const op = jump || target;

    if (op === "reset") {
      nextSimNow = new Date("2026-10-31T07:13:00Z"); // Sat, 31 Oct 2026 12:43 IST
    } else if (op === "+1h") {
      nextSimNow = new Date(currentSimNow.getTime() + 1 * 60 * 60 * 1000);
    } else if (op === "+1d") {
      nextSimNow = new Date(currentSimNow.getTime() + 24 * 60 * 60 * 1000);
    } else if (op === "+1w") {
      nextSimNow = new Date(currentSimNow.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (op === "next_monday_9am") {
      // Monday 2 Nov 2026 at 09:00 IST is 03:30 UTC
      nextSimNow = new Date("2026-11-02T03:30:00Z");
    } else if (typeof hours === "number" && !isNaN(hours) && hours > 0) {
      nextSimNow = new Date(currentSimNow.getTime() + hours * 60 * 60 * 1000);
    } else {
      // Default to +24 hours
      nextSimNow = new Date(currentSimNow.getTime() + 24 * 60 * 60 * 1000);
    }

    // Update workspace simNow
    store.workspace.simNow = nextSimNow;

    // ── SCHEDULER TICK ──────────────────────────────────────────
    // 1. Fire pending reminders where remindAt <= nextSimNow
    const firedReminders: any[] = [];
    store.reminders.forEach((r: any) => {
      if (r.status === "pending" && new Date(r.remindAt) <= nextSimNow) {
        r.status = "fired";
        r.firedAt = nextSimNow;
        firedReminders.push(r);
      }
    });

    // 2. Mark incomplete tasks as overdue if dueDate < nextSimNow
    const overdueTasks: any[] = [];
    store.actionItems.forEach((a: any) => {
      if (a.status !== "completed" && a.status !== "rejected" && a.dueDate) {
        if (new Date(a.dueDate) < nextSimNow) {
          a.status = "overdue";
          overdueTasks.push(a);
        }
      }
    });

    // 3. Check if we crossed Monday 09:00 IST (2 Nov 09:00 IST = 2 Nov 03:30 UTC)
    // If nextSimNow >= Monday 09:00 IST, generate weekly digests for all 5 people
    const mondayThreshold = new Date("2026-11-02T03:30:00Z");
    const digestsGenerated: any[] = [];

    if (nextSimNow >= mondayThreshold) {
      const weekStart = new Date("2026-11-02T00:00:00+05:30");

      store.people.forEach((person: any) => {
        const existingDigest = store.digests.find(
          (d: any) => d.personId === person.id && String(d.weekStart).includes("2026-11-02")
        );

        if (!existingDigest) {
          const personTasks = store.actionItems.filter((a: any) => a.ownerId === person.id);
          const activeDecisions = store.decisions.filter((d: any) => d.status === "active");

          const digestRecord = {
            id: `dig_${person.id}_w45`,
            workspaceId: SEED_IDS.WORKSPACE_ID,
            personId: person.id,
            weekStart,
            introText: `Good Monday morning, ${person.name.split(" ")[0]}. Here is your high-fidelity execution brief for Mobile v2 Launch Week: 3 critical commitments pending, launch date decision synchronized to 1 Dec, and regression test plan updates ready for QA handoff.`,
            payload: {
              my_tasks: personTasks,
              blockers: overdueTasks.filter((t: any) => t.ownerId === person.id),
              decisions: activeDecisions.slice(0, 3),
              openConflictsCount: store.conflicts.filter((c: any) => c.status === "open").length,
            },
            sentAt: nextSimNow,
            channel: "in_app" as const,
          };

          store.digests.push(digestRecord);
          digestsGenerated.push(digestRecord);
        }
      });
    }

    // 4. Record Audit Log
    store.auditLogs.push({
      id: `audit_clock_${Date.now()}`,
      workspaceId: SEED_IDS.WORKSPACE_ID,
      actorName: "Priya Nair",
      action: "advance_simulation_clock",
      entityType: "time_machine",
      entityId: `sim_${Date.now()}`,
      beforeState: { simNow: currentSimNow.toISOString() },
      afterState: {
        simNow: nextSimNow.toISOString(),
        firedReminders: firedReminders.length,
        overdueTasks: overdueTasks.length,
        digestsGenerated: digestsGenerated.length,
      },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      prevNow: currentSimNow.toISOString(),
      simNow: nextSimNow.toISOString(),
      firedRemindersCount: firedReminders.length,
      firedReminders,
      overdueTasksCount: overdueTasks.length,
      digestsGeneratedCount: digestsGenerated.length,
      timezone: "Asia/Kolkata",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Time advance failed" },
      { status: 500 }
    );
  }
}
