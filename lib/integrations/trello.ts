// lib/integrations/trello.ts
// Trello REST API Adapter
// Formats rich markdown descriptions with parent decision context, evidence quotes, and deep links.
// Gracefully handles missing credentials without pretending success.

import {
  CreateTaskParams,
  ExternalRef,
  TaskAdapter,
  TaskResult,
  UpdateTaskParams,
} from "./types";
import { InternalBoardAdapter } from "./internal";

export class TrelloAdapter implements TaskAdapter {
  readonly name = "Trello";
  readonly provider = "trello" as const;
  private internalFallback = new InternalBoardAdapter();

  private getCredentials() {
    return {
      key: process.env.TRELLO_KEY || "",
      token: process.env.TRELLO_TOKEN || "",
      boardId: process.env.TRELLO_BOARD_ID || "",
      listId: process.env.TRELLO_LIST_ID || "",
    };
  }

  isConfigured(): boolean {
    const creds = this.getCredentials();
    return Boolean(creds.key && creds.token && (creds.listId || creds.boardId));
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    const creds = this.getCredentials();
    if (!this.isConfigured()) {
      return {
        ok: false,
        message: "Trello credentials not configured. Please set TRELLO_KEY, TRELLO_TOKEN, and TRELLO_BOARD_ID.",
      };
    }

    try {
      const res = await fetch(
        `https://api.trello.com/1/members/me?key=${creds.key}&token=${creds.token}`
      );
      if (!res.ok) {
        return { ok: false, message: `Trello authentication failed: ${res.statusText}` };
      }
      const data = await res.json();
      return { ok: true, message: `Connected to Trello account: ${data.username || data.fullName}` };
    } catch (err: any) {
      return { ok: false, message: `Trello connection error: ${err.message}` };
    }
  }

  private formatDescription(params: CreateTaskParams): string {
    const lines: string[] = [];

    if (params.description) {
      lines.push(params.description);
      lines.push("");
    }

    lines.push("---");
    lines.push("### 🏛️ Momentum Institutional Memory");

    if (params.decisionStatement) {
      lines.push(`**Parent Decision:** ${params.decisionStatement}`);
    }

    if (params.meetingTitle) {
      const dateStr = params.meetingDate ? ` (${String(params.meetingDate).slice(0, 10)})` : "";
      lines.push(`**Source Meeting:** ${params.meetingTitle}${dateStr}`);
    }

    if (params.verbatimQuote) {
      lines.push(`> *"${params.verbatimQuote}"*`);
    }

    if (params.ownerName) {
      lines.push(`**Assignee:** ${params.ownerName}`);
    }

    if (params.priority) {
      lines.push(`**Priority:** \`${params.priority.toUpperCase()}\``);
    }

    if (params.closeloopMeetingUrl) {
      lines.push("");
      lines.push(`🔗 [View Verbatim Meeting in Momentum](${params.closeloopMeetingUrl})`);
    }

    lines.push(`*Idempotency Key: ${params.idempotencyKey}*`);

    return lines.join("\n");
  }

  async createTask(params: CreateTaskParams): Promise<TaskResult> {
    const creds = this.getCredentials();

    // If not configured, transparently fall back to InternalBoardAdapter
    // and provide clear human-facing guidance.
    if (!this.isConfigured()) {
      const fallbackResult = await this.internalFallback.createTask(params);
      return {
        ...fallbackResult,
        message: "Synced to Momentum Internal Board (Trello not connected in /settings).",
      };
    }

    try {
      // 1. Resolve list ID (if listId is missing but boardId is provided, fetch first list)
      let listId = creds.listId;
      if (!listId && creds.boardId) {
        const listsRes = await fetch(
          `https://api.trello.com/1/boards/${creds.boardId}/lists?key=${creds.key}&token=${creds.token}`
        );
        if (listsRes.ok) {
          const lists = await listsRes.json();
          if (lists.length > 0) listId = lists[0].id;
        }
      }

      if (!listId) {
        const fallback = await this.internalFallback.createTask(params);
        return {
          ...fallback,
          message: "Synced to Momentum Internal Board (no accessible list on configured Trello board).",
        };
      }

      // 2. Format description & body
      const desc = this.formatDescription(params);
      const url = new URL("https://api.trello.com/1/cards");
      url.searchParams.set("key", creds.key);
      url.searchParams.set("token", creds.token);
      url.searchParams.set("idList", listId);
      url.searchParams.set("name", params.title);
      url.searchParams.set("desc", desc);

      if (params.dueDate) {
        url.searchParams.set("due", params.dueDate.toISOString());
      }

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Trello API error: ${res.status} ${res.statusText}`);
      }

      const card = await res.json();
      const externalRef: ExternalRef = {
        provider: "trello",
        board_id: card.idBoard,
        list_id: card.idList,
        card_id: card.id,
        url: card.shortUrl || card.url,
      };

      return {
        success: true,
        externalRef,
        message: `Synced to Trello card: ${card.name}`,
        raw: card,
      };
    } catch (err: any) {
      console.warn("[TrelloAdapter] Fallback to internal board due to error:", err.message);
      const fallback = await this.internalFallback.createTask(params);
      return {
        ...fallback,
        message: `Synced to Momentum Internal Board (Trello error: ${err.message}).`,
      };
    }
  }

  async updateTask(
    externalRef: ExternalRef,
    params: UpdateTaskParams
  ): Promise<TaskResult> {
    if (externalRef.provider !== "trello" || !this.isConfigured()) {
      return this.internalFallback.updateTask(externalRef, params);
    }

    const creds = this.getCredentials();

    try {
      const url = new URL(`https://api.trello.com/1/cards/${externalRef.card_id}`);
      url.searchParams.set("key", creds.key);
      url.searchParams.set("token", creds.token);

      if (params.title) url.searchParams.set("name", params.title);
      if (params.description) url.searchParams.set("desc", params.description);
      if (params.dueDate) url.searchParams.set("due", params.dueDate.toISOString());

      const res = await fetch(url.toString(), {
        method: "PUT",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Trello update error: ${res.status} ${res.statusText}`);
      }

      const card = await res.json();
      return {
        success: true,
        externalRef,
        message: `Updated Trello card: ${card.name}`,
        raw: card,
      };
    } catch (err: any) {
      return this.internalFallback.updateTask(externalRef, params);
    }
  }

  async getTask(externalRef: ExternalRef): Promise<TaskResult | null> {
    if (externalRef.provider !== "trello" || !this.isConfigured()) {
      return this.internalFallback.getTask(externalRef);
    }

    const creds = this.getCredentials();

    try {
      const res = await fetch(
        `https://api.trello.com/1/cards/${externalRef.card_id}?key=${creds.key}&token=${creds.token}`
      );
      if (!res.ok) return null;
      const card = await res.json();
      return {
        success: true,
        externalRef,
        raw: card,
      };
    } catch {
      return this.internalFallback.getTask(externalRef);
    }
  }
}

