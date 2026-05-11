import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';
import { terminalApi, eventApi } from '@/api/tauri';
import { useTerminalStore } from '@/stores/terminalStore';
import 'xterm/css/xterm.css';

interface UseTerminalProps {
  terminalId: string;
}

export function useTerminal({ terminalId }: UseTerminalProps) {
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);
  const unlistenExitRef = useRef<(() => void) | null>(null);

  const removeTerminal = useTerminalStore((s) => s.removeTerminal);

  // Initialize terminal
  const initTerminal = useCallback(async () => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 14,
      fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
      theme: {
        background: '#0c0c0c',
        foreground: '#cccccc',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selectionBackground: '#264f78',
        black: '#0c0c0c',
        red: '#c50f1f',
        green: '#13a10e',
        yellow: '#c19c00',
        blue: '#0037da',
        magenta: '#881798',
        cyan: '#3a96dd',
        white: '#cccccc',
        brightBlack: '#767676',
        brightRed: '#e74856',
        brightGreen: '#16c60c',
        brightYellow: '#f9f1a5',
        brightBlue: '#3b78ff',
        brightMagenta: '#b4009e',
        brightCyan: '#61d6d6',
        brightWhite: '#f2f2f2',
      },
      allowProposedApi: true,
      scrollback: 10000,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const searchAddon = new SearchAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.loadAddon(searchAddon);

    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Create PTY on the backend
    const { cols, rows } = term;
    const ptyId = await terminalApi.create({
      cols,
      rows,
      working_dir: undefined,
      shell: undefined,
    });

    // Listen for PTY output
    const unlisten = await eventApi.onTerminalOutput((event) => {
      if (event.id === ptyId && termRef.current) {
        termRef.current.write(event.data);
      }
    });

    const unlistenExit = await eventApi.onTerminalExit((event) => {
      if (event.id === ptyId) {
        removeTerminal(terminalId);
      }
    });

    unlistenRef.current = unlisten;
    unlistenExitRef.current = unlistenExit;

    // Handle user input -> write to PTY
    term.onData((data) => {
      terminalApi.write(ptyId, data).catch(console.error);
    });

    // Handle resize
    term.onResize(({ cols, rows }) => {
      terminalApi.resize(ptyId, cols, rows).catch(console.error);
    });

    // Fit on window resize
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current && termRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch {
          // ignore fit errors during teardown
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [terminalId, removeTerminal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unlistenRef.current) unlistenRef.current();
      if (unlistenExitRef.current) unlistenExitRef.current();
      if (termRef.current) termRef.current.dispose();
    };
  }, []);

  return {
    containerRef,
    initTerminal,
    termRef,
    fitAddonRef,
  };
}