import { create } from 'zustand';

export interface SyncPlayUser {
  Name: string;
  Id: string;
  IsActive?: boolean;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface SyncPlayCommandData {
  Command: 'Play' | 'Pause' | 'Seek' | 'Unpause' | 'Stop' | 'NextItem' | 'PreviousItem';
  PositionTicks?: number;
  EmittedAt?: string;
  ItemId?: string;
}

interface SyncPlayState {
  groupId: string | null;
  users: SyncPlayUser[];
  chatMessages: ChatMessage[];
  pendingCommand: SyncPlayCommandData | null;
  
  setGroupId: (id: string | null) => void;
  setUsers: (users: SyncPlayUser[]) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  receiveCommand: (cmd: SyncPlayCommandData) => void;
  clearPendingCommand: () => void;
  reset: () => void;
}

export const useSyncPlayStore = create<SyncPlayState>((set) => ({
  groupId: null,
  users: [],
  chatMessages: [],
  pendingCommand: null,

  setGroupId: (id) => set({ groupId: id }),
  setUsers: (users) => set({ users }),
  
  addChatMessage: (msg) => set((state) => ({
    chatMessages: [
      ...state.chatMessages,
      {
        ...msg,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
      }
    ].slice(-50) // 保留最近 50 条
  })),

  receiveCommand: (cmd) => set({ pendingCommand: cmd }),
  
  clearPendingCommand: () => set({ pendingCommand: null }),
  
  reset: () => set({ groupId: null, users: [], chatMessages: [], pendingCommand: null }),
}));
