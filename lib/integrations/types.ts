// lib/integrations/types.ts
// Pluggable Task Tracker Adapter Interface
// Enforces idempotency keys, external references, and uniform error contracts.

export interface ExternalRef {
  provider: "internal" | "trello";
  board_id?: string;
  list_id?: string;
  card_id: string;
  url: string;
}

export interface CreateTaskParams {
  idempotencyKey: string;
  title: string;
  description?: string;
  dueDate?: Date | null;
  priority?: "low" | "medium" | "high" | "critical";
  ownerName?: string;
  ownerEmail?: string;
  meetingTitle?: string;
  meetingDate?: Date | string;
  decisionStatement?: string;
  verbatimQuote?: string;
  closeloopMeetingUrl?: string;
}

export interface UpdateTaskParams {
  idempotencyKey: string;
  title?: string;
  description?: string;
  dueDate?: Date | null;
  priority?: "low" | "medium" | "high" | "critical";
  status?: string;
}

export interface TaskResult {
  success: boolean;
  externalRef: ExternalRef;
  message?: string;
  raw?: any;
}

export interface TaskAdapter {
  readonly name: string;
  readonly provider: "internal" | "trello";

  createTask(params: CreateTaskParams): Promise<TaskResult>;
  updateTask(externalRef: ExternalRef, params: UpdateTaskParams): Promise<TaskResult>;
  getTask(externalRef: ExternalRef): Promise<TaskResult | null>;
  testConnection(): Promise<{ ok: boolean; message: string }>;
}

