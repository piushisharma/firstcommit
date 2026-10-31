import styles from './ErrorState.module.css';
import Button from './Button.jsx';

const ERROR_CONFIGS = {
  REPO_NOT_FOUND: {
    icon: '🔍',
    title: 'Repository Not Found',
    message: 'This repo might be private, deleted, or the URL might be wrong. Double-check the GitHub URL and try again.',
  },
  RATE_LIMITED: {
    icon: '⏳',
    title: 'Rate Limited by GitHub',
    message: 'GitHub rate limit reached. Make sure your GITHUB_TOKEN is set in .env (authenticated tokens get 5,000 requests/hour instead of 60 for unauthenticated IPs).',
  },
  AI_PARSE_ERROR: {
    icon: '🤖',
    title: 'AI Hiccup',
    message: 'The AI returned an unexpected response. Try again and it should work.',
  },
  INVALID_URL: {
    icon: '🔗',
    title: 'Invalid URL',
    message: 'That doesn\'t look like a valid GitHub repository URL. Try something like: https://github.com/owner/repo',
  },
  DEFAULT: {
    icon: '⚠️',
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
  },
};

export default function ErrorState({ code, message, onRetry }) {
  const cfg = ERROR_CONFIGS[code] || ERROR_CONFIGS.DEFAULT;
  return (
    <div className={styles.wrap} role="alert">
      <span className={styles.icon} aria-hidden="true">{cfg.icon}</span>
      <h3 className={styles.title}>{cfg.title}</h3>
      <p className={styles.message}>{message || cfg.message}</p>
      {onRetry && (
        <Button onClick={onRetry} size="sm">
          Try Again
        </Button>
      )}
    </div>
  );
}

