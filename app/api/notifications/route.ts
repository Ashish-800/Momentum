// app/api/notifications/route.ts
// In-App Notifications & Reminder Dispatch API

import { NextRequest, NextResponse } from "next/server";
import { getInMemoryStore } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getInMemoryStore();
  const reminders = store.reminders || [];
  const actionItems = store.actionItems || [];
  const people = store.people || [];

  // Fired reminders represent active notifications
  const notifications = reminders
    .filter((r: any) => r.status === "fired")
    .map((r: any) => {
      const action = actionItems.find((a: any) => a.id === r.actionItemId);
      const person = people.find((p: any) => p.id === r.personId);
      return {
        ...r,
        actionTitle: action?.title,
        actionPriority: action?.priority,
        actionMeetingId: action?.meetingId,
        personName: person?.name,
      };
    });

  return NextResponse.json({
    unreadCount: notifications.length,
    notifications,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, reminderId, actionItemId } = body;
    const store = getInMemoryStore();

    if (action === "mark_complete" && actionItemId) {
      const task = store.actionItems.find((a: any) => a.id === actionItemId);
      if (task) task.status = "completed";
      const rem = store.reminders.find((r: any) => r.id === reminderId);
      if (rem) rem.status = "done";

      return NextResponse.json({ success: true, message: "Task marked complete" });
    }

    if (action === "snooze" && reminderId) {
      const rem = store.reminders.find((r: any) => r.id === reminderId);
      if (rem) {
        rem.status = "pending";
        // Push 4 hours into future from current simNow
        const currentSim = new Date(store.workspace.simNow);
        rem.remindAt = new Date(currentSim.getTime() + 4 * 60 * 60 * 1000);
      }
      return NextResponse.json({ success: true, message: "Snoozed for 4 hours" });
    }

    if (action === "dismiss" && reminderId) {
      const rem = store.reminders.find((r: any) => r.id === reminderId);
      if (rem) rem.status = "done";
      return NextResponse.json({ success: true, message: "Notification dismissed" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

