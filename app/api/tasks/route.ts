// app/api/tasks/route.ts
// Task management: list and create action items / tasks

import { NextRequest, NextResponse } from "next/server";
import { getInMemoryStore } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const store = getInMemoryStore();
  const { searchParams } = new URL(req.url);
  const ownerId = searchParams.get("ownerId");
  const status = searchParams.get("status");

  let tasks = [...store.actionItems];

  if (ownerId && ownerId !== "all") {
    tasks = tasks.filter((t) => t.ownerId === ownerId);
  }

  if (status && status !== "all") {
    tasks = tasks.filter((t) => t.status === status);
  }

  // Enrich with owner, meeting, and reminders
  const enriched = tasks.map((t) => {
    const owner = store.people.find((p: any) => p.id === t.ownerId);
    const meeting = store.meetings.find((m: any) => m.id === t.meetingId);
    const decision = store.decisions.find((d: any) => d.id === t.decisionId);
    const reminders = (store.reminders || []).filter((r: any) => r.actionItemId === t.id);

    return {
      ...t,
      owner,
      meetingTitle: meeting?.title,
      meetingDate: meeting?.meetingDate,
      decisionStatement: decision?.statement,
      reminders,
    };
  });

  return NextResponse.json({
    tasks: enriched,
    total: enriched.length,
    simNow: store.workspace.simNow,
  });
}

