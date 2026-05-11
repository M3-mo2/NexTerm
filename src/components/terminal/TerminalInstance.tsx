import { useEffect } from 'react';
import { useTerminal } from '@/hooks/useTerminal';

interface TerminalInstanceProps {
  terminalId: string;
}

export function TerminalInstance({ terminalId }: TerminalInstanceProps) {
  const { containerRef, initTerminal } = useTerminal({ terminalId });

  useEffect(() => {
    initTerminal();
  }, [initTerminal]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        padding: '4px',
        backgroundColor: '#0c0c0c',
      }}
    />
  );
}