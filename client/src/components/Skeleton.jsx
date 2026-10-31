import styles from './Skeleton.module.css';

/**
 * Animated skeleton loader placeholder.
 */
export default function Skeleton({ width = '100%', height = '20px', className = '' }) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
      role="presentation"
    />
  );
}

