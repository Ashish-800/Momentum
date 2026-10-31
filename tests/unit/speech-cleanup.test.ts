// tests/unit/speech-cleanup.test.ts
// Unit tests for Stage 1 Speech Cleanup & Self-Correction Engine

import { describe, it, expect } from "vitest";
import { cleanSpokenUtterance } from "@/lib/ai/speech-cleanup-engine";

describe("Stage 1 Speech Cleanup Engine", () => {
  describe("15+ Conversational Self-Correction Patterns", () => {
    it("Pattern 1: 'no sorry' (Meera Friday -> Monday)", () => {
      const res = cleanSpokenUtterance(
        "Meera will share the final screens by Friday, no, sorry, Monday."
      );
      expect(res.cleanText).toContain("by Monday");
      expect(res.cleanText).not.toContain("Friday");
      expect(res.corrections.some((c) => c.kind === "self-correction")).toBe(true);
    });

    it("Pattern 2: 'I mean' (budget correction)", () => {
      const res = cleanSpokenUtterance(
        "We allocated three lakhs, I mean four lakhs for creators."
      );
      expect(res.cleanText).toMatch(/four lakhs/i);
      expect(res.cleanText).not.toContain("three lakhs");
    });

    it("Pattern 3: 'scratch that' (date slip)", () => {
      const res = cleanSpokenUtterance(
        "Release next Tuesday, scratch that, Wednesday morning."
      );
      expect(res.cleanText).toContain("Wednesday morning");
      expect(res.cleanText).not.toContain("Tuesday");
    });

    it("Pattern 4: 'actually make it' (target date change)", () => {
      const res = cleanSpokenUtterance(
        "Target November 15, actually make it December 1st for safety."
      );
      expect(res.cleanText).toContain("December 1st");
      expect(res.cleanText).not.toContain("November 15");
    });

    it("Pattern 5: 'wait no' (owner disambiguation)", () => {
      const res = cleanSpokenUtterance(
        "Arjun owns this deliverable, wait no, Rohan owns this."
      );
      expect(res.cleanText).toContain("Rohan owns this");
    });

    it("Pattern 6: 'or rather' (timeline refinement)", () => {
      const res = cleanSpokenUtterance(
        "We need five days, or rather, seven days for QA regression."
      );
      expect(res.cleanText).toMatch(/seven days/i);
    });

    it("Pattern 7: 'rather' (platform strategy)", () => {
      const res = cleanSpokenUtterance(
        "Ship iOS first, rather, Android first."
      );
      expect(res.cleanText).toMatch(/Android first/i);
    });

    it("Pattern 8: 'let's change that to' (sprint cycle)", () => {
      const res = cleanSpokenUtterance(
        "Two weeks, let's change that to three weeks."
      );
      expect(res.cleanText).toMatch(/three weeks/i);
    });

    it("Pattern 9: 'not X, but Y' (deadline switch)", () => {
      const res = cleanSpokenUtterance(
        "Deliver not Friday, but Monday."
      );
      expect(res.cleanText).toMatch(/Monday/i);
    });

    it("Pattern 10: 'strike that' (channel choice)", () => {
      const res = cleanSpokenUtterance(
        "Send via Slack, strike that, email announcement."
      );
      expect(res.cleanText).toMatch(/email announcement/i);
    });

    it("Pattern 11: 'my bad' (version bump)", () => {
      const res = cleanSpokenUtterance(
        "Tag version 2.0, my bad, version 2.1-rc1."
      );
      expect(res.cleanText).toContain("version 2.1-rc1");
    });

    it("Pattern 12: 'correction' (test count)", () => {
      const res = cleanSpokenUtterance(
        "Ten test scenarios, correction, forty-two scenarios."
      );
      expect(res.cleanText).toContain("forty-two scenarios");
    });

    it("Pattern 13: 'I misspoke' (quarter target)", () => {
      const res = cleanSpokenUtterance(
        "Q3 rollout, I misspoke, Q4 launch."
      );
      expect(res.cleanText).toContain("Q4 launch");
    });

    it("Pattern 14: 'make that' (headcount)", () => {
      const res = cleanSpokenUtterance(
        "Allocate two engineers, make that three engineers."
      );
      expect(res.cleanText).toMatch(/three engineers/i);
    });

    it("Pattern 15: 'let me rephrase' (architectural decision)", () => {
      const res = cleanSpokenUtterance(
        "Delay both apps, let me rephrase, stagger the rollout."
      );
      expect(res.cleanText).toMatch(/stagger the rollout/i);
    });

    it("Pattern 16: 'actually' (date shift)", () => {
      const res = cleanSpokenUtterance(
        "Deliver by Friday, actually Monday."
      );
      expect(res.cleanText).toContain("by Monday");
    });
  });

  describe("Filler Stripping & Grammatical Preservation", () => {
    it("strips opening and mid-sentence fillers ('um', 'uh', 'you know')", () => {
      const res = cleanSpokenUtterance(
        "Okay um, we, uh, should definitely, you know, lock the date."
      );
      expect(res.cleanText).not.toContain("um");
      expect(res.cleanText).not.toContain("uh");
      expect(res.cleanText).not.toContain("you know");
      expect(res.cleanText).toContain("definitely");
      expect(res.cleanText).toContain("lock the date");
    });

    it("preserves grammatical uses of 'like' (e.g. 'feels like', 'sounds like', 'like a')", () => {
      const res = cleanSpokenUtterance(
        "The new Neumorphic button feels like a physical switch, not like a flat web element."
      );
      expect(res.cleanText).toContain("feels like a physical switch");
      expect(res.cleanText).toContain("not like a flat web element");
    });

    it("preserves grammatical uses of 'basically' (e.g. 'is basically complete')", () => {
      const res = cleanSpokenUtterance(
        "Wispr Flow dictation integration is basically complete for Android."
      );
      expect(res.cleanText).toContain("is basically complete for Android");
    });

    it("strips filler uses of 'like' and 'basically'", () => {
      const res = cleanSpokenUtterance(
        "So basically, we should, like, push the date."
      );
      expect(res.cleanText).not.toMatch(/\bbasically,\b/i);
      expect(res.cleanText).not.toMatch(/, like,/i);
      expect(res.cleanText).toContain("push the date");
    });
  });

  describe("Off-Topic Digression Detection", () => {
    it("tags off-topic food/lunch digressions (biryani reference in Demo Recap)", () => {
      const res = cleanSpokenUtterance(
        "Side note, has anyone tried the new biryani place near the office?"
      );
      expect(res.isDigression).toBe(true);
      expect(res.corrections.some((c) => c.kind === "digression")).toBe(true);
    });

    it("tags coffee and weather digressions", () => {
      const res1 = cleanSpokenUtterance("Did someone grab coffee from the third floor?");
      expect(res1.isDigression).toBe(true);

      const res2 = cleanSpokenUtterance("The Bangalore traffic was terrible this morning.");
      expect(res2.isDigression).toBe(true);
    });

    it("does not tag legitimate work statements as digressions", () => {
      const res = cleanSpokenUtterance(
        "Arjun Rao will freeze the release branch on Thursday following the QA test pass."
      );
      expect(res.isDigression).toBe(false);
    });
  });
});
