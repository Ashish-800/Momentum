// lib/ai/demo-fallback.ts
// Pre-computed, high-precision responses for offline / demo mode.
// Ensures zero-breakage demo resilience even without API keys or during network outages.

import { CleanUtterance, SpeechCleanupResponse } from "./schemas";
import { SEED_IDS } from "@/lib/db/seed";

export function getDemoRecapFallback(rawTranscript: string): SpeechCleanupResponse {
  return {
    summaryOfCorrections:
      "Stripped 6 conversational filler patterns, resolved 1 verbal date self-correction (Friday → Monday for Meera's Figma handoff), flagged 1 off-topic food digression, and mapped 4 addressed colleagues.",
    detectedDigressionsCount: 1,
    utterances: [
      {
        id: "utt_demo_01",
        seq: 1,
        speakerId: SEED_IDS.PERSON_PRIYA,
        speakerName: "Priya Nair",
        rawText: "Okay so, um, quick recap of today’s sync.",
        cleanText: "Quick recap of today's sync.",
        isDigression: false,
        corrections: [
          {
            original: "Okay so, um,",
            replacement: "",
            kind: "filler",
            rationale: "Removed opening filler words",
          },
        ],
        addressedPersonIds: [],
      },
      {
        id: "utt_demo_02",
        seq: 2,
        speakerId: SEED_IDS.PERSON_PRIYA,
        speakerName: "Priya Nair",
        rawText:
          "So basically we, uh, talked about the launch and honestly I think we should push the launch to December first, like the fifteenth of November is just not realistic with the QA backlog.",
        cleanText:
          "We discussed the launch schedule and I propose pushing the launch date to December 1st, as November 15th is not realistic given our current QA backlog.",
        isDigression: false,
        corrections: [
          {
            original: "So basically we, uh,",
            replacement: "We",
            kind: "filler",
            rationale: "Removed leading filler",
          },
          {
            original: "honestly I think",
            replacement: "I propose",
            kind: "filler",
            rationale: "Polished colloquial speech to executive clarity",
          },
        ],
        addressedPersonIds: [SEED_IDS.PERSON_SANA],
      },
      {
        id: "utt_demo_03",
        seq: 3,
        speakerId: SEED_IDS.PERSON_PRIYA,
        speakerName: "Priya Nair",
        rawText:
          "And, you know, we also decided to ship Android and iOS together, which, yeah, I know changes what we said last time.",
        cleanText:
          "We also decided to ship Android and iOS together, which updates our previous single-platform strategy.",
        isDigression: false,
        corrections: [
          {
            original: "And, you know,",
            replacement: "",
            kind: "filler",
            rationale: "Removed conversational filler",
          },
          {
            original: "which, yeah, I know changes what we said last time",
            replacement: "which updates our previous single-platform strategy",
            kind: "filler",
            rationale: "Standardized update wording",
          },
        ],
        addressedPersonIds: [SEED_IDS.PERSON_ARJUN],
      },
      {
        id: "utt_demo_04",
        seq: 4,
        speakerId: SEED_IDS.PERSON_PRIYA,
        speakerName: "Priya Nair",
        rawText: "Meera will share the final screens by Friday, no, sorry, Monday, Monday is better for her.",
        cleanText: "Meera will share the final screens by Monday.",
        isDigression: false,
        corrections: [
          {
            original: "by Friday, no, sorry, Monday, Monday is better for her",
            replacement: "by Monday",
            kind: "self-correction",
            rationale: "Resolved verbal self-correction from Friday to Monday for Meera's delivery",
          },
        ],
        addressedPersonIds: [SEED_IDS.PERSON_MEERA],
      },
      {
        id: "utt_demo_05",
        seq: 5,
        speakerId: SEED_IDS.PERSON_PRIYA,
        speakerName: "Priya Nair",
        rawText: "Side note, has anyone tried the new biryani place near the office? Anyway, back to it.",
        cleanText: "[Off-topic digression hidden: discussion about local restaurant near office]",
        isDigression: true,
        corrections: [
          {
            original: "Side note, has anyone tried the new biryani place near the office? Anyway, back to it.",
            replacement: "[Off-topic digression hidden]",
            kind: "digression",
            rationale: "Flagged casual lunch venue conversation not relevant to project scope",
          },
        ],
        addressedPersonIds: [],
      },
      {
        id: "utt_demo_06",
        seq: 6,
        speakerId: SEED_IDS.PERSON_PRIYA,
        speakerName: "Priya Nair",
        rawText: "Rohan keeps owning the launch campaign, nothing changes there.",
        cleanText: "Rohan retains ownership of the launch campaign with no changes to scope.",
        isDigression: false,
        corrections: [],
        addressedPersonIds: [SEED_IDS.PERSON_ROHAN],
      },
      {
        id: "utt_demo_07",
        seq: 7,
        speakerId: SEED_IDS.PERSON_PRIYA,
        speakerName: "Priya Nair",
        rawText: "Oh and Sana, you’ll update the test plan by next Wednesday.",
        cleanText: "Sana will update the QA test plan by next Wednesday.",
        isDigression: false,
        corrections: [
          {
            original: "Oh and Sana, you’ll",
            replacement: "Sana will",
            kind: "filler",
            rationale: "Cleaned conversational transition",
          },
        ],
        addressedPersonIds: [SEED_IDS.PERSON_SANA],
      },
      {
        id: "utt_demo_08",
        seq: 8,
        speakerId: SEED_IDS.PERSON_PRIYA,
        speakerName: "Priya Nair",
        rawText: "Arjun, can you freeze the release branch right after that?",
        cleanText: "Arjun will freeze the release branch immediately following the test plan update.",
        isDigression: false,
        corrections: [],
        addressedPersonIds: [SEED_IDS.PERSON_ARJUN],
      },
    ],
  };
}

