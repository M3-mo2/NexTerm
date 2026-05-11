import { useEffect, useState, useCallback } from 'react';
import { fsApi } from '@/api/tauri';
import { useFileStore, FileNode } from '@/stores/fileStore';

export function useFileExplorer() {
  const {
    rootPath,
    fileTree,
    setRootPath,
    setFileTree,
    selectFile,
    toggleExpand,
    updateNodeChildren,
    expandedPaths,
    selectedFilePath,
  } = useFileStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert API FileEntry to FileNode
  const toFileNode = useCallback(
    (entry: Awaited<ReturnType<typeof fsApi.readDirectory>>[0]): FileNode => ({
      name: entry.name,
      path: entry.path,
      isDir: entry.is_dir,
      isFile: entry.is_file,
      isSymlink: entry.is_symlink,
      size: entry.size,
      modified: entry.modified,
      extension: entry.extension,
      children: [],
      childrenLoaded: false,
      isExpanded: expandedPaths.has(entry.path),
    }),
    [expandedPaths]
  );

  // Open a folder as root
  const openFolder = useCallback(
    async (path: string) => {
      setLoading(true);
      setError(null);
      try {
        const entries = await fsApi.readDirectory(path);
        const nodes = entries.map(toFileNode);
        setRootPath(path);
        setFileTree(nodes);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [setRootPath, setFileTree, toFileNode]
  );

  // Load children of a directory node
  const loadChildren = useCallback(
    async (parentPath: string) => {
      try {
        const entries = await fsApi.readDirectory(parentPath);
        const nodes = entries.map(toFileNode);
        updateNodeChildren(parentPath, nodes);
        toggleExpand(parentPath);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [toFileNode, updateNodeChildren, toggleExpand]
  );

  // Handle node click
  const handleNodeClick = useCallback(
    (node: FileNode) => {
      if (node.isDir) {
        if (node.childrenLoaded) {
          toggleExpand(node.path);
        } else {
          loadChildren(node.path);
        }
      } else {
        selectFile(node.path);
      }
    },
    [loadChildren, toggleExpand, selectFile]
  );

  // Initialize with home directory
  useEffect(() => {
    if (!rootPath) {
      fsApi.getHomeDir().then(openFolder).catch(console.error);
    }
  }, [rootPath, openFolder]);

  return {
    rootPath,
    fileTree,
    loading,
    error,
    selectedFilePath,
    expandedPaths,
    openFolder,
    handleNodeClick,
    selectFile,
  };
}