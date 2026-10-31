import { Link } from 'react-router-dom';
import Window from '../components/Window.jsx';
import Button from '../components/Button.jsx';
import styles from './NotFound.module.css';

export default function NotFound() {
  return (
    <div className={styles.page}>
      <Window title="404.exe" className={styles.window}>
        <div className={styles.content}>
          <span className={styles.code} aria-hidden="true">404</span>
          <h1 className={styles.heading}>Page Not Found</h1>
          <p className={styles.message}>
            This page doesn&rsquo;t exist — like a commit that never happened.
          </p>
          <Link to="/">
            <Button size="lg">Back to Home</Button>
          </Link>
        </div>
      </Window>
    </div>
  );
}

