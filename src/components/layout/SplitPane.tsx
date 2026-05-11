import { useCallback, useRef, useState } from 'react';
import './SplitPane.css';

interface SplitPaneProps {
  children: [React.ReactNode, React.ReactNode];
  direction?: 'horizontal' | 'vertical';
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
  onResize?: (size: number) => void;
}

export function SplitPane({
  children,
  direction = 'horizontal',
  initialSize = 260,
  minSize = 100,
  maxSize = 600,
  onResize,
}: SplitPaneProps) {
  const [size, setSize] = useState(initialSize);
  const isDragging = useRef(false);
  const startPos = useRef(0);
  const startSize = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
      startSize.current = size;

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
        const diff = currentPos - startPos.current;
        const newSize = Math.min(maxSize, Math.max(minSize, startSize.current + diff));
        setSize(newSize);
        onResize?.(newSize);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [direction, size, minSize, maxSize, onResize]
  );

  const isHorizontal = direction === 'horizontal';

  return (
    <div
      className="split-pane"
      style={{ flexDirection: isHorizontal ? 'row' : 'column' }}
    >
      <div
        className="split-pane-first"
        style={{
          [isHorizontal ? 'width' : 'height']: `${size}px`,
          [isHorizontal ? 'minWidth' : 'minHeight']: `${minSize}px`,
        }}
      >
        {children[0]}
      </div>
      <div
        className={`split-pane-divider ${direction}`}
        onMouseDown={handleMouseDown}
      />
      <div className="split-pane-second">
        {children[1]}
      </div>
    </div>
  );
}