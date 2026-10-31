// app/api/demo/seed/route.ts
// Closeloop — Seed Reset Endpoint
// Supports both POST (idempotent reset) and GET (inspect current seed state)

import { NextResponse } from "next/server";
import { DEMO_SEED_DATA, resetInMemoryStore, getInMemoryStore } from "@/lib/db/seed";

export async function POST() {
  const data = resetInMemoryStore();
  return NextResponse.json({
    success: true,
    message: "Demo database reset to Northstar Labs initial seed state.",
    timestamp: new Date().toISOString(),
    stats: {
      workspace: data.workspace.name,
      teamMembers: data.people.length,
      projects: data.projects.length,
      meetings: data.meetings.length,
      activeDecisions: data.decisions.filter((d: { status: string }) => d.status === "active").length,
      openConflicts: data.conflicts.filter((c: { status: string }) => c.status === "open").length,
      pendingApprovals: data.actionItems.filter((a: { status: string }) => a.status === "proposed").length +
        data.decisions.filter((d: { status: string }) => d.status === "proposed").length,
    },
  });
}

export async function GET() {
  const data = getInMemoryStore();
  return NextResponse.json({
    success: true,
    workspace: data.workspace,
    stats: {
      teamMembers: data.people.length,
      meetings: data.meetings.length,
      decisions: data.decisions.length,
      actionItems: data.actionItems.length,
      conflicts: data.conflicts.length,
    },
    data,
  });
}
