// app/api/meetings/route.ts
// GET /api/meetings — list meetings
// POST /api/meetings — create meeting with audit log

import { NextRequest, NextResponse } from "next/server";
import { getInMemoryStore, DEMO_SEED_DATA } from "@/lib/db/seed";

export async function GET(req: NextRequest) {
  const store = getInMemoryStore();
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId") || store.workspace.id;
  const projectId = searchParams.get("projectId");

  let meetings = store.meetings.filter((m: { workspaceId: string }) => m.workspaceId === workspaceId);

  if (projectId) {
    meetings = meetings.filter((m: { projectId?: string }) => m.projectId === projectId);
  }

  return NextResponse.json({
    success: true,
    meetings,
    total: meetings.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title || !body.captureMode) {
      return NextResponse.json(
        { success: false, error: "title and captureMode are required" },
        { status: 400 }
      );
    }

    const store = getInMemoryStore();
    const meetingId = `meet_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const newMeeting = {
      id: meetingId,
      workspaceId: body.workspaceId || store.workspace.id,
      projectId: body.projectId || store.projects[0]?.id || "proj_mobile_v2",
      title: body.title,
      meetingDate: body.meetingDate ? new Date(body.meetingDate) : new Date(store.workspace.simNow),
      durationMin: body.durationMin || 30,
      captureMode: body.captureMode, // "debrief" | "roundtable" | "import"
      status: "draft",
      summary: body.summary || null,
      highlights: body.highlights || { key_decisions: [], blockers: [], open_questions: [] },
      rawFileMeta: body.rawFileMeta || null,
      createdAt: new Date(),
    };

    store.meetings.unshift(newMeeting);

    // Audit log entry
    const auditEntry = {
      id: `audit_${Date.now()}`,
      workspaceId: newMeeting.workspaceId,
      actorName: "Priya Nair",
      action: "create_meeting",
      entityType: "meeting",
      entityId: meetingId,
      beforeState: null,
      afterState: { title: newMeeting.title, captureMode: newMeeting.captureMode },
      createdAt: new Date(),
    };

    if (!store.auditLogs) store.auditLogs = [];
    store.auditLogs.unshift(auditEntry);

    return NextResponse.json(
      {
        success: true,
        meeting: newMeeting,
        auditLog: auditEntry,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create meeting" },
      { status: 500 }
    );
  }
}
