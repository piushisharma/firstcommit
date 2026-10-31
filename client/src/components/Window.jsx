import { useRef, useState, useEffect, useId } from 'react';
import styles from './Window.module.css';

let zCounter = 10;

/**
 * Retro OS-style window component.
 * Props:
 *  - title (string): shown in title bar
 *  - children
 *  - className (string): extra classes on the outer wrapper
 *  - defaultMinimized (bool)
 *  - noPad (bool): remove body padding (for full-bleed content)
 *  - style: inline styles on wrapper
 */
export default function Window({ title, children, className = '', defaultMinimized = false, noPad = false, style }) {
  const [minimized, setMinimized] = useState(defaultMinimized);
  const [closed, setClosed] = useState(false);
  const [zIndex, setZIndex] = useState(10);
  const winRef = useRef(null);
  const titleId = useId();

  // Drag state (desktop only)
  const drag = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  function bringToFront() {
    zCounter += 1;
    setZIndex(zCounter);
  }

  function onMouseDown(e) {
    // Only drag on the title bar, not buttons
    if (e.target.closest('button')) return;
    // Only on non-touch devices
    if (window.matchMedia('(hover: none)').matches) return;
    bringToFront();
    drag.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
    setIsDragging(true);
    e.preventDefault();
  }

  useEffect(() => {
    function onMouseMove(e) {
      if (!drag.current.active) return;
      setPos({
        x: drag.current.origX + e.clientX - drag.current.startX,
        y: drag.current.origY + e.clientY - drag.current.startY,
      });
    }
    function onMouseUp() {
      if (drag.current.active) {
        drag.current.active = false;
        setIsDragging(false);
      }
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  if (closed) return null;

  const transform = pos.x || pos.y ? `translate(${pos.x}px, ${pos.y}px)` : undefined;

  return (
    <article
      ref={winRef}
      className={`${styles.window} ${minimized ? styles.minimized : ''} ${isDragging ? styles.dragging : ''} ${className}`}
      style={{ zIndex, transform, ...style }}
      aria-labelledby={titleId}
      onClick={bringToFront}
    >
      {/* Title bar */}
      <div
        className={styles.titleBar}
        onMouseDown={onMouseDown}
        role="toolbar"
        aria-label={`Window controls for ${title}`}
      >
        <button
          className={styles.checkbox}
          onClick={(e) => { e.stopPropagation(); setMinimized(m => !m); }}
          aria-label={minimized ? `Restore ${title}` : `Minimize ${title}`}
          aria-pressed={minimized}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            {!minimized && <line x1="2" y1="5" x2="8" y2="5" stroke="currentColor" strokeWidth="1.5"/>}
          </svg>
        </button>

        <div className={styles.titleWrap}>
          <span className={styles.titleLine} aria-hidden="true"/>
          <span className={styles.titleText} id={titleId}>{title}</span>
          <span className={styles.titleLine} aria-hidden="true"/>
        </div>

        <button
          className={styles.closeBtn}
          onClick={(e) => { e.stopPropagation(); setClosed(true); }}
          aria-label={`Close ${title}`}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
      </div>

      {/* Body */}
      {!minimized && (
        <div className={`${styles.body} ${noPad ? styles.noPad : ''}`}>
          {children}
        </div>
      )}
    </article>
  );
}
