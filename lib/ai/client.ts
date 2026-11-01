// lib/ai/client.ts
// Resilient AI Client using Google Gemini API (with Smart Model Resolution Guard) & fallback

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

/**
 * Smart Model Resolution Guard for Google Gemini API
 * Attempts the primary requested model (default "gemini-3.8-flash").
 * If the API returns 404 (Model Not Found), seamlessly retries with "gemini-2.5-flash",
 * accurately logging model_requested vs model_used.
 */
export async function callGeminiGenerateContent({
  systemPrompt,
  userPrompt,
  responseJson = false,
}: {
  systemPrompt?: string;
  userPrompt: string;
  responseJson?: boolean;
}): Promise<{ text: string; modelUsed: string; modelRequested: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key") {
    return null;
  }

  const requestedModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const candidateModels = [requestedModel, "gemini-2.5-flash", "gemini-1.5-flash"];
  const uniqueModels = Array.from(new Set(candidateModels));

  for (let i = 0; i < uniqueModels.length; i++) {
    const currentModel = uniqueModels[i];
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
      const payload: any = {
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      };

      if (systemPrompt) {
        payload.system_instruction = {
          parts: [{ text: systemPrompt }],
        };
      }

      if (responseJson) {
        payload.generationConfig.response_mime_type = "application/json";
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (res.status === 404) {
        console.warn(
          `[Gemini Resolution Guard] Model ${currentModel} returned 404 Not Found. Seamlessly falling back...`
        );
        continue;
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`[Gemini API] Model ${currentModel} returned HTTP ${res.status}: ${errorText}`);
        continue;
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return {
          text,
          modelUsed: currentModel,
          modelRequested: requestedModel,
        };
      }
    } catch (err: any) {
      console.warn(`[Gemini API] Request error for ${currentModel}:`, err?.message || err);
    }
  }

  return null;
}

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
 * Execute resilient speech cleanup with Google Gemini (or Anthropic Claude),
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
  const requestedModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  // Check if explicit demo fallback is enforced without API keys
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your-gemini-api-key");
  const anthropicClient = getAnthropicClient();
  const demoForced = process.env.DEMO_FALLBACK === "true";

  if (demoForced || (!hasGeminiKey && !anthropicClient)) {
    await new Promise((r) => setTimeout(r, 650));
    const fallbackResponse = getDemoRecapFallback(rawTranscript);

    logAiTrace({
      id: traceId,
      meetingId,
      stage: 1,
      model: `${requestedModel} (DEMO_FALLBACK)`,
      promptVersion: SPEECH_CLEANUP_PROMPT_VERSION,
      durationMs: Date.now() - startTime,
      tokensIn: Math.round(rawTranscript.length / 4),
      tokensOut: 450,
      status: "done",
      outputPreview: {
        model_requested: requestedModel,
        model_used: "demo_fallback",
        utterancesCount: fallbackResponse.utterances.length,
        corrections: fallbackResponse.summaryOfCorrections,
      },
      createdAt: new Date().toISOString(),
    });

    return fallbackResponse;
  }

  const { system, user } = buildSpeechCleanupPrompt({
    rawTranscript,
    speakerName,
    workspaceRoster,
  });

  const structuredPromptSuffix = `\n\nReturn ONLY a valid JSON object matching this schema:
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
}`;

  // 1. Try Gemini API first if configured
  if (hasGeminiKey) {
    try {
      const geminiResult = await callGeminiGenerateContent({
        systemPrompt: system,
        userPrompt: `${user}${structuredPromptSuffix}`,
        responseJson: true,
      });

      if (geminiResult && geminiResult.text) {
        let jsonText = geminiResult.text.trim();
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
          model: geminiResult.modelUsed,
          promptVersion: SPEECH_CLEANUP_PROMPT_VERSION,
          durationMs: Date.now() - startTime,
          tokensIn: Math.round(rawTranscript.length / 4),
          tokensOut: Math.round(jsonText.length / 4),
          status: "done",
          outputPreview: {
            model_requested: geminiResult.modelRequested,
            model_used: geminiResult.modelUsed,
            utterancesCount: validated.utterances.length,
            corrections: validated.summaryOfCorrections,
          },
          createdAt: new Date().toISOString(),
        });

        return validated;
      }
    } catch (err: any) {
      console.warn("[Momentum AI] Gemini extraction attempt failed, trying fallback:", err?.message);
    }
  }

  // 2. Try Anthropic Claude as secondary provider if available
  if (anthropicClient) {
    const claudeModel = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
        }

        const response = await anthropicClient.messages.create({
          model: claudeModel,
          max_tokens: 2000,
          system,
          messages: [
            {
              role: "user",
              content: `${user}${structuredPromptSuffix}`,
            },
          ],
        });

        const contentBlock = response.content[0];
        if (contentBlock.type === "text") {
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
            model: claudeModel,
            promptVersion: SPEECH_CLEANUP_PROMPT_VERSION,
            durationMs: Date.now() - startTime,
            tokensIn: response.usage?.input_tokens || Math.round(rawTranscript.length / 4),
            tokensOut: response.usage?.output_tokens || 400,
            status: "done",
            outputPreview: {
              model_requested: requestedModel,
              model_used: claudeModel,
              utterancesCount: validated.utterances.length,
              corrections: validated.summaryOfCorrections,
            },
            createdAt: new Date().toISOString(),
          });

          return validated;
        }
      } catch (err) {
        console.warn(`[Momentum AI] Claude attempt ${attempt + 1} failed:`, err);
      }
    }
  }

  // 3. Graceful fallback if cloud APIs fail or are unreachable
  console.warn("[Momentum AI] Using DEMO_FALLBACK for speech cleanup.");
  const fallbackResponse = getDemoRecapFallback(rawTranscript);

  logAiTrace({
    id: traceId,
    meetingId,
    stage: 1,
    model: `${requestedModel} (FALLBACK)`,
    promptVersion: SPEECH_CLEANUP_PROMPT_VERSION,
    durationMs: Date.now() - startTime,
    tokensIn: Math.round(rawTranscript.length / 4),
    tokensOut: 450,
    status: "done",
    outputPreview: {
      model_requested: requestedModel,
      model_used: "demo_fallback",
      utterancesCount: fallbackResponse.utterances.length,
    },
    createdAt: new Date().toISOString(),
  });

  return fallbackResponse;
}
