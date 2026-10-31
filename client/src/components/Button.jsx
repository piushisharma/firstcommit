import styles from './Button.module.css';

/**
 * Retro OS button.
 * Props: variant ('primary'|'secondary'|'ghost'), size ('sm'|'md'|'lg'),
 *        loading, disabled, onClick, type, children, className, ...rest
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  children,
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${loading ? styles.loading : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
      {...rest}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      <span className={loading ? styles.hidden : ''}>{children}</span>
    </button>
  );
}

