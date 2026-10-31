import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import styles from './MenuBar.module.css';
import Sparkle from './Sparkle.jsx';

const NAV_ITEMS = [
  { label: 'File',     href: '/' },
  { label: 'Explore',  href: '/explore/facebook/react' },
  { label: 'Issues',   href: '/issues' },
  { label: 'Roadmap',  href: '/dashboard' },
];

export default function MenuBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.bar} role="banner">
      <nav className={styles.inner} aria-label="Main navigation">
        {/* Logo */}
        <Link to="/" className={styles.logo} aria-label="FirstCommit home">
          <Sparkle size={14} />
          <span>FirstCommit</span>
        </Link>

        {/* Desktop nav */}
        <ul className={styles.navList} role="menubar">
          {NAV_ITEMS.map(item => (
            <li key={item.href} role="none">
              <NavLink
                to={item.href}
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                role="menuitem"
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <div className={styles.right}>
          <Link to="/dashboard" className={styles.dashBtn}>
            Dashboard
          </Link>

          {/* Mobile hamburger */}
          <button
            className={styles.burger}
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav id="mobile-menu" className={styles.mobileMenu} aria-label="Mobile navigation">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => `${styles.mobileItem} ${isActive ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/dashboard" className={styles.mobileItem} onClick={() => setMenuOpen(false)}>
            Dashboard
          </NavLink>
        </nav>
      )}
    </header>
  );
}

