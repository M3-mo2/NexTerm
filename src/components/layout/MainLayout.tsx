import { useEffect, useState } from 'react';
import { useLayoutStore } from '@/stores/layoutStore';
import { Sidebar } from './Sidebar';
import { SplitPane } from './SplitPane';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { TerminalManager } from '@/components/terminal/TerminalManager';
import {
  VscChromeMinimize,
  VscChromeMaximize,
  VscChromeClose,
  VscMenu,
} from 'react-icons/vsc';
import './MainLayout.css';

export function MainLayout() {
  const {
    sidebarVisible,
    toggleSidebar,
    editorPanelVisible,
    setSidebarWidth,
  } = useLayoutStore();

  const [terminalVisible, setTerminalVisible] = useState(true);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+B: Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      // Ctrl+`: Toggle terminal
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setTerminalVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSidebar]);

  return (
    <div className="main-layout">
      {/* Title bar */}
      <div className="title-bar" data-tauri-drag-region>
        <div className="title-bar-left">
          <button className="title-bar-btn" onClick={toggleSidebar} title="Toggle Sidebar (Ctrl+B)">
            <VscMenu size={16} />
          </button>
          <span className="title-bar-title">NexTerm</span>
        </div>
        <div className="title-bar-controls">
          <button className="window-btn minimize" title="Minimize">
            <VscChromeMinimize size={16} />
          </button>
          <button className="window-btn maximize" title="Maximize">
            <VscChromeMaximize size={16} />
          </button>
          <button className="window-btn close" title="Close">
            <VscChromeClose size={16} />
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="main-content">
        {sidebarVisible ? (
          <SplitPane
            direction="horizontal"
            initialSize={260}
            minSize={150}
            maxSize={500}
            onResize={setSidebarWidth}
          >
            <Sidebar />
            <div className="work-area">
              {editorPanelVisible && terminalVisible ? (
                <SplitPane
                  direction="vertical"
                  initialSize={400}
                  minSize={150}
                  maxSize={800}
                >
                  <CodeEditor />
                  <TerminalManager />
                </SplitPane>
              ) : editorPanelVisible ? (
                <CodeEditor />
              ) : terminalVisible ? (
                <TerminalManager />
              ) : (
                <CodeEditor />
              )}
            </div>
          </SplitPane>
        ) : (
          <div className="work-area">
            {editorPanelVisible && terminalVisible ? (
              <SplitPane
                direction="vertical"
                initialSize={400}
                minSize={150}
                maxSize={800}
              >
                <CodeEditor />
                <TerminalManager />
              </SplitPane>
            ) : editorPanelVisible ? (
              <CodeEditor />
            ) : terminalVisible ? (
              <TerminalManager />
            ) : (
              <CodeEditor />
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="status-bar">
        <div className="status-bar-left">
          <span className="status-item">main</span>
          <span className="status-item">UTF-8</span>
        </div>
        <div className="status-bar-right">
          <span className="status-item">Spaces: 2</span>
          <span className="status-item">PowerShell</span>
          <span className="status-item">Ln 1, Col 1</span>
        </div>
      </div>
    </div>
  );
}