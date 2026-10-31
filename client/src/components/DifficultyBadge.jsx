import styles from './DifficultyBadge.module.css';

const CONFIG = {
  Easy:   { bg: 'var(--badge-easy)',   label: 'Easy' },
  Medium: { bg: 'var(--badge-medium)', label: 'Medium' },
  Hard:   { bg: 'var(--badge-hard)',   label: 'Hard' },
};

export default function DifficultyBadge({ level }) {
  const cfg = CONFIG[level] || CONFIG.Medium;
  return (
    <span
      className={styles.badge}
      style={{ '--badge-bg': cfg.bg }}
      aria-label={`Difficulty: ${cfg.label}`}
    >
      {cfg.label}
    </span>
  );
}

