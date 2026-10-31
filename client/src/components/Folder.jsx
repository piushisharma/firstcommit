import { Link } from 'react-router-dom';
import styles from './Folder.module.css';

const TINTS = {
  white: 'var(--folder-white)',
  ice:   'var(--folder-ice)',
  peach: 'var(--folder-peach)',
  blush: 'var(--folder-blush)',
  sand:  'var(--folder-sand)',
};

/**
 * Retro folder icon.
 * Props: label, sublabel, tint ('white'|'ice'|'peach'|'blush'|'sand'), to (link), onClick
 */
export default function Folder({ label, sublabel, tint = 'white', to, onClick }) {
  const bg = TINTS[tint] || TINTS.white;
  const Tag = to ? Link : 'button';
  const extraProps = to ? { to } : { onClick, type: 'button' };

  return (
    <Tag
      className={styles.folder}
      style={{ '--folder-bg': bg }}
      aria-label={sublabel ? `${label} — ${sublabel}` : label}
      {...extraProps}
    >
      {/* Folder SVG */}
      <svg
        className={styles.icon}
        viewBox="0 0 80 60"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Tab */}
        <path d="M4 16 Q4 10 10 10 L30 10 L36 16 Z" fill={bg} stroke="var(--maroon)" strokeWidth="2"/>
        {/* Body */}
        <rect x="4" y="16" width="72" height="40" rx="2" fill={bg} stroke="var(--maroon)" strokeWidth="2"/>
      </svg>
      <span className={styles.label}>{label}</span>
      {sublabel && <span className={styles.sublabel}>{sublabel}</span>}
    </Tag>
  );
}

