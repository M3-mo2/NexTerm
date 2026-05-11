import { useCallback } from 'react';
import { useTerminalStore } from '@/stores/terminalStore';
import { TerminalInstance } from './TerminalInstance';
import {
  VscAdd,
  VscClose,
  VscTerminal,
} from 'react-icons/vsc';
import './TerminalManager.css';

export function TerminalManager() {
  const { terminals, activeTerminalId, addTerminal, removeTerminal, setActiveTerminal } =
    useTerminalStore();

  const handleNewTerminal = useCallback(() => {
    const id = crypto.randomUUID();
    addTerminal({
      id,
      title: `Terminal ${terminals.length + 1}`,
      shell: 'powershell',
      workingDir: '~',
      cols: 80,
      rows: 24,
    });
  }, [terminals.length, addTerminal]);

  const activeTerminal = terminals.find((t) => t.id === activeTerminalId);

  return (
    <div className="terminal-manager">
      {/* Tab bar */}
      <div className="terminal-tab-bar">
        <div className="terminal-tabs">
          {terminals.map((term) => (
            <div
              key={term.id}
              className={`terminal-tab ${term.id === activeTerminalId ? 'active' : ''}`}
              onClick={() => setActiveTerminal(term.id)}
            >
              <VscTerminal size={14} />
              <span className="terminal-tab-title">{term.title}</span>
              <button
                className="terminal-tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTerminal(term.id);
                }}
              >
                <VscClose size={14} />
              </button>
            </div>
          ))}
        </div>
        <button className="terminal-new-btn" onClick={handleNewTerminal} title="New Terminal">
          <VscAdd size={16} />
        </button>
      </div>

      {/* Terminal content */}
      <div className="terminal-content">
        {activeTerminal ? (
          <TerminalInstance key={activeTerminal.id} terminalId={activeTerminal.id} />
        ) : (
          <div className="terminal-empty">
            <VscTerminal size={48} />
            <p>No terminal open</p>
            <button className="terminal-start-btn" onClick={handleNewTerminal}>
              <VscAdd size={16} />
              Open Terminal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}