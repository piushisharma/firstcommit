import { useEffect } from 'react';
import styles from './Toast.module.css';

/**
 * Controlled Toast / notification.
 * Usage: pass `message` (string) and `visible` (bool).
 * Auto-hides after 2s.
 */
export default function Toast({ message = 'copied!', visible, onHide }) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onHide, 2000);
      return () => clearTimeout(t);
    }
  }, [visible, onHide]);

  return (
    <div
      className={`${styles.toast} ${visible ? styles.show : ''}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message}
    </div>
  );
}

