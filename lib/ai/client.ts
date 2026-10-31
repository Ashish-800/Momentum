// lib/ai/client.ts
// Resilient AI Client using Anthropic SDK with retries, Zod validation, and DEMO_FALLBACK

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getDemoRecapFallback } from "./demo-fallback";
import { SpeechCleanupResponse, SpeechCleanupResponseSchema } from "./schemas";
import { buildSpeechCleanupPrompt, SPEECH_CLEANUP_PROMPT_VERSION } from "./prompts/speech-cleanup";

// Global trace storage in-memory for live UI inspection
export interface TraceLog {
  id: string;
  meetingId?: string;
  stage: number;
  model: string;
  promptVersion: string;
  durationMs: number;
  tokensIn: number;
  tokensOut: number;
  status: "running" | "done" | "error";
  outputPreview?: any;
  createdAt: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __ai_traces: TraceLog[] | undefined;
}

if (!global.__ai_traces) {
  global.__ai_traces = [];
}

export function getAiTraces(): TraceLog[] {
  return global.__ai_traces || [];
}

export function logAiTrace(trace: TraceLog) {
  if (!global.__ai_traces) global.__ai_traces = [];
  global.__ai_traces.unshift(trace);
}

const TIMEOUT_MS = 20000;
const MAX_RETRIES = 2;

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-anthropic-api-key-here" || apiKey.startsWith("sk-ant-api03-...")) {
    return null;
  }
  return new Anthropic({
    apiKey,
    timeout: TIMEOUT_MS,
  });
}

/**
 * Execute resilient speech cleanup with Anthropic Claude 3.5 Sonnet,
 * falling back smoothly to deterministic DEMO_FALLBACK if keys are unset or network fails.
 */
export async function cleanTranscriptWithAI({
  rawTranscript,
  speakerName = "Priya Nair",
  workspaceRoster = [],
  meetingId,
}: {
  rawTranscript: string;
  speakerName?: string;
  workspaceRoster?: Array<{ id: string; name: string; role?: string }>;
  meetingId?: string;
}): Promise<SpeechCleanupResponse> {
  const startTime = Date.now();
  const traceId = `trace_${Math.random().toString(36).slice(2, 9)}`;
  const modelName = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";

  // Check if we should use fallback directly
  const client = getAnthropicClient();
  const demoMode = process.env.DEMO_FALLBACK === "true" || !client;

  if (demoMode || !client) {
    // Simulate brief realistic processing delay for UI feel
    await new Promise((r) => setTimeout(r, 650));
    const fallbackResponse = getDemoRecapFallback(rawTranscript);

    logAiTrace({
      id: traceId,
      meetingId,
      stage: 1,
      model: `${modelName} (DEMO_FALLBACK)`,
      promptVersion: SPEECH_CLEANUP_PROMPT_VERSION,
      durationMs: Date.now() - startTime,
      tokensIn: Math.round(rawTranscript.length / 4),
      tokensOut: 450,
      status: "done",
      outputPreview: {
        utterancesCount: fallbackResponse.utterances.length,
        corrections: fallbackResponse.summaryOfCorrections,
      },
      createdAt: new Date().toISOString(),
    });

    return fallbackResponse;
  }

  // Attempt real Anthropic API call with retries
  const { system, user } = buildSpeechCleanupPrompt({
    rawTranscript,
    speakerName,
    workspaceRoster,
  });

  let lastError: any = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
      }

      const response = await client.messages.create({
        model: modelName,
        max_tokens: 2000,
        system,
        messages: [
          {
            role: "user",
            content: `${user}\n\nReturn ONLY a valid JSON object matching this structure:
{
  "summaryOfCorrections": "...",
  "detectedDigressionsCount": 0,
  "utterances": [
    {
      "seq": 1,
      "speakerId": "...",
      "speakerName": "...",
      "rawText": "...",
      "cleanText": "...",
      "isDigression": false,
      "corrections": [{ "original": "...", "replacement": "...", "kind": "self-correction" }],
      "addressedPersonIds": []
    }
  ]
}`,
          },
        ],
      });

      const contentBlock = response.content[0];
      if (contentBlock.type !== "text") {
        throw new Error("Expected text response block from Anthropic");
      }

      // Parse JSON from model output
      let jsonText = contentBlock.text.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```/, "").replace(/```$/, "").trim();
      }

      const parsed = JSON.parse(jsonText);
      const validated = SpeechCleanupResponseSchema.parse(parsed);

      logAiTrace({
        id: traceId,
        meetingId,
        stage: 1,
        model: modelName,
        promptVersion: SPEECH_CLEANUP_PROMPT_VERSION,
        durationMs: Date.now() - startTime,
        tokensIn: response.usage?.input_tokens || Math.round(rawTranscript.length / 4),
        tokensOut: response.usage?.output_tokens || 400,
        status: "done",
        outputPreview: {
          utterancesCount: validated.utterances.length,
          corrections: validated.summaryOfCorrections,
        },
        createdAt: new Date().toISOString(),
      });

      return validated;
    } catch (err) {
      lastError = err;
      console.warn(`[Closeloop AI] Attempt ${attempt + 1} failed:`, err);
    }
  }

  // Graceful fallback if Anthropic API fails after retries
  console.warn("[Closeloop AI] Reverting to DEMO_FALLBACK after API retries exhausted.");
  const fallbackResponse = getDemoRecapFallback(rawTranscript);

  logAiTrace({
    id: traceId,
    meetingId,
    stage: 1,
    model: `${modelName} (FALLBACK_AFTER_ERROR)`,
    promptVersion: SPEECH_CLEANUP_PROMPT_VERSION,
    durationMs: Date.now() - startTime,
    tokensIn: Math.round(rawTranscript.length / 4),
    tokensOut: 450,
    status: "done",
    outputPreview: {
      error: String(lastError?.message || "Unknown error"),
      utterancesCount: fallbackResponse.utterances.length,
    },
    createdAt: new Date().toISOString(),
  });

  return fallbackResponse;
}
