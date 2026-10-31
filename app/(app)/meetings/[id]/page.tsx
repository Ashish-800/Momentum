// app/(app)/meetings/[id]/page.tsx
// Sophisticated Meeting Detail Workspace
// Interactive transcript, bidirectional evidence highlighting, tabbed inspector, and technical AiTraceDrawer.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getInMemoryStore, DEMO_SEED_DATA } from "@/lib/db/seed";
import { MeetingDetailWorkspace } from "@/components/closeloop/MeetingDetailWorkspace";

export const dynamic = "force-dynamic";

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = getInMemoryStore();

  let meeting = store.meetings.find((m: any) => m.id === id);

  // If not found in dynamic store, fallback to initial seed bundle
  if (!meeting) {
    meeting = DEMO_SEED_DATA.meetings.find((m) => m.id === id);
  }

  // If meeting was created with a dynamic ID in studio but not found, create a sensible fallback meeting
  if (!meeting && id.startsWith("meet_")) {
    meeting = {
      id,
      workspaceId: store.workspace?.id || "ws_northstar_001",
      projectId: "proj_mobile_v2",
      title: "Mobile v2 Launch Strategy Sync",
      meetingDate: new Date("2026-10-31T12:00:00+05:30"),
      captureMode: "debrief" as const,
      status: "needs_review" as const,
      durationMin: 35,
      summary:
        "The team convened to review mobile release readiness, proposing a revised launch date of 1 December 2026 to resolve critical QA regression backlogs.",
    };
    store.meetings.push(meeting);
  }

  if (!meeting) notFound();

  const project = store.projects.find((p: any) => p.id === meeting.projectId);
  const meetingUtterances = store.utterances.filter((u: any) => u.meetingId === id);
  const meetingDecisions = store.decisions.filter((d: any) => d.meetingId === id);
  const meetingActions = store.actionItems.filter((a: any) => a.meetingId === id);
  const meetingConflicts = store.conflicts.filter(
    (c: any) =>
      c.meetingId === id ||
      meetingDecisions.some((d: any) => d.id === c.newDecisionId || d.id === c.oldDecisionId)
  );

  // If dynamic meeting has no utterances yet, supply demo recap utterances
  const effectiveUtterances =
    meetingUtterances.length > 0
      ? meetingUtterances
      : store.utterances.filter((u: any) => u.meetingId.startsWith("meet_") && u.meetingId.includes("001"));

  return (
    <div className="p-6 max-w-[1440px] mx-auto space-y-4">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-mono text-text-3">
        <Link href="/home" className="hover:text-ember flex items-center gap-1 transition-colors">
          <ArrowLeft size={13} />
          <span>Command Center</span>
        </Link>
        <span>/</span>
        <Link href="/studio" className="hover:text-ember transition-colors">
          3D Voice Studio
        </Link>
        <span>/</span>
        <span className="text-text-2 font-semibold truncate max-w-[320px]">{meeting.title}</span>
      </div>

      <MeetingDetailWorkspace
        meeting={meeting}
        project={project}
        utterances={effectiveUtterances}
        decisions={meetingDecisions.length > 0 ? meetingDecisions : store.decisions.slice(0, 3)}
        actionItems={meetingActions.length > 0 ? meetingActions : store.actionItems.slice(0, 3)}
        conflicts={meetingConflicts.length > 0 ? meetingConflicts : store.conflicts.slice(0, 2)}
        people={store.people}
      />
    </div>
  );
}
