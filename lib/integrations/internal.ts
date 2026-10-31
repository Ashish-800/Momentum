// lib/integrations/internal.ts
// Closeloop Internal Board Adapter
// Built-in Postgres/in-memory task board allowing 100% standalone operation without external credentials.

import {
  CreateTaskParams,
  ExternalRef,
  TaskAdapter,
  TaskResult,
  UpdateTaskParams,
} from "./types";
import { getInMemoryStore } from "@/lib/db/seed";

export class InternalBoardAdapter implements TaskAdapter {
  readonly name = "Closeloop Internal Board";
  readonly provider = "internal" as const;

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    return {
      ok: true,
      message: "Internal Board connected and ready (built-in storage).",
    };
  }

  async createTask(params: CreateTaskParams): Promise<TaskResult> {
    const store = getInMemoryStore();
    if (!store.internalTasks) store.internalTasks = [];

    // Idempotency check: if card with idempotencyKey already exists, return existing card
    const existing = store.internalTasks.find(
      (t: any) => t.idempotencyKey === params.idempotencyKey
    );
    if (existing) {
      return {
        success: true,
        externalRef: existing.externalRef,
        message: "Task already created (idempotent lookup).",
        raw: existing,
      };
    }

    const cardId = `card_int_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const externalRef: ExternalRef = {
      provider: "internal",
      board_id: "board_mobile_v2",
      card_id: cardId,
      url: `/ledger#${cardId}`,
    };

    const taskRecord = {
      id: cardId,
      idempotencyKey: params.idempotencyKey,
      title: params.title,
      description: params.description,
      dueDate: params.dueDate,
      priority: params.priority || "medium",
      ownerName: params.ownerName,
      meetingTitle: params.meetingTitle,
      decisionStatement: params.decisionStatement,
      verbatimQuote: params.verbatimQuote,
      closeloopMeetingUrl: params.closeloopMeetingUrl,
      externalRef,
      createdAt: new Date(),
      status: "todo",
    };

    store.internalTasks.push(taskRecord);

    return {
      success: true,
      externalRef,
      message: "Synced to Closeloop Internal Board.",
      raw: taskRecord,
    };
  }

  async updateTask(
    externalRef: ExternalRef,
    params: UpdateTaskParams
  ): Promise<TaskResult> {
    const store = getInMemoryStore();
    if (!store.internalTasks) store.internalTasks = [];

    const idx = store.internalTasks.findIndex(
      (t: any) => t.externalRef?.card_id === externalRef.card_id
    );

    if (idx >= 0) {
      store.internalTasks[idx] = {
        ...store.internalTasks[idx],
        ...params,
        updatedAt: new Date(),
      };
      return {
        success: true,
        externalRef,
        message: "Internal card updated.",
        raw: store.internalTasks[idx],
      };
    }

    return {
      success: false,
      externalRef,
      message: `Card ${externalRef.card_id} not found on Internal Board.`,
    };
  }

  async getTask(externalRef: ExternalRef): Promise<TaskResult | null> {
    const store = getInMemoryStore();
    if (!store.internalTasks) return null;

    const task = store.internalTasks.find(
      (t: any) => t.externalRef?.card_id === externalRef.card_id
    );

    if (!task) return null;

    return {
      success: true,
      externalRef,
      raw: task,
    };
  }
}

