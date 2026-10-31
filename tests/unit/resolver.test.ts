// tests/unit/resolver.test.ts
// Unit tests for Stage 4: Deterministic Date & Owner Resolver

import { describe, it, expect } from "vitest";
import {
  resolveRelativeDate,
  resolveOwner,
  resolveIntelligence,
} from "@/lib/ai/pipeline/stage4-resolve";
import { SEED_IDS } from "@/lib/db/seed";

describe("Stage 4 Date & Owner Resolver", () => {
  const ANCHOR_DATE = "2026-10-31"; // Saturday, 31 Oct 2026 (Asia/Kolkata)

  describe("Relative Date Anchoring (Anchor: Sat 31 Oct 2026)", () => {
    it("resolves 'Monday' to 2026-11-02 (Meera's final Figma screens)", () => {
      const resolved = resolveRelativeDate("by Monday", ANCHOR_DATE);
      expect(resolved).toBe("2026-11-02");
    });

    it("resolves 'next Wednesday' to 2026-11-04 (Sana's QA test plan)", () => {
      const resolved = resolveRelativeDate("by next Wednesday", ANCHOR_DATE);
      expect(resolved).toBe("2026-11-04");
    });

    it("resolves 'December first' to 2026-12-01 (postponed launch date proposal)", () => {
      const resolved1 = resolveRelativeDate("December first", ANCHOR_DATE);
      expect(resolved1).toBe("2026-12-01");

      const resolved2 = resolveRelativeDate("1 Dec 2026", ANCHOR_DATE);
      expect(resolved2).toBe("2026-12-01");
    });

    it("resolves 'tomorrow' across month boundary (31 Oct -> 1 Nov 2026)", () => {
      const resolved = resolveRelativeDate("tomorrow", ANCHOR_DATE);
      expect(resolved).toBe("2026-11-01");
    });

    it("resolves 'next week' to 2026-11-07", () => {
      const resolved = resolveRelativeDate("next week", ANCHOR_DATE);
      expect(resolved).toBe("2026-11-07");
    });

    it("returns null for non-date relative dependencies (e.g. 'right after that')", () => {
      const resolved = resolveRelativeDate("right after that", ANCHOR_DATE);
      expect(resolved).toBeNull();
    });

    it("passes through valid ISO date strings", () => {
      const resolved = resolveRelativeDate("2026-11-15T00:00:00Z", ANCHOR_DATE);
      expect(resolved).toBe("2026-11-15");
    });
  });

  describe("Fuzzy Owner Disambiguation", () => {
    const ROSTER = [
      { id: "person_priya", name: "Priya Nair" },
      { id: "person_arjun_rao", name: "Arjun Rao" },
      { id: "person_arjun_sharma", name: "Arjun Sharma" }, // Duplicate first name
      { id: "person_meera", name: "Meera Shah" },
      { id: "person_rohan", name: "Rohan Gupta" },
      { id: "person_sana", name: "Sana Khan" },
    ];

    it("resolves exact full name matches", () => {
      const owner = resolveOwner("Priya Nair", ROSTER);
      expect(owner.id).toBe("person_priya");
      expect(owner.name).toBe("Priya Nair");
    });

    it("resolves unique first name match ('Meera' -> Meera Shah)", () => {
      const owner = resolveOwner("Meera", ROSTER);
      expect(owner.id).toBe("person_meera");
      expect(owner.name).toBe("Meera Shah");
    });

    it("disambiguates duplicate first names by last name ('Arjun Rao')", () => {
      const ownerRao = resolveOwner("Arjun Rao", ROSTER);
      expect(ownerRao.id).toBe("person_arjun_rao");

      const ownerSharma = resolveOwner("Arjun Sharma", ROSTER);
      expect(ownerSharma.id).toBe("person_arjun_sharma");
    });

    it("returns 'Unassigned' when ownerName is omitted", () => {
      const owner = resolveOwner(undefined, ROSTER);
      expect(owner.id).toBeNull();
      expect(owner.name).toBe("Unassigned");
    });
  });

  describe("Relative Dependency Guard (needs_input: true)", () => {
    it("flags relative dependencies missing anchor date with suggested_fix (Arjun's release branch)", async () => {
      const result = await resolveIntelligence({
        decisions: [],
        actionItems: [
          {
            tempId: "act_arjun_dep",
            title: "Freeze release branch right after that",
            ownerNameRaw: "Arjun Rao",
            deadlineText: "right after that",
            priority: "high",
            confidence: 0.95,
            evidenceUtteranceIds: [],
          },
        ],
        options: { meetingDate: ANCHOR_DATE },
      });

      expect(result.actionItems).toHaveLength(1);
      const act = result.actionItems[0];
      expect(act.needsInput).toBe(true);
      expect(act.needsInputReason).toContain("depends on Sana's test plan");
      expect(act.suggestedFix).toBe("2026-11-05");
      expect(act.resolvedDueDate).toBe("2026-11-05");
      expect(act.isTaskUpdate).toBe(true);
    });

    it("links task updates to existing actions in store (updatesActionId)", async () => {
      const result = await resolveIntelligence({
        decisions: [],
        actionItems: [
          {
            tempId: "act_meera_update",
            title: "Meera will share the final screens by Monday",
            ownerNameRaw: "Meera Shah",
            deadlineText: "by Monday",
            priority: "high",
            confidence: 0.98,
            evidenceUtteranceIds: [],
          },
        ],
        options: { meetingDate: ANCHOR_DATE },
      });

      const act = result.actionItems[0];
      expect(act.updatesActionId).toBe(SEED_IDS.ACTION_MEERA_FIGMA);
      expect(act.isTaskUpdate).toBe(true);
      expect(act.resolvedDueDate).toBe("2026-11-02");
    });
  });
});

