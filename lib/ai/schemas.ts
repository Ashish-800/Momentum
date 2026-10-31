// lib/ai/schemas.ts
// Closeloop AI Pipeline — Complete Schemas (Stages 1–6 & RAG Assistant)

import { z } from "zod";

// ── Stage 1 & 2: Speech Cleanup ─────────────────────────────
export const CorrectionKindSchema = z.enum(["self-correction", "filler", "digression"]);

export const UtteranceCorrectionSchema = z.object({
  original: z.string(),
  replacement: z.string(),
  kind: CorrectionKindSchema,
  rationale: z.string().optional(),
});

export const CleanUtteranceSchema = z.object({
  id: z.string().optional(),
  seq: z.number(),
  speakerId: z.string().nullable().optional(),
  speakerName: z.string(),
  rawText: z.string(),
  cleanText: z.string(),
  isDigression: z.boolean(),
  corrections: z.array(UtteranceCorrectionSchema),
  addressedPersonIds: z.array(z.string()).optional(),
});

export const SpeechCleanupResponseSchema = z.object({
  utterances: z.array(CleanUtteranceSchema),
  summaryOfCorrections: z.string().optional(),
  detectedDigressionsCount: z.number().default(0),
});

// ── Stage 3: Extraction Schemas ─────────────────────────────
export const DecisionTopicSchema = z.enum([
  "launch-date",
  "platform-scope",
  "budget",
  "ownership",
  "design",
  "qa",
  "marketing",
  "other",
]);

export const EpistemicStatusSchema = z.enum([
  "discussion",
  "proposed",
  "active",
  "superseded",
  "rejected",
]);

export const ExtractedDecisionSchema = z.object({
  tempId: z.string(),
  topic: DecisionTopicSchema,
  statement: z.string().max(160),
  rationale: z.string().optional(),
  status: EpistemicStatusSchema.default("proposed"),
  ownerName: z.string().optional(),
  ownerId: z.string().nullable().optional(),
  effectiveDateText: z.string().optional(),
  evidenceUtteranceIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  isReaffirmation: z.boolean().default(false),
  reaffirmsDecisionId: z.string().nullable().optional(),
});

export const ExtractedActionItemSchema = z.object({
  tempId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  ownerNameRaw: z.string().optional(),
  ownerId: z.string().nullable().optional(),
  deadlineText: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  evidenceUtteranceIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  dependsOnTaskId: z.string().nullable().optional(),
});

export const ExtractionResponseSchema = z.object({
  decisions: z.array(ExtractedDecisionSchema),
  actionItems: z.array(ExtractedActionItemSchema),
  discussionsSummary: z.string().optional(),
  risksAndBlockers: z.array(z.string()).default([]),
  openQuestions: z.array(z.string()).default([]),
});

// ── Stage 4: Resolution Schemas ─────────────────────────────
export const ResolvedActionItemSchema = ExtractedActionItemSchema.extend({
  id: z.string(),
  resolvedDueDate: z.string().nullable().optional(), // ISO string YYYY-MM-DD
  needsInput: z.boolean().default(false),
  needsInputReason: z.string().nullable().optional(),
  suggestedFix: z.string().nullable().optional(),
  updatesActionId: z.string().nullable().optional(),
  isTaskUpdate: z.boolean().default(false),
});

export const ResolvedDecisionSchema = ExtractedDecisionSchema.extend({
  id: z.string(),
  resolvedEffectiveDate: z.string().nullable().optional(), // ISO string
});

export const ResolutionResponseSchema = z.object({
  decisions: z.array(ResolvedDecisionSchema),
  actionItems: z.array(ResolvedActionItemSchema),
});

// ── Stage 5: Conflict Engine Schemas ────────────────────────
export const ConflictRelationSchema = z.enum([
  "consistent",
  "reaffirms",
  "supersedes",
  "contradicts",
  "unrelated",
]);

export const ConflictTypeSchema = z.enum(["date", "number", "owner", "scope", "reversal"]);

export const ConflictItemSchema = z.object({
  id: z.string(),
  oldDecisionId: z.string(),
  newDecisionId: z.string(),
  relation: ConflictRelationSchema,
  conflictType: ConflictTypeSchema,
  severity: z.enum(["low", "medium", "high"]),
  status: z.enum(["open", "possible", "resolved_keep_old", "resolved_supersede"]).default("open"),
  confidence: z.number().min(0).max(1),
  explanation: z.string(),
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
  oldQuote: z.string().optional(),
  newQuote: z.string().optional(),
  downstreamActionIds: z.array(z.string()).default([]),
});

export const ConflictEngineResponseSchema = z.object({
  conflicts: z.array(ConflictItemSchema),
  reaffirmations: z.array(
    z.object({
      newDecisionId: z.string(),
      reaffirmedDecisionId: z.string(),
      statement: z.string(),
      explanation: z.string(),
    })
  ).default([]),
});

// ── Stage 6: Final Staging Schema ───────────────────────────
export const PipelineStagingResponseSchema = z.object({
  meetingId: z.string(),
  summary: z.string(),
  executiveSummary: z.string(),
  decisions: z.array(ResolvedDecisionSchema),
  actionItems: z.array(ResolvedActionItemSchema),
  conflicts: z.array(ConflictItemSchema),
  reaffirmationsCount: z.number().default(0),
});

// ── Types ───────────────────────────────────────────────────
export type CorrectionKind = z.infer<typeof CorrectionKindSchema>;
export type UtteranceCorrection = z.infer<typeof UtteranceCorrectionSchema>;
export type CleanUtterance = z.infer<typeof CleanUtteranceSchema>;
export type SpeechCleanupResponse = z.infer<typeof SpeechCleanupResponseSchema>;

export type DecisionTopic = z.infer<typeof DecisionTopicSchema>;
export type ExtractedDecision = z.infer<typeof ExtractedDecisionSchema>;
export type ExtractedActionItem = z.infer<typeof ExtractedActionItemSchema>;
export type ExtractionResponse = z.infer<typeof ExtractionResponseSchema>;

export type ResolvedDecision = z.infer<typeof ResolvedDecisionSchema>;
export type ResolvedActionItem = z.infer<typeof ResolvedActionItemSchema>;
export type ResolutionResponse = z.infer<typeof ResolutionResponseSchema>;

export type ConflictItem = z.infer<typeof ConflictItemSchema>;
export type ConflictEngineResponse = z.infer<typeof ConflictEngineResponseSchema>;

export type PipelineStagingResponse = z.infer<typeof PipelineStagingResponseSchema>;
