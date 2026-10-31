// lib/integrations/index.ts
// Integration Dispatcher
// Selects appropriate adapter based on requested provider and active configurations.

import { TaskAdapter } from "./types";
import { InternalBoardAdapter } from "./internal";
import { TrelloAdapter } from "./trello";

export * from "./types";
export * from "./internal";
export * from "./trello";

const internalAdapter = new InternalBoardAdapter();
const trelloAdapter = new TrelloAdapter();

export function getTaskAdapter(provider?: string): TaskAdapter {
  if (provider === "trello" && trelloAdapter.isConfigured()) {
    return trelloAdapter;
  }
  if (provider === "trello") {
    // Return trello adapter so it can report honest non-configured status or fallback
    return trelloAdapter;
  }
  return internalAdapter;
}

