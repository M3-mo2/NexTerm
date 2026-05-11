import { useFileExplorer } from '@/hooks/useFileExplorer';
import { FileNode } from '@/stores/fileStore';
import {
  VscChevronRight,
  VscChevronDown,
  VscFile,
  VscFolder,
  VscFolderOpened,
  VscRootFolderOpened,
  VscNewFolder,
  VscNewFile,
  VscRefresh,
} from 'react-icons/vsc';
import './FileExplorer.css';

function getFileIcon(node: FileNode) {
  if (node.isDir) {
    return node.isExpanded ? (
      <VscFolderOpened size={16} className="file-icon folder-open" />
    ) : (
      <VscFolder size={16} className="file-icon folder" />
    );
  }

  const ext = node.extension?.toLowerCase();
  const iconClass = `file-icon file-type-${ext || 'default'}`;
  return <VscFile size={16} className={iconClass} />;
}

interface TreeNodeProps {
  node: FileNode;
  depth: number;
  onNodeClick: (node: FileNode) => void;
  selectedPath: string | null;
}

function TreeNode({ node, depth, onNodeClick, selectedPath }: TreeNodeProps) {
  const isSelected = node.path === selectedPath;

  return (
    <>
      <div
        className={`tree-node ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={() => onNodeClick(node)}
      >
        {node.isDir && (
          <span className="tree-chevron">
            {node.isExpanded ? (
              <VscChevronDown size={16} />
            ) : (
              <VscChevronRight size={16} />
            )}
          </span>
        )}
        {!node.isDir && <span className="tree-chevron-placeholder" />}
        {getFileIcon(node)}
        <span className="tree-node-name">{node.name}</span>
      </div>
      {node.isDir && node.isExpanded && node.children.length > 0 && (
        <div className="tree-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              onNodeClick={onNodeClick}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function FileExplorer() {
  const { fileTree, loading, error, selectedFilePath, handleNodeClick, openFolder } =
    useFileExplorer();

  return (
    <div className="file-explorer">
      <div className="file-explorer-header">
        <span className="file-explorer-title">EXPLORER</span>
        <div className="file-explorer-actions">
          <button className="icon-btn" title="New File">
            <VscNewFile size={16} />
          </button>
          <button className="icon-btn" title="New Folder">
            <VscNewFolder size={16} />
          </button>
          <button
            className="icon-btn"
            title="Open Folder"
            onClick={() => {
              // Use the dialog API to pick a folder
              import('@tauri-apps/plugin-dialog').then(({ open }) => {
                open({ directory: true, multiple: false }).then((path) => {
                  if (path) openFolder(path as string);
                });
              });
            }}
          >
            <VscRootFolderOpened size={16} />
          </button>
          <button className="icon-btn" title="Refresh">
            <VscRefresh size={16} />
          </button>
        </div>
      </div>

      <div className="file-explorer-tree">
        {loading && <div className="file-explorer-loading">Loading...</div>}
        {error && <div className="file-explorer-error">{error}</div>}
        {fileTree.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            depth={0}
            onNodeClick={handleNodeClick}
            selectedPath={selectedFilePath}
          />
        ))}
      </div>
    </div>
  );
}