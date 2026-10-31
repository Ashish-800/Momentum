// tests/integration/api-gates.test.ts
// Integration tests for Server Approval Gate, Idempotent Sync, Conflict Lineage & Assistant Grounding

import { describe, it, expect, beforeEach } from "vitest";
import { POST as syncHandler } from "@/lib/../app/api/sync/route";
import { POST as resolveConflictHandler } from "@/lib/../app/api/conflicts/[id]/resolve/route";
import { POST as assistantHandler } from "@/lib/../app/api/assistant/route";
import { resetInMemoryStore, getInMemoryStore, SEED_IDS } from "@/lib/db/seed";
import { NextRequest } from "next/server";

function createNextRequest(url: string, body: any): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("API Integration Gates & Server Enforcement", () => {
  beforeEach(() => {
    resetInMemoryStore();
  });

  describe("Server Approval Gate (POST /api/sync)", () => {
    it("returns HTTP 409 Conflict when attempting to sync unapproved proposed items", async () => {
      const store = getInMemoryStore();
      // Ensure pending item is in proposed status
      const pendingTask = store.actionItems.find((a: any) => a.status === "proposed");
      expect(pendingTask).toBeDefined();

      const req = createNextRequest("http://localhost:3000/api/sync", {
        itemIds: [pendingTask.id],
        targetProvider: "internal",
      });

      const res = await syncHandler(req);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.code).toBe("UNAPPROVED_OR_CONFLICTED_ITEM");
      expect(json.error).toContain("Strict Human-in-the-Loop gate violation");
      expect(json.unapprovedActionIds).toContain(pendingTask.id);
    });

    it("returns HTTP 409 Conflict when an approved item is blocked by an open conflict", async () => {
      const store = getInMemoryStore();
      // Arjun's release branch is approved but blocked by the open schedule conflict
      const arjunTask = store.actionItems.find((a: any) => a.id === SEED_IDS.ACTION_ARJUN_RELEASE_BRANCH);
      expect(arjunTask).toBeDefined();
      expect(arjunTask.status).toBe("approved");

      // Verify conflict is open
      const openConflict = store.conflicts.find((c: any) => c.status === "open");
      expect(openConflict).toBeDefined();

      const req = createNextRequest("http://localhost:3000/api/sync", {
        itemIds: [arjunTask.id],
        targetProvider: "internal",
      });

      const res = await syncHandler(req);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.code).toBe("UNAPPROVED_OR_CONFLICTED_ITEM");
      expect(json.details.some((d: string) => d.includes("blocked by an unresolved open conflict"))).toBe(true);
    });

    it("performs zero writes when request is rejected with 409", async () => {
      const store = getInMemoryStore();
      const initialRemindersCount = (store.reminders || []).length;
      const initialAuditLogsCount = (store.auditLogs || []).length;

      const req = createNextRequest("http://localhost:3000/api/sync", {
        itemIds: [SEED_IDS.ACTION_ARJUN_RELEASE_BRANCH],
        targetProvider: "internal",
      });

      const res = await syncHandler(req);
      expect(res.status).toBe(409);

      // Verify zero side-effect writes occurred
      expect((store.reminders || []).length).toBe(initialRemindersCount);
      expect((store.auditLogs || []).length).toBe(initialAuditLogsCount);
    });
  });

  describe("Idempotent External Sync", () => {
    it("successfully syncs unblocked approved items and creates reminders and audit logs", async () => {
      const store = getInMemoryStore();
      // First resolve the blocking conflict
      store.conflicts.forEach((c: any) => {
        c.status = "resolved_keep_old";
      });

      const arjunTask = store.actionItems.find((a: any) => a.id === SEED_IDS.ACTION_ARJUN_RELEASE_BRANCH);
      arjunTask.status = "approved";

      const req = createNextRequest("http://localhost:3000/api/sync", {
        itemIds: [arjunTask.id],
        targetProvider: "internal",
      });

      const res = await syncHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.syncedCount).toBe(1);
      expect(json.remindersScheduled).toBe(2); // 24h and 2h reminders scheduled!

      // Verify task status transitioned to synced
      expect(arjunTask.status).toBe("synced");
      expect(arjunTask.externalRef).toBeDefined();
    });

    it("deduplicates subsequent sync attempts with zero duplicate cards (idempotency)", async () => {
      const store = getInMemoryStore();
      store.conflicts.forEach((c: any) => {
        c.status = "resolved_keep_old";
      });

      const arjunTask = store.actionItems.find((a: any) => a.id === SEED_IDS.ACTION_ARJUN_RELEASE_BRANCH);
      arjunTask.status = "approved";

      // 1st Sync
      const req1 = createNextRequest("http://localhost:3000/api/sync", {
        itemIds: [arjunTask.id],
        targetProvider: "internal",
      });
      await syncHandler(req1);
      const initialCardsCount = store.internalTasks.length;

      // 2nd Sync with exact same payload
      arjunTask.status = "approved"; // re-flag to attempt sync
      const req2 = createNextRequest("http://localhost:3000/api/sync", {
        itemIds: [arjunTask.id],
        targetProvider: "internal",
      });
      const res2 = await syncHandler(req2);
      expect(res2.status).toBe(200);

      // Card count in internal store remains exactly the same!
      expect(store.internalTasks.length).toBe(initialCardsCount);
    });
  });

  describe("Conflict Resolution Lineage (POST /api/conflicts/[id]/resolve)", () => {
    it("action 'resolved_supersede' updates lineage, flags downstream tasks, and writes audit log", async () => {
      const store = getInMemoryStore();
      const conflict = store.conflicts[0];
      const oldDec = store.decisions.find((d: any) => d.id === conflict.oldDecisionId);
      const newDec = store.decisions.find((d: any) => d.id === conflict.newDecisionId);

      const req = createNextRequest(
        `http://localhost:3000/api/conflicts/${conflict.id}/resolve`,
        {
          action: "resolved_supersede",
          resolutionNote: "Adopted 1 Dec launch date to ensure full QA readiness",
          actorName: "Priya Nair",
        }
      );

      const res = await resolveConflictHandler(req, {
        params: Promise.resolve({ id: conflict.id }),
      });
      expect(res.status).toBe(200);

      // Verify conflict updated
      expect(conflict.status).toBe("resolved_supersede");

      // Verify old decision is superseded
      expect(oldDec.status).toBe("superseded");

      // Verify new decision is active and carries supersedesId
      expect(newDec.status).toBe("active");
      expect(newDec.supersedesId).toBe(oldDec.id);

      // Verify downstream action items flagged with suggested fix
      const arjunTask = store.actionItems.find((a: any) => a.id === SEED_IDS.ACTION_ARJUN_RELEASE_BRANCH);
      expect(arjunTask.needsInput).toBe(true);
      expect(arjunTask.suggestedFix).toContain("1 Dec");

      // Verify audit log
      const audit = store.auditLogs.find(
        (l: any) => l.action === "resolve_conflict" && l.entityId === conflict.id
      );
      expect(audit).toBeDefined();
      expect(audit.actorName).toBe("Priya Nair");
    });

    it("action 'resolved_keep_old' confirms historical decision and rejects proposed", async () => {
      const store = getInMemoryStore();
      const conflict = store.conflicts[0];
      const oldDec = store.decisions.find((d: any) => d.id === conflict.oldDecisionId);
      const newDec = store.decisions.find((d: any) => d.id === conflict.newDecisionId);

      const req = createNextRequest(
        `http://localhost:3000/api/conflicts/${conflict.id}/resolve`,
        {
          action: "resolved_keep_old",
          resolutionNote: "Board locked 15 Nov date; rejected 1 Dec slip",
          actorName: "Priya Nair",
        }
      );

      const res = await resolveConflictHandler(req, {
        params: Promise.resolve({ id: conflict.id }),
      });
      expect(res.status).toBe(200);

      expect(conflict.status).toBe("resolved_keep_old");
      expect(oldDec.status).toBe("active");
      expect(newDec.status).toBe("rejected");
    });
  });

  describe("Grounded AI Assistant & Citations", () => {
    it("returns grounded answers with verbatim evidence citations for launch date question", async () => {
      const req = createNextRequest("http://localhost:3000/api/assistant", {
        query: "What is our official public launch date and why was it chosen?",
      });

      const res = await assistantHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.answer).toBeDefined();
      expect(json.citations.length).toBeGreaterThan(0);
      // Citation should link to Launch Planning meeting or decision
      const hasLaunchRef = json.citations.some(
        (c: any) => (c.meeting && c.meeting.includes("Launch")) || c.meetingId === SEED_IDS.MEET_1_LAUNCH_PLANNING
      );
      expect(hasLaunchRef).toBe(true);
    });

    it("returns grounded answers for platform scope question citing Android-first strategy", async () => {
      const req = createNextRequest("http://localhost:3000/api/assistant", {
        query: "Are we shipping Android and iOS together?",
      });

      const res = await assistantHandler(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.answer).toBeDefined();
      expect(json.citations.length).toBeGreaterThan(0);
      expect(json.answer).toContain("Android");
    });
  });
});
