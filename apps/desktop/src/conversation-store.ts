import {
  recoverInterruptedConversation,
  type Conversation
} from "@local-agent/shared";

export type StoredConversationState = {
  currentConversationId?: string;
  conversations: Conversation[];
};

export type ConversationStore = {
  load(): StoredConversationState;
  save(state: StoredConversationState): void;
};

const defaultStorageKey = "agent-studio:conversations";

export function createLocalConversationStore(
  storageKey = defaultStorageKey
): ConversationStore {
  return {
    load(): StoredConversationState {
      const rawValue = localStorage.getItem(storageKey);

      if (!rawValue) {
        return { conversations: [] };
      }

      try {
        const parsed = JSON.parse(rawValue) as StoredConversationState;

        return {
          currentConversationId: parsed.currentConversationId,
          conversations: parsed.conversations.map(recoverInterruptedConversation)
        };
      } catch {
        return { conversations: [] };
      }
    },
    save(state: StoredConversationState): void {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  };
}
