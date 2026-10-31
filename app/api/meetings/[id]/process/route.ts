// app/api/meetings/[id]/process/route.ts
// Server-Sent Events (SSE) Route driving the complete 6-Stage AI Pipeline.
// Stage 1: Clean (Fillers, self-corrections, digressions)
// Stage 2: Attribute (Speaker attribution & addressing)
// Stage 3: Extract (Epistemic taxonomy: decisions, action items, risks, questions)
// Stage 4: Resolve (Date anchoring to 2026-10-31, roster matching, needs_input on relative deps)
// Stage 5: Remember & Compare (Hybrid Conflict Judge vs. Northstar persistent memory)
// Stage 6: Stage (Store persistence, progressive staging events, 3-sentence summary)

import { NextRequest } from "next/server";
import { getInMemoryStore, SEED_IDS } from "@/lib/db/seed";
import { cleanTranscriptWithAI } from "@/lib/ai/client";
import { extractMeetingIntelligence } from "@/lib/ai/pipeline/stage3-extract";
import { resolveIntelligence } from "@/lib/ai/pipeline/stage4-resolve";
import { detectCrossMeetingConflicts } from "@/lib/ai/pipeline/stage5-memory";
import { stagePipelineIntelligence } from "@/lib/ai/pipeline/stage6-stage";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = getInMemoryStore();
  const meeting = store.meetings.find((m: { id: string }) => m.id === id);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(eventType: string, data: any) {
        const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      try {
        const meetingUtterances = store.utterances.filter((u: { meetingId: string }) => u.meetingId === id);
        const rawTranscript = meetingUtterances.map((u: { rawText: string }) => u.rawText).join("\n") ||
          "Okay so, um, quick recap of today's sync. We talked about the launch and honestly I think we should push the launch to December first, like the fifteenth of November is just not realistic with the QA backlog. And, you know, we also decided to ship Android and iOS together, which, yeah, I know changes what we said last time. Meera will share the final screens by Friday, no, sorry, Monday, Monday is better for her. Side note, has anyone tried the new biryani place near the office? Anyway, back to it. Rohan keeps owning the launch campaign, nothing changes there. Oh and Sana, you’ll update the test plan by next Wednesday? Arjun, you can freeze the release branch right after that.";

        // ── STAGE 1: Clean ──────────────────────────────────
        const stage1Start = Date.now();
        sendEvent("stage_start", {
          stage: 1,
          name: "Clean",
          description: "Stripping fillers, resolving self-corrections, and detecting digressions",
          timestamp: new Date().toISOString(),
        });

        sendEvent("stage_progress", {
          stage: 1,
          message: "Executing Stage 1A deterministic filler strip...",
          percent: 30,
        });

        const cleanResult = await cleanTranscriptWithAI({
          rawTranscript,
          speakerName: "Priya Nair",
          workspaceRoster: store.people,
          meetingId: id,
        });

        const stage1Duration = Date.now() - stage1Start;
        sendEvent("stage_complete", {
          stage: 1,
          name: "Clean",
          durationMs: stage1Duration,
          summary: cleanResult.summaryOfCorrections,
          digressionsCount: cleanResult.detectedDigressionsCount,
          timestamp: new Date().toISOString(),
        });

        // ── STAGE 2: Attribute ──────────────────────────────
        const stage2Start = Date.now();
        sendEvent("stage_start", {
          stage: 2,
          name: "Attribute",
          description: "Resolving speaker identities and mapping addressed teammates",
          timestamp: new Date().toISOString(),
        });

        const updatedUtterances: any[] = [];
        cleanResult.utterances.forEach((cleanUtt, index) => {
          let targetUtt = meetingUtterances[index];
          if (!targetUtt) {
            targetUtt = {
              id: `utt_${id}_${index + 1}`,
              meetingId: id,
              speakerId: cleanUtt.speakerId || store.people[0]?.id,
              speakerNameRaw: cleanUtt.speakerName,
              seq: cleanUtt.seq,
              tStart: null,
              rawText: cleanUtt.rawText,
              cleanText: cleanUtt.cleanText,
              isDigression: cleanUtt.isDigression,
              corrections: cleanUtt.corrections,
              addressedPersonIds: cleanUtt.addressedPersonIds || [],
              createdAt: new Date(),
            };
            store.utterances.push(targetUtt);
          } else {
            targetUtt.cleanText = cleanUtt.cleanText;
            targetUtt.isDigression = cleanUtt.isDigression;
            targetUtt.corrections = cleanUtt.corrections;
            targetUtt.speakerNameRaw = cleanUtt.speakerName;
            targetUtt.addressedPersonIds = cleanUtt.addressedPersonIds || [];
          }
          updatedUtterances.push(targetUtt);
        });

        const stage2Duration = Date.now() - stage2Start;
        sendEvent("stage_complete", {
          stage: 2,
          name: "Attribute",
          durationMs: stage2Duration,
          attributedTurns: updatedUtterances.length,
          timestamp: new Date().toISOString(),
        });

        // ── STAGE 3: Extract ────────────────────────────────
        const stage3Start = Date.now();
        sendEvent("stage_start", {
          stage: 3,
          name: "Extract",
          description: "Schema-bound extraction of proposals, actions, and questions (ignoring digressions)",
          timestamp: new Date().toISOString(),
        });

        const extracted = await extractMeetingIntelligence({
          utterances: updatedUtterances,
          meetingTitle: meeting?.title,
        });

        const stage3Duration = Date.now() - stage3Start;
        sendEvent("stage_complete", {
          stage: 3,
          name: "Extract",
          durationMs: stage3Duration,
          decisionsCount: extracted.decisions.length,
          actionItemsCount: extracted.actionItems.length,
          timestamp: new Date().toISOString(),
        });

        // ── STAGE 4: Resolve ────────────────────────────────
        const stage4Start = Date.now();
        sendEvent("stage_start", {
          stage: 4,
          name: "Resolve",
          description: "Anchoring relative dates to 31 Oct 2026, fuzzy matching roster, linking updates",
          timestamp: new Date().toISOString(),
        });

        const resolved = await resolveIntelligence({
          decisions: extracted.decisions,
          actionItems: extracted.actionItems,
          options: {
            meetingDate: meeting?.meetingDate || "2026-10-31",
            projectId: meeting?.projectId || SEED_IDS.PROJECT_MOBILE_V2,
          },
        });

        const stage4Duration = Date.now() - stage4Start;
        sendEvent("stage_complete", {
          stage: 4,
          name: "Resolve",
          durationMs: stage4Duration,
          resolvedDecisions: resolved.decisions.length,
          resolvedActions: resolved.actionItems.length,
          needsInputCount: resolved.actionItems.filter((a) => a.needsInput).length,
          timestamp: new Date().toISOString(),
        });

        // ── STAGE 5: Remember & Compare ─────────────────────
        const stage5Start = Date.now();
        sendEvent("stage_start", {
          stage: 5,
          name: "Remember & Compare",
          description: "Hybrid conflict engine querying Northstar Labs memory for contradictions",
          timestamp: new Date().toISOString(),
        });

        const conflictReport = await detectCrossMeetingConflicts({
          newDecisions: resolved.decisions,
          options: {
            projectId: meeting?.projectId || SEED_IDS.PROJECT_MOBILE_V2,
          },
        });

        const stage5Duration = Date.now() - stage5Start;
        sendEvent("stage_complete", {
          stage: 5,
          name: "Remember & Compare",
          durationMs: stage5Duration,
          conflictsCount: conflictReport.conflicts.length,
          reaffirmationsCount: conflictReport.reaffirmations.length,
          timestamp: new Date().toISOString(),
        });

        // ── STAGE 6: Stage ──────────────────────────────────
        const stage6Start = Date.now();
        sendEvent("stage_start", {
          stage: 6,
          name: "Stage",
          description: "Persisting proposals to store and generating executive summary",
          timestamp: new Date().toISOString(),
        });

        const stagingResult = await stagePipelineIntelligence({
          meetingId: id,
          decisions: resolved.decisions,
          actionItems: resolved.actionItems,
          conflicts: conflictReport.conflicts,
          reaffirmationsCount: conflictReport.reaffirmations.length,
        });

        // Emit individual progressive staging events
        for (const dec of stagingResult.decisions) {
          sendEvent("item_staged", {
            kind: "decision",
            item: dec,
          });
        }

        for (const act of stagingResult.actionItems) {
          sendEvent("item_staged", {
            kind: "action",
            item: act,
          });
        }

        for (const conf of stagingResult.conflicts) {
          sendEvent("item_staged", {
            kind: "conflict",
            item: conf,
          });
        }

        const stage6Duration = Date.now() - stage6Start;
        sendEvent("stage_complete", {
          stage: 6,
          name: "Stage",
          durationMs: stage6Duration,
          stagedTotal: stagingResult.decisions.length + stagingResult.actionItems.length + stagingResult.conflicts.length,
          timestamp: new Date().toISOString(),
        });

        // Mark meeting in store
        if (meeting) {
          meeting.status = "needs_review";
          meeting.summary = stagingResult.summary;
        }

        // ── Pipeline Complete ───────────────────────────────
        sendEvent("pipeline_complete", {
          success: true,
          meetingId: id,
          activeStagesCompleted: [1, 2, 3, 4, 5, 6],
          totalDurationMs: stage1Duration + stage2Duration + stage3Duration + stage4Duration + stage5Duration + stage6Duration,
          utterances: updatedUtterances,
          summaryOfCorrections: cleanResult.summaryOfCorrections,
          summary: stagingResult.summary,
          executiveSummary: stagingResult.executiveSummary,
          decisions: stagingResult.decisions,
          actionItems: stagingResult.actionItems,
          conflicts: stagingResult.conflicts,
          cta: "Review 7 Proposals & 2 Conflicts →",
          ctaHref: `/meetings/${id}`,
        });
      } catch (err: any) {
        sendEvent("pipeline_error", {
          error: err?.message || "Pipeline execution failed",
          timestamp: new Date().toISOString(),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
