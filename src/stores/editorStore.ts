import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OpenFile {
  path: string;
  name: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
  language: string;
}

export interface EditorState {
  openFiles: OpenFile[];
  activeFilePath: string | null;
  fontSize: number;
  wordWrap: boolean;
  minimap: boolean;

  // Actions
  openFile: (file: Omit<OpenFile, 'isDirty' | 'originalContent'>) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  saveFile: (path: string) => void;
  setFontSize: (size: number) => void;
  toggleWordWrap: () => void;
  toggleMinimap: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getLanguageFromExtension = (ext: string | null): string => {
  if (!ext) return 'plaintext';
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    xml: 'xml',
    md: 'markdown',
    sql: 'sql',
    sh: 'shell',
    bat: 'bat',
    ps1: 'powershell',
    dockerfile: 'dockerfile',
    gitignore: 'plaintext',
  };
  return map[ext.toLowerCase()] || 'plaintext';
};

// ─── Store ───────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorState>((set, get) => ({
  openFiles: [],
  activeFilePath: null,
  fontSize: 14,
  wordWrap: true,
  minimap: false,

  openFile: (file) =>
    set((state) => {
      const existing = state.openFiles.find((f) => f.path === file.path);
      if (existing) {
        return {
          openFiles: state.openFiles,
          activeFilePath: file.path,
        };
      }
      const newFile: OpenFile = {
        ...file,
        originalContent: file.content,
        isDirty: false,
      };
      return {
        openFiles: [...state.openFiles, newFile],
        activeFilePath: file.path,
      };
    }),

  closeFile: (path) =>
    set((state) => {
      const filtered = state.openFiles.filter((f) => f.path !== path);
      const newActive =
        state.activeFilePath === path
          ? filtered.length > 0
            ? filtered[filtered.length - 1].path
            : null
          : state.activeFilePath;
      return { openFiles: filtered, activeFilePath: newActive };
    }),

  setActiveFile: (path) => set({ activeFilePath: path }),

  updateFileContent: (path, content) =>
    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.path === path
          ? { ...f, content, isDirty: f.originalContent !== content }
          : f
      ),
    })),

  saveFile: (path) =>
    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.path === path
          ? { ...f, originalContent: f.content, isDirty: false }
          : f
      ),
    })),

  setFontSize: (size) => set({ fontSize: size }),

  toggleWordWrap: () => set((state) => ({ wordWrap: !state.wordWrap })),

  toggleMinimap: () => set((state) => ({ minimap: !state.minimap })),
}));

export { getLanguageFromExtension };