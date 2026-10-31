import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Window from '../components/Window.jsx';
import Button from '../components/Button.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { signInWithGitHub, signOut } from '../lib/supabase.js';
import { api } from '../lib/api.js';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState(null);

  const { data: savedRepos, isLoading: reposLoading } = useQuery({
    queryKey: ['saved-repos'],
    queryFn: api.getSavedRepos,
    enabled: !!user,
  });

  const { data: savedIssues, isLoading: issuesLoading } = useQuery({
    queryKey: ['saved-issues'],
    queryFn: api.getSavedIssues,
    enabled: !!user,
  });

  async function handleGitHubLogin() {
    try {
      setSigningIn(true);
      setAuthError(null);
      const data = await signInWithGitHub();
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Sign in failed:', err);
      setAuthError(err.message || 'Failed to initialize GitHub sign-in.');
    } finally {
      setSigningIn(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <Skeleton width="200px" height="28px" />
        <Window title="dashboard.app">
          <Skeleton height="120px" />
        </Window>
      </div>
    );
  }

  if (!user) {
    const isProviderDisabled =
      authError &&
      (authError.toLowerCase().includes('unsupported provider') ||
        authError.toLowerCase().includes('provider is not enabled') ||
        authError.toLowerCase().includes('validation_failed'));

    return (
      <div className={styles.page}>
        <Window title="login_required.txt" className={styles.loginWindow}>
          <div className={styles.loginContent}>
            <span className={styles.lockIcon} aria-hidden="true">🔐</span>
            <h1 className={styles.loginHeading}>Sign in to save your progress</h1>
            <p className={styles.loginText}>
              Log in with GitHub to save repositories, bookmark issues, and track your
              contribution roadmaps. Analysis features work without an account.
            </p>

            <Button
              size="lg"
              onClick={handleGitHubLogin}
              loading={signingIn}
            >
              Sign in with GitHub
            </Button>

            {authError && (
              <div className={styles.errorAlert} role="alert">
                <span className={styles.errorTitle}>
                  ⚠️ {isProviderDisabled ? 'GitHub Provider Not Enabled Yet' : 'Sign-in Error'}
                </span>
                <p>{authError}</p>

                {isProviderDisabled && (
                  <div className={styles.setupGuide}>
                    <strong>How to enable GitHub in your Supabase project:</strong>
                    <ol>
                      <li>
                        Go to{' '}
                        <a
                          href="https://supabase.com/dashboard/project/lfeukxybbbdwwspegulh/auth/providers"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.setupLink}
                        >
                          Supabase Auth Providers ↗
                        </a>
                      </li>
                      <li>Toggle <strong>GitHub</strong> to <strong>Enabled</strong>.</li>
                      <li>
                        Paste your GitHub OAuth App <code>Client ID</code> and <code>Client Secret</code>.
                      </li>
                      <li>
                        Set Callback URL on GitHub to:<br />
                        <code>https://lfeukxybbbdwwspegulh.supabase.co/auth/v1/callback</code>
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        </Window>
      </div>
    );
  }

  const username = user.user_metadata?.user_name || user.email || 'contributor';

  return (
    <div className={styles.page}>
      <div className={styles.userRow}>
        <div className={styles.userInfo}>
          {user.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt={`${username}'s avatar`}
              className={styles.avatar}
              width={40}
              height={40}
            />
          )}
          <h1 className={styles.heading}>Welcome back, {username}!</h1>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => signOut()}
        >
          Sign out
        </Button>
      </div>

      <div className={styles.grid}>
        {/* Saved repos */}
        <Window title="saved_repos.list">
          <h2 className={styles.sectionHeading}>Saved Repositories</h2>
          {reposLoading && <Skeleton height="60px" />}
          {!reposLoading && (!savedRepos || savedRepos.length === 0) && (
            <div className={styles.empty}>
              <p>No saved repos yet.</p>
              <Button size="sm" onClick={() => navigate('/')}>Analyze a repo →</Button>
            </div>
          )}
          {savedRepos?.length > 0 && (
            <ul className={styles.list}>
              {savedRepos.map(r => (
                <li key={r.id} className={styles.listItem}>
                  <button
                    className={styles.listLink}
                    onClick={() => navigate(`/explain/${r.owner}/${r.repo}`)}
                  >
                    {r.owner}/{r.repo}
                  </button>
                  <span className={styles.listDate}>
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Window>

        {/* Saved issues */}
        <Window title="saved_issues.list">
          <h2 className={styles.sectionHeading}>Saved Issues</h2>
          {issuesLoading && <Skeleton height="60px" />}
          {!issuesLoading && (!savedIssues || savedIssues.length === 0) && (
            <div className={styles.empty}>
              <p>No saved issues yet.</p>
              <Button size="sm" onClick={() => navigate('/issues')}>Browse issues →</Button>
            </div>
          )}
          {savedIssues?.length > 0 && (
            <ul className={styles.list}>
              {savedIssues.map(i => (
                <li key={i.id} className={styles.listItem}>
                  <span className={styles.listLink}>{i.title}</span>
                  <span className={styles.listMeta}>{i.owner}/{i.repo} #{i.issue_number}</span>
                </li>
              ))}
            </ul>
          )}
        </Window>
      </div>
    </div>
  );
}
