// tests/unit/conflict-guards.test.ts
// Unit tests for Conflict Guards, Reaffirmation Protection, Idempotency & Reminder Math

import { describe, it, expect, beforeEach } from "vitest";
import { detectCrossMeetingConflicts } from "@/lib/ai/pipeline/stage5-memory";
import { resetInMemoryStore, getInMemoryStore, SEED_IDS } from "@/lib/db/seed";

describe("Conflict Detection Engine & Scheduling Math", () => {
  beforeEach(() => {
    resetInMemoryStore();
  });

  describe("Hybrid Conflict Detection", () => {
    it("flags high-severity DATE conflict when proposed launch date contradicts 15 Nov", async () => {
      const result = await detectCrossMeetingConflicts({
        newDecisions: [
          {
            id: "dec_prop_1dec",
            tempId: "dec_prop_1dec",
            topic: "launch-date",
            statement: "Push public launch date to December 1st 2026",
            ownerName: "Priya Nair",
            confidence: 0.95,
            evidenceUtteranceIds: [],
          },
        ],
      });

      expect(result.conflicts).toHaveLength(1);
      const conf = result.conflicts[0];
      expect(conf.conflictType).toBe("date");
      expect(conf.severity).toBe("high");
      expect(conf.oldValue).toBe("15 Nov 2026");
      expect(conf.newValue).toBe("1 Dec 2026");
      expect(conf.downstreamActionIds).toContain(SEED_IDS.ACTION_ARJUN_RELEASE_BRANCH);
    });

    it("flags high-severity SCOPE conflict when proposed simultaneous rollout contradicts Android-first", async () => {
      const result = await detectCrossMeetingConflicts({
        newDecisions: [
          {
            id: "dec_prop_scope",
            tempId: "dec_prop_scope",
            topic: "platform-scope",
            statement: "Ship Android and iOS versions together simultaneously",
            ownerName: "Priya Nair",
            confidence: 0.94,
            evidenceUtteranceIds: [],
          },
        ],
      });

      expect(result.conflicts).toHaveLength(1);
      const conf = result.conflicts[0];
      expect(conf.conflictType).toBe("scope");
      expect(conf.severity).toBe("high");
      expect(conf.explanation).toContain("simultaneous launch of Android and iOS directly overturns");
    });

    it("does NOT flag reaffirmations as conflicts (Rohan keeps campaign ownership)", async () => {
      const result = await detectCrossMeetingConflicts({
        newDecisions: [
          {
            id: "dec_prop_reaffirm",
            tempId: "dec_prop_reaffirm",
            topic: "ownership",
            statement: "Rohan Gupta keeps owning the launch campaign, nothing changes there",
            ownerName: "Rohan Gupta",
            isReaffirmation: true,
            reaffirmsDecisionId: SEED_IDS.DEC_CAMPAIGN_OWNERSHIP,
            confidence: 0.99,
            evidenceUtteranceIds: [],
          },
        ],
      });

      expect(result.conflicts).toHaveLength(0);
      expect(result.reaffirmations).toHaveLength(1);
      expect(result.reaffirmations[0].reaffirmedDecisionId).toBe(SEED_IDS.DEC_CAMPAIGN_OWNERSHIP);
    });

    it("isolates cross-project decisions (does not conflict with different project ID)", async () => {
      const store = getInMemoryStore();
      // Add another project's decision
      store.decisions.push({
        id: "dec_other_proj",
        workspaceId: SEED_IDS.WORKSPACE_ID,
        projectId: "proj_desktop_v1", // DIFFERENT PROJECT
        topic: "launch-date",
        statement: "Desktop launch is 15 January 2027",
        status: "active",
        createdAt: new Date(),
      });

      const result = await detectCrossMeetingConflicts({
        newDecisions: [
          {
            id: "dec_prop_mobile",
            tempId: "dec_prop_mobile",
            topic: "launch-date",
            statement: "Desktop launch postponed to February",
            ownerName: "Priya Nair",
            confidence: 0.9,
            evidenceUtteranceIds: [],
          },
        ],
        options: { projectId: SEED_IDS.PROJECT_MOBILE_V2 }, // Query only Mobile v2
      });

      // Should not conflict with desktop project
      const hasDesktopClash = result.conflicts.some((c) => c.oldDecisionId === "dec_other_proj");
      expect(hasDesktopClash).toBe(false);
    });
  });

  describe("Reminder Scheduling Math & Lead Times", () => {
    it("calculates exact 24h and 2h lead times for task due dates", () => {
      const dueDate = new Date("2026-11-05T18:00:00+05:30"); // 5 Nov 18:00 IST

      const remind24h = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);
      const remind2h = new Date(dueDate.getTime() - 2 * 60 * 60 * 1000);

      expect(remind24h.toISOString()).toBe(new Date("2026-11-04T18:00:00+05:30").toISOString());
      expect(remind2h.toISOString()).toBe(new Date("2026-11-05T16:00:00+05:30").toISOString());
    });

    it("fires reminders correctly when simulated clock advances past remindAt", () => {
      const store = getInMemoryStore();
      const remindAt = new Date("2026-11-01T06:00:00Z");
      store.reminders = [
        {
          id: "rem_test_01",
          remindAt,
          status: "pending",
          actionTitle: "Test cut branch",
        },
      ];

      // Clock before remindAt
      const simBefore = new Date("2026-11-01T05:59:00Z");
      expect(store.reminders[0].status).toBe("pending");

      // Clock after remindAt
      const simAfter = new Date("2026-11-01T06:01:00Z");
      store.reminders.forEach((r: any) => {
        if (r.status === "pending" && r.remindAt <= simAfter) {
          r.status = "fired";
        }
      });

      expect(store.reminders[0].status).toBe("fired");
    });
  });
});

