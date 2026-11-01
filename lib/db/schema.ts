// lib/db/schema.ts
// Momentum — Drizzle ORM + pgvector Schema
// All timestamps stored in UTC; displayed in Asia/Kolkata (IST)

import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  uuid,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ── Custom vector column type (pgvector) ──────────────────────────────────────
import { customType } from "drizzle-orm/pg-core";

const vector = (name: string, dimensions: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType() {
      return `vector(${dimensions})`;
    },
    toDriver(value: number[]) {
      return `[${value.join(",")}]`;
    },
    fromDriver(value: string) {
      return value
        .slice(1, -1)
        .split(",")
        .map(Number);
    },
  })(name);

// ── workspaces ────────────────────────────────────────────────────────────────
export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey().$defaultFn(() => `ws_${crypto.randomUUID().slice(0, 8)}`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  // Simulated Clock — default seeded to 2026-10-31T12:43:00+05:30 (UTC: 07:13:00)
  simNow: timestamp("sim_now", { withTimezone: true })
    .notNull()
    .default(sql`'2026-10-31 07:13:00+00'`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── people ────────────────────────────────────────────────────────────────────
export const people = pgTable(
  "people",
  {
    id: text("id").primaryKey().$defaultFn(() => `person_${crypto.randomUUID().slice(0, 8)}`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    role: text("role"),
    email: text("email"),
    avatarUrl: text("avatar_url"),
    accentColor: text("accent_color").default("#FF7A1A"),
  },
  (t) => [index("people_workspace_idx").on(t.workspaceId)]
);

// ── projects ──────────────────────────────────────────────────────────────────
export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey().$defaultFn(() => `proj_${crypto.randomUUID().slice(0, 8)}`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull(), // e.g. "NOVA", "PULSE"
    description: text("description"),
  },
  (t) => [index("projects_workspace_idx").on(t.workspaceId)]
);

// ── meetings ──────────────────────────────────────────────────────────────────
export const meetings = pgTable(
  "meetings",
  {
    id: text("id").primaryKey().$defaultFn(() => `meet_${crypto.randomUUID().slice(0, 8)}`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    meetingDate: timestamp("meeting_date", { withTimezone: true }).notNull(),
    durationMin: integer("duration_min"),
    captureMode: text("capture_mode", {
      enum: ["debrief", "roundtable", "import"],
    })
      .notNull()
      .default("debrief"),
    status: text("status", {
      enum: [
        "draft",
        "processing",
        "needs_review",
        "conflict",
        "processed",
        "failed",
      ],
    })
      .notNull()
      .default("draft"),
    summary: text("summary"),
    highlights: jsonb("highlights"), // { key_decisions: string[], blockers: string[], ... }
    rawFileMeta: jsonb("raw_file_meta"), // { filename, size, mime_type }
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("meetings_workspace_idx").on(t.workspaceId),
    index("meetings_project_idx").on(t.projectId),
  ]
);

// ── utterances ────────────────────────────────────────────────────────────────
export const utterances = pgTable(
  "utterances",
  {
    id: text("id").primaryKey().$defaultFn(() => `utt_${crypto.randomUUID().slice(0, 8)}`),
    meetingId: text("meeting_id")
      .notNull()
      .references(() => meetings.id, { onDelete: "cascade" }),
    speakerId: text("speaker_id").references(() => people.id, {
      onDelete: "set null",
    }),
    speakerNameRaw: text("speaker_name_raw"),
    seq: integer("seq").notNull(), // ordering within meeting
    tStart: real("t_start"), // seconds from start of recording
    rawText: text("raw_text").notNull(),
    cleanText: text("clean_text"),
    corrections: jsonb("corrections"), // [{original, replacement, kind: "filler"|"grammar"|"clarity"}]
    isDigression: boolean("is_digression").default(false),
  },
  (t) => [
    index("utterances_meeting_idx").on(t.meetingId),
    index("utterances_speaker_idx").on(t.speakerId),
  ]
);

// ── decisions ─────────────────────────────────────────────────────────────────
export const decisions = pgTable(
  "decisions",
  {
    id: text("id").primaryKey().$defaultFn(() => `dec_${crypto.randomUUID().slice(0, 8)}`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    meetingId: text("meeting_id").references(() => meetings.id, {
      onDelete: "set null",
    }),
    // Strict Epistemic Taxonomy (Section 3)
    topic: text("topic", {
      enum: [
        "launch-date",
        "platform-scope",
        "budget",
        "ownership",
        "design",
        "qa",
        "marketing",
        "other",
      ],
    })
      .notNull()
      .default("other"),
    statement: text("statement").notNull(),
    rationale: text("rationale"),
    status: text("status", {
      enum: [
        "discussion",
        "proposed",
        "active",
        "superseded",
        "rejected",
      ],
    })
      .notNull()
      .default("proposed"),
    ownerId: text("owner_id").references(() => people.id, {
      onDelete: "set null",
    }),
    effectiveDate: timestamp("effective_date", { withTimezone: true }),
    // Self-referential FK for lineage — superseded decisions preserve history
    supersedesId: text("supersedes_id"), // FK to decisions.id (applied below)
    evidenceUtteranceIds: jsonb("evidence_utterance_ids"), // string[]
    confidence: real("confidence"), // 0.0–1.0
    embedding: vector("embedding", 1536), // pgvector — switch to 1024 for Voyage
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("decisions_workspace_idx").on(t.workspaceId),
    index("decisions_project_idx").on(t.projectId),
    index("decisions_meeting_idx").on(t.meetingId),
    index("decisions_status_idx").on(t.status),
  ]
);

// ── action_items ──────────────────────────────────────────────────────────────
export const actionItems = pgTable(
  "action_items",
  {
    id: text("id").primaryKey().$defaultFn(() => `ai_${crypto.randomUUID().slice(0, 8)}`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    meetingId: text("meeting_id").references(() => meetings.id, {
      onDelete: "set null",
    }),
    decisionId: text("decision_id").references(() => decisions.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    ownerId: text("owner_id").references(() => people.id, {
      onDelete: "set null",
    }),
    ownerNameRaw: text("owner_name_raw"),
    deadlineText: text("deadline_text"), // e.g. "by end of sprint", verbatim
    dueDate: timestamp("due_date", { withTimezone: true }),
    priority: text("priority", {
      enum: ["low", "medium", "high", "critical"],
    })
      .notNull()
      .default("medium"),
    status: text("status", {
      enum: [
        "proposed",
        "approved",
        "rejected",
        "synced",
        "in_progress",
        "completed",
        "overdue",
      ],
    })
      .notNull()
      .default("proposed"),
    needsInput: boolean("needs_input").default(false),
    needsInputReason: text("needs_input_reason"),
    suggestedFix: text("suggested_fix"),
    // Self-referential FK for updates/supersedes
    updatesActionId: text("updates_action_id"), // FK to action_items.id
    evidenceUtteranceIds: jsonb("evidence_utterance_ids"), // string[]
    confidence: real("confidence"), // 0.0–1.0
    externalRef: jsonb("external_ref"), // { provider, board_id, card_id, url }
    idempotencyKey: text("idempotency_key").notNull().unique(),
  },
  (t) => [
    index("action_items_workspace_idx").on(t.workspaceId),
    index("action_items_owner_idx").on(t.ownerId),
    index("action_items_status_idx").on(t.status),
    index("action_items_due_date_idx").on(t.dueDate),
  ]
);

// ── conflicts ─────────────────────────────────────────────────────────────────
export const conflicts = pgTable(
  "conflicts",
  {
    id: text("id").primaryKey().$defaultFn(() => `conf_${crypto.randomUUID().slice(0, 8)}`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    oldDecisionId: text("old_decision_id")
      .notNull()
      .references(() => decisions.id, { onDelete: "cascade" }),
    newDecisionId: text("new_decision_id")
      .notNull()
      .references(() => decisions.id, { onDelete: "cascade" }),
    conflictType: text("conflict_type", {
      enum: ["date", "number", "owner", "scope", "reversal"],
    }).notNull(),
    severity: text("severity", {
      enum: ["low", "medium", "high"],
    })
      .notNull()
      .default("medium"),
    status: text("status", {
      enum: [
        "open",
        "possible",
        "resolved_keep_old",
        "resolved_supersede",
        "resolved_escalated",
        "resolved_both_valid",
      ],
    })
      .notNull()
      .default("open"),
    confidence: real("confidence"),
    explanation: text("explanation").notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    oldQuote: text("old_quote"),
    newQuote: text("new_quote"),
    downstreamActionIds: jsonb("downstream_action_ids"), // string[]
    resolutionNote: text("resolution_note"),
    resolvedBy: text("resolved_by").references(() => people.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [
    index("conflicts_workspace_idx").on(t.workspaceId),
    index("conflicts_status_idx").on(t.status),
  ]
);

// ── reminders ─────────────────────────────────────────────────────────────────
export const reminders = pgTable(
  "reminders",
  {
    id: text("id").primaryKey().$defaultFn(() => `rem_${crypto.randomUUID().slice(0, 8)}`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    actionItemId: text("action_item_id")
      .notNull()
      .references(() => actionItems.id, { onDelete: "cascade" }),
    personId: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    remindAt: timestamp("remind_at", { withTimezone: true }).notNull(),
    leadType: text("lead_type", {
      enum: ["24h", "2h", "overdue"],
    }).notNull(),
    message: text("message"),
    status: text("status", {
      enum: ["pending", "fired", "snoozed", "done"],
    })
      .notNull()
      .default("pending"),
    firedAt: timestamp("fired_at", { withTimezone: true }),
  },
  (t) => [
    index("reminders_workspace_idx").on(t.workspaceId),
    index("reminders_status_idx").on(t.status),
    index("reminders_remind_at_idx").on(t.remindAt),
  ]
);

// ── digests ───────────────────────────────────────────────────────────────────
export const digests = pgTable(
  "digests",
  {
    id: text("id").primaryKey().$defaultFn(() => `dig_${crypto.randomUUID().slice(0, 8)}`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    personId: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    weekStart: timestamp("week_start", { withTimezone: true }).notNull(),
    introText: text("intro_text"),
    payload: jsonb("payload"), // { my_tasks, blockers, decisions, mentions }
    sentAt: timestamp("sent_at", { withTimezone: true }),
    channel: text("channel", {
      enum: ["in_app", "email"],
    })
      .notNull()
      .default("in_app"),
  },
  (t) => [index("digests_person_idx").on(t.personId)]
);

// ── integrations ──────────────────────────────────────────────────────────────
export const integrations = pgTable(
  "integrations",
  {
    id: text("id").primaryKey().$defaultFn(() => `int_${crypto.randomUUID().slice(0, 8)}`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    provider: text("provider", {
      enum: ["internal", "trello"],
    })
      .notNull()
      .default("internal"),
    config: jsonb("config"), // { api_key, board_id, list_id, ... }
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [
    index("integrations_workspace_idx").on(t.workspaceId),
    unique("integrations_workspace_provider").on(t.workspaceId, t.provider),
  ]
);

// ── assistant_threads ─────────────────────────────────────────────────────────
export const assistantThreads = pgTable(
  "assistant_threads",
  {
    id: text("id").primaryKey().$defaultFn(() => `thread_${crypto.randomUUID().slice(0, 8)}`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    title: text("title"),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("threads_workspace_idx").on(t.workspaceId)]
);

// ── assistant_messages ────────────────────────────────────────────────────────
export const assistantMessages = pgTable(
  "assistant_messages",
  {
    id: text("id").primaryKey().$defaultFn(() => `msg_${crypto.randomUUID().slice(0, 8)}`),
    threadId: text("thread_id")
      .notNull()
      .references(() => assistantThreads.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["user", "assistant", "tool"] }).notNull(),
    content: text("content").notNull(),
    citations: jsonb("citations"), // [{decision_id, utterance_id, quote, meeting_title}]
    toolCalls: jsonb("tool_calls"), // [{name, input, output}]
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("messages_thread_idx").on(t.threadId)]
);

// ── audit_logs ────────────────────────────────────────────────────────────────
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => `audit_${crypto.randomUUID().slice(0, 8)}`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    actorName: text("actor_name"),
    action: text("action").notNull(), // e.g. "approve_decision", "resolve_conflict"
    entityType: text("entity_type").notNull(), // e.g. "decision", "action_item"
    entityId: text("entity_id").notNull(),
    beforeState: jsonb("before_state"),
    afterState: jsonb("after_state"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_workspace_idx").on(t.workspaceId),
    index("audit_entity_idx").on(t.entityType, t.entityId),
  ]
);

// ── ai_traces ─────────────────────────────────────────────────────────────────
export const aiTraces = pgTable(
  "ai_traces",
  {
    id: text("id").primaryKey().$defaultFn(() => `trace_${crypto.randomUUID().slice(0, 8)}`),
    meetingId: text("meeting_id").references(() => meetings.id, {
      onDelete: "cascade",
    }),
    stage: integer("stage").notNull(), // 1–6
    model: text("model"),
    promptVersion: text("prompt_version"),
    durationMs: integer("duration_ms"),
    tokensIn: integer("tokens_in"),
    tokensOut: integer("tokens_out"),
    status: text("status", {
      enum: ["running", "done", "error"],
    })
      .notNull()
      .default("running"),
    outputPreview: jsonb("output_preview"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("traces_meeting_idx").on(t.meetingId),
    index("traces_stage_idx").on(t.stage),
  ]
);

// ── Type exports ──────────────────────────────────────────────────────────────
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;
export type Utterance = typeof utterances.$inferSelect;
export type NewUtterance = typeof utterances.$inferInsert;
export type Decision = typeof decisions.$inferSelect;
export type NewDecision = typeof decisions.$inferInsert;
export type ActionItem = typeof actionItems.$inferSelect;
export type NewActionItem = typeof actionItems.$inferInsert;
export type Conflict = typeof conflicts.$inferSelect;
export type NewConflict = typeof conflicts.$inferInsert;
export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
export type Digest = typeof digests.$inferSelect;
export type NewDigest = typeof digests.$inferInsert;
export type Integration = typeof integrations.$inferSelect;
export type AssistantThread = typeof assistantThreads.$inferSelect;
export type AssistantMessage = typeof assistantMessages.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type AiTrace = typeof aiTraces.$inferSelect;

