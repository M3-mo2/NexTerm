import { useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useEditorStore, getLanguageFromExtension } from '@/stores/editorStore';
import { fsApi } from '@/api/tauri';
import { useFileStore } from '@/stores/fileStore';
import {
  VscClose,
  VscCircleFilled,
} from 'react-icons/vsc';
import './CodeEditor.css';

function EditorTabs() {
  const { openFiles, activeFilePath, setActiveFile, closeFile, saveFile } =
    useEditorStore();

  const handleTabClose = useCallback(
    (path: string, e: React.MouseEvent) => {
      e.stopPropagation();
      closeFile(path);
    },
    [closeFile]
  );

  const handleSave = useCallback(
    async (path: string) => {
      const file = openFiles.find((f) => f.path === path);
      if (file && file.isDirty) {
        await fsApi.writeFileContent(path, file.content);
        saveFile(path);
      }
    },
    [openFiles, saveFile]
  );

  // Keyboard shortcut for save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activeFilePath) {
          handleSave(activeFilePath);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeFilePath, handleSave]);

  if (openFiles.length === 0) return null;

  return (
    <div className="editor-tabs">
      {openFiles.map((file) => (
        <div
          key={file.path}
          className={`editor-tab ${file.path === activeFilePath ? 'active' : ''}`}
          onClick={() => setActiveFile(file.path)}
        >
          <span className="editor-tab-name">{file.name}</span>
          {file.isDirty && (
            <VscCircleFilled size={8} className="editor-tab-dirty" />
          )}
          <button
            className="editor-tab-close"
            onClick={(e) => handleTabClose(file.path, e)}
          >
            <VscClose size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function CodeEditor() {
  const { openFiles, activeFilePath, updateFileContent, fontSize, wordWrap, minimap } =
    useEditorStore();
  const selectedFilePath = useFileStore((s) => s.selectedFilePath);

  // Load file content when selected
  useEffect(() => {
    if (!selectedFilePath) return;
    const alreadyOpen = openFiles.find((f) => f.path === selectedFilePath);
    if (alreadyOpen) return;

    const loadFile = async () => {
      try {
        const content = await fsApi.readFileContent(selectedFilePath);
        const name = selectedFilePath.split(/[/\\]/).pop() || 'untitled';
        const ext = name.includes('.') ? name.split('.').pop() || null : null;
        const language = getLanguageFromExtension(ext);

        useEditorStore.getState().openFile({
          path: selectedFilePath,
          name,
          content,
          language,
        });
      } catch (err) {
        console.error('Failed to load file:', err);
      }
    };

    loadFile();
  }, [selectedFilePath, openFiles]);

  const activeFile = openFiles.find((f) => f.path === activeFilePath);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (activeFilePath && value !== undefined) {
        updateFileContent(activeFilePath, value);
      }
    },
    [activeFilePath, updateFileContent]
  );

  return (
    <div className="code-editor">
      <EditorTabs />
      <div className="editor-content">
        {activeFile ? (
          <Editor
            height="100%"
            language={activeFile.language}
            value={activeFile.content}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              fontSize,
              wordWrap: wordWrap ? 'on' : 'off',
              minimap: { enabled: minimap },
              fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
              fontLigatures: true,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderLineHighlight: 'all',
              bracketPairColorization: { enabled: true },
              padding: { top: 8 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        ) : (
          <div className="editor-welcome">
            <div className="editor-welcome-content">
              <h1>NexTerm</h1>
              <p>Modern Terminal & Code Editor</p>
              <div className="editor-shortcuts">
                <div className="shortcut">
                  <kbd>Ctrl</kbd>+<kbd>S</kbd> Save File
                </div>
                <div className="shortcut">
                  <kbd>Ctrl</kbd>+<kbd>`</kbd> Toggle Terminal
                </div>
                <div className="shortcut">
                  <kbd>Ctrl</kbd>+<kbd>B</kbd> Toggle Sidebar
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}