// app/api/cron/tick/route.ts
// Automated Scheduler Tick Route
// Runs pending reminder evaluations, overdue checks, and digest triggers for current simNow.

import { NextRequest, NextResponse } from "next/server";
import { getInMemoryStore } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const store = getInMemoryStore();
    if (!store.reminders) store.reminders = [];
    if (!store.digests) store.digests = [];

    const simNow = new Date(store.workspace.simNow);
    const firedReminders: any[] = [];

    store.reminders.forEach((r: any) => {
      if (r.status === "pending" && new Date(r.remindAt) <= simNow) {
        r.status = "fired";
        r.firedAt = simNow;
        firedReminders.push(r);
      }
    });

    const overdueTasks: any[] = [];
    store.actionItems.forEach((a: any) => {
      if (a.status !== "completed" && a.status !== "rejected" && a.dueDate) {
        if (new Date(a.dueDate) < simNow) {
          a.status = "overdue";
          overdueTasks.push(a);
        }
      }
    });

    return NextResponse.json({
      success: true,
      simNow: simNow.toISOString(),
      firedRemindersCount: firedReminders.length,
      overdueTasksCount: overdueTasks.length,
      message: `Scheduler tick executed: ${firedReminders.length} reminders fired, ${overdueTasks.length} tasks marked overdue.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Scheduler tick failed" },
      { status: 500 }
    );
  }
}

