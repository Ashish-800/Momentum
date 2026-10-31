// app/api/meetings/[id]/utterances/route.ts
// Persists normalized utterances for a meeting with Zod validation.
// In Debrief Mode: splits raw paragraph into sentences and tags addressed colleagues.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getInMemoryStore, SEED_IDS } from "@/lib/db/seed";

const UtteranceInputSchema = z.object({
  rawText: z.string().min(1),
  speakerNameRaw: z.string().optional(),
  speakerId: z.string().nullable().optional(),
  seq: z.number().optional(),
  tStart: z.number().optional(),
  captureMode: z.enum(["debrief", "roundtable", "import"]).default("debrief"),
});

const BatchUtterancesSchema = z.object({
  utterances: z.array(UtteranceInputSchema),
  captureMode: z.enum(["debrief", "roundtable", "import"]).default("debrief"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = getInMemoryStore();
  const utterances = store.utterances.filter((u: { meetingId: string }) => u.meetingId === id);

  return NextResponse.json({
    success: true,
    meetingId: id,
    utterances,
    count: utterances.length,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const json = await req.json();
    const store = getInMemoryStore();

    // Verify meeting exists
    const meeting = store.meetings.find((m: { id: string }) => m.id === id);
    if (!meeting) {
      return NextResponse.json(
        { success: false, error: "Meeting not found" },
        { status: 404 }
      );
    }

    const validated = BatchUtterancesSchema.parse(json);
    const existingUtterances = store.utterances.filter((u: { meetingId: string }) => u.meetingId === id);
    let nextSeq = existingUtterances.length + 1;

    const newUtterances: any[] = [];

    if (validated.captureMode === "debrief") {
      // In Debrief Mode: split single block into sentences if single item provided
      const rawBlock = validated.utterances.map((u) => u.rawText).join("\n");
      const sentences = rawBlock
        .replace(/([.?!])\s+(?=[A-Z])/g, "$1|")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);

      for (const sentence of sentences) {
        // Tag addressed colleagues
        const addressed: string[] = [];
        if (/meera/i.test(sentence)) addressed.push(SEED_IDS.PERSON_MEERA);
        if (/rohan/i.test(sentence)) addressed.push(SEED_IDS.PERSON_ROHAN);
        if (/sana/i.test(sentence)) addressed.push(SEED_IDS.PERSON_SANA);
        if (/arjun/i.test(sentence)) addressed.push(SEED_IDS.PERSON_ARJUN);

        const utt = {
          id: `utt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          meetingId: id,
          speakerId: SEED_IDS.PERSON_PRIYA,
          speakerNameRaw: "Priya Nair",
          seq: nextSeq++,
          tStart: null,
          rawText: sentence,
          cleanText: sentence,
          isDigression: /biryani|lunch|coffee/i.test(sentence),
          corrections: [],
          addressedPersonIds: addressed,
          createdAt: new Date(),
        };

        newUtterances.push(utt);
        store.utterances.push(utt);
      }
    } else {
      // Roundtable or Multi-Format Import
      for (const item of validated.utterances) {
        const utt = {
          id: `utt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          meetingId: id,
          speakerId: item.speakerId || null,
          speakerNameRaw: item.speakerNameRaw || "Participant",
          seq: item.seq || nextSeq++,
          tStart: item.tStart || null,
          rawText: item.rawText,
          cleanText: item.rawText,
          isDigression: false,
          corrections: [],
          addressedPersonIds: [],
          createdAt: new Date(),
        };

        newUtterances.push(utt);
        store.utterances.push(utt);
      }
    }

    // Update meeting status to processing/needs_review
    meeting.status = "needs_review";

    return NextResponse.json({
      success: true,
      meetingId: id,
      savedCount: newUtterances.length,
      utterances: newUtterances,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Invalid utterance payload" },
      { status: 400 }
    );
  }
}

