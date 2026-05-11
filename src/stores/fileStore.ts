import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  isFile: boolean;
  isSymlink: boolean;
  size: number;
  modified: number;
  extension: string | null;
  children: FileNode[];
  childrenLoaded: boolean;
  isExpanded: boolean;
}

export interface FileState {
  rootPath: string | null;
  fileTree: FileNode[];
  selectedFilePath: string | null;
  expandedPaths: Set<string>;

  // Actions
  setRootPath: (path: string) => void;
  setFileTree: (tree: FileNode[]) => void;
  selectFile: (path: string | null) => void;
  toggleExpand: (path: string) => void;
  updateNodeChildren: (parentPath: string, children: FileNode[]) => void;
  reset: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useFileStore = create<FileState>((set) => ({
  rootPath: null,
  fileTree: [],
  selectedFilePath: null,
  expandedPaths: new Set<string>(),

  setRootPath: (path) =>
    set({ rootPath: path, fileTree: [], expandedPaths: new Set() }),

  setFileTree: (tree) => set({ fileTree: tree }),

  selectFile: (path) => set({ selectedFilePath: path }),

  toggleExpand: (path) =>
    set((state) => {
      const newExpanded = new Set(state.expandedPaths);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { expandedPaths: newExpanded };
    }),

  updateNodeChildren: (parentPath, children) =>
    set((state) => {
      const updateNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.path === parentPath) {
            return { ...node, children, childrenLoaded: true, isExpanded: true };
          }
          if (node.children.length > 0) {
            return { ...node, children: updateNode(node.children) };
          }
          return node;
        });
      };
      return { fileTree: updateNode(state.fileTree) };
    }),

  reset: () =>
    set({
      rootPath: null,
      fileTree: [],
      selectedFilePath: null,
      expandedPaths: new Set(),
    }),
}));