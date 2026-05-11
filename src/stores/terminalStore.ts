import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TerminalInstance {
  id: string;
  title: string;
  shell: string;
  workingDir: string;
  isActive: boolean;
  cols: number;
  rows: number;
}

export interface TerminalState {
  terminals: TerminalInstance[];
  activeTerminalId: string | null;

  // Actions
  addTerminal: (terminal: Omit<TerminalInstance, 'isActive'>) => void;
  removeTerminal: (id: string) => void;
  setActiveTerminal: (id: string) => void;
  updateTerminalSize: (id: string, cols: number, rows: number) => void;
  updateTerminalTitle: (id: string, title: string) => void;
  reorderTerminals: (fromIndex: number, toIndex: number) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useTerminalStore = create<TerminalState>((set) => ({
  terminals: [],
  activeTerminalId: null,

  addTerminal: (terminal) =>
    set((state) => ({
      terminals: [
        ...state.terminals.map((t) => ({ ...t, isActive: false })),
        { ...terminal, isActive: true },
      ],
      activeTerminalId: terminal.id,
    })),

  removeTerminal: (id) =>
    set((state) => {
      const filtered = state.terminals.filter((t) => t.id !== id);
      const newActiveId =
        state.activeTerminalId === id
          ? filtered.length > 0
            ? filtered[filtered.length - 1].id
            : null
          : state.activeTerminalId;

      return {
        terminals: filtered.map((t, i) => ({
          ...t,
          isActive: t.id === newActiveId,
        })),
        activeTerminalId: newActiveId,
      };
    }),

  setActiveTerminal: (id) =>
    set((state) => ({
      terminals: state.terminals.map((t) => ({
        ...t,
        isActive: t.id === id,
      })),
      activeTerminalId: id,
    })),

  updateTerminalSize: (id, cols, rows) =>
    set((state) => ({
      terminals: state.terminals.map((t) =>
        t.id === id ? { ...t, cols, rows } : t
      ),
    })),

  updateTerminalTitle: (id, title) =>
    set((state) => ({
      terminals: state.terminals.map((t) =>
        t.id === id ? { ...t, title } : t
      ),
    })),

  reorderTerminals: (fromIndex, toIndex) =>
    set((state) => {
      const newTerminals = [...state.terminals];
      const [moved] = newTerminals.splice(fromIndex, 1);
      newTerminals.splice(toIndex, 0, moved);
      return { terminals: newTerminals };
    }),
}));