import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TerminalConfig {
  shell?: string;
  working_dir?: string;
  cols: number;
  rows: number;
}

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  is_file: boolean;
  is_symlink: boolean;
  size: number;
  modified: number;
  extension: string | null;
  children_loaded: boolean;
}

export interface TerminalOutputEvent {
  id: string;
  data: string;
}

export interface TerminalExitEvent {
  id: string;
  exit_code: number | null;
}

// ─── Terminal Commands ───────────────────────────────────────────────────────

export const terminalApi = {
  create: (config: TerminalConfig): Promise<string> =>
    invoke('create_terminal', { config }),

  write: (id: string, data: string): Promise<void> =>
    invoke('write_to_terminal', { id, data }),

  resize: (id: string, cols: number, rows: number): Promise<void> =>
    invoke('resize_terminal', { id, cols, rows }),

  kill: (id: string): Promise<void> =>
    invoke('kill_terminal', { id }),
};

// ─── Filesystem Commands ────────────────────────────────────────────────────

export const fsApi = {
  readDirectory: (path: string): Promise<FileEntry[]> =>
    invoke('read_directory', { path }),

  readFileContent: (path: string): Promise<string> =>
    invoke('read_file_content', { path }),

  writeFileContent: (path: string, content: string): Promise<void> =>
    invoke('write_file_content', { path, content }),

  createFile: (path: string): Promise<void> =>
    invoke('create_file', { path }),

  createDirectory: (path: string): Promise<void> =>
    invoke('create_directory', { path }),

  deleteEntry: (path: string): Promise<void> =>
    invoke('delete_entry', { path }),

  renameEntry: (oldPath: string, newPath: string): Promise<void> =>
    invoke('rename_entry', { old_path: oldPath, new_path: newPath }),

  getHomeDir: (): Promise<string> =>
    invoke('get_home_dir'),
};

// ─── Event Listeners ─────────────────────────────────────────────────────────

export const eventApi = {
  onTerminalOutput: (
    handler: (event: TerminalOutputEvent) => void
  ): Promise<UnlistenFn> =>
    listen<TerminalOutputEvent>('terminal-output', (e) => handler(e.payload)),

  onTerminalExit: (
    handler: (event: TerminalExitEvent) => void
  ): Promise<UnlistenFn> =>
    listen<TerminalExitEvent>('terminal-exit', (e) => handler(e.payload)),
};