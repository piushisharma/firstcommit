import { Link } from 'react-router-dom';
import Sparkle from './Sparkle.jsx';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <span className={styles.logo}>
            <Sparkle size={12} />
            FirstCommit
          </span>
          <span className={styles.tagline}>learn · explore · contribute</span>
        </div>

        <Link to="/" className={styles.cta}>
          start your first commit
        </Link>

        <nav className={styles.links} aria-label="Footer links">
          <Link to="/issues">Issues</Link>
          <Link to="/dashboard">Dashboard</Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
        </nav>
      </div>
    </footer>
  );
}

