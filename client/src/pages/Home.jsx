import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Window from '../components/Window.jsx';
import Button from '../components/Button.jsx';
import Folder from '../components/Folder.jsx';
import Sparkle from '../components/Sparkle.jsx';
import Skeleton from '../components/Skeleton.jsx';
import { api } from '../lib/api.js';
import styles from './Home.module.css';

const EXAMPLE_REPOS = [
  { owner: 'freeCodeCamp',  repo: 'freeCodeCamp',  tint: 'ice',   sublabel: 'JavaScript' },
  { owner: 'firstcontributions', repo: 'first-contributions', tint: 'peach', sublabel: 'All levels' },
  { owner: 'public-apis',   repo: 'public-apis',   tint: 'blush', sublabel: 'Markdown' },
  { owner: 'EbookFoundation', repo: 'free-programming-books', tint: 'sand', sublabel: 'Docs' },
  { owner: 'sindresorhus',  repo: 'awesome',       tint: 'white', sublabel: 'Curated lists' },
  { owner: 'vinta',         repo: 'awesome-python',tint: 'ice',   sublabel: 'Python' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Paste a GitHub URL', desc: 'Drop any public repo URL into the box and we\'ll do the rest.' },
  { step: '02', title: 'Understand the codebase', desc: 'Get a plain-English breakdown: what it does, how it\'s built, and which files matter.' },
  { step: '03', title: 'Make your first commit', desc: 'Find a beginner issue, follow your personalized roadmap, and open your first PR.' },
];

function usePreviewIssues() {
  return useQuery({
    queryKey: ['issues', 'preview'],
    queryFn: () => api.getIssues({ page: 1 }),
    staleTime: 10 * 60 * 1000,
  });
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { data: issuesData, isLoading: issuesLoading, isError: issuesError } = usePreviewIssues();

  function validateUrl(value) {
    if (!value.trim()) return 'Please enter a GitHub URL';
    if (!value.includes('github.com')) return 'URL must be a github.com address';
    if (!/github\.com\/[^/]+\/[^/]+/.test(value)) return 'URL should look like: github.com/owner/repo';
    return '';
  }

  function handleAnalyze(e) {
    e.preventDefault();
    const err = validateUrl(url);
    if (err) { setError(err); return; }
    setError('');
    const match = url.match(/github\.com\/([^/]+)\/([^/?#]+)/);
    if (match) navigate(`/explain/${match[1]}/${match[2]}`);
  }

  function handleExampleClick(owner, repo) {
    navigate(`/explain/${owner}/${repo}`);
  }

  return (
    <div className={styles.page}>
      {/* Hero window */}
      <Window title="welcome.txt" className={styles.heroWindow}>
        <div className={styles.hero}>
          <div className={styles.heroText}>
            <h1 className={styles.headline}>
              <Sparkle size={20} className={styles.heroSparkle} />
              Breaking the barriers<br />to open source
            </h1>
            <p className={styles.pitch}>
              Turn overwhelming GitHub repos into{' '}
              <em>beginner-friendly adventures</em>. Understand any codebase
              in minutes, find your perfect first issue, and make your first
              commit with confidence.
            </p>

            <form onSubmit={handleAnalyze} className={styles.urlForm} noValidate>
              <div className={styles.inputWrap}>
                <label htmlFor="repo-url" className={styles.inputLabel}>
                  GitHub Repository URL
                </label>
                <input
                  id="repo-url"
                  type="url"
                  className={styles.urlInput}
                  placeholder="https://github.com/owner/repo"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setError(''); }}
                  aria-describedby={error ? 'url-error' : undefined}
                  aria-invalid={!!error}
                  autoComplete="off"
                />
                {error && (
                  <span id="url-error" className={styles.fieldError} role="alert">
                    {error}
                  </span>
                )}
              </div>
              <Button type="submit" size="lg" className={styles.analyzeBtn}>
                Analyze Repo ✦
              </Button>
            </form>
          </div>

          <div className={styles.heroArt} aria-hidden="true">
            <div className={styles.terminalMock}>
              <div className={styles.terminalBar}>
                <span />
                <span />
                <span />
              </div>
              <pre className={styles.terminalCode}>{`$ git clone <url>
$ cd my-project
$ npm install

✦ Ready to contribute!`}</pre>
            </div>
          </div>
        </div>
      </Window>

      <div className={styles.twoCol}>
        {/* How it works */}
        <Window title="how_it_works.doc" className={styles.howWindow}>
          <h2 className={styles.sectionHeading}>How It Works</h2>
          <ol className={styles.steps} aria-label="How FirstCommit works">
            {HOW_IT_WORKS.map(item => (
              <li key={item.step} className={styles.step}>
                <span className={styles.stepNum} aria-hidden="true">{item.step}</span>
                <div>
                  <strong className={styles.stepTitle}>{item.title}</strong>
                  <p className={styles.stepDesc}>{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </Window>

        {/* Live issues teaser */}
        <Window title="good_first_issues.exe" className={styles.issuesWindow}>
          <div className={styles.issuesHeader}>
            <h2 className={styles.sectionHeading}>Good First Issues</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/issues')}
            >
              See all →
            </Button>
          </div>

          {issuesLoading && (
            <div className={styles.issuesList}>
              {[1,2,3].map(n => <Skeleton key={n} height="60px" />)}
            </div>
          )}

          {issuesError && (
            <p className={styles.issuesFallback}>
              Could not load issues right now. <Link to="/issues">Browse manually →</Link>
            </p>
          )}

          {issuesData && (
            <ul className={styles.issuesList} aria-label="Sample good first issues">
              {issuesData.items?.slice(0, 4).map(issue => (
                <li key={issue.id} className={styles.issueCard}>
                  <div className={styles.issueTop}>
                    <span className={styles.issueTitle}>{issue.title}</span>
                  </div>
                  <div className={styles.issueMeta}>
                    <span className={styles.issueRepo}>{issue.owner}/{issue.repo}</span>
                    <span className={styles.issueLabels}>
                      {issue.labels.slice(0, 2).map(l => (
                        <span key={l} className={styles.label}>{l}</span>
                      ))}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Window>
      </div>

      {/* Example repos */}
      <Window title="beginner_repos.folder" className={styles.foldersWindow}>
        <h2 className={styles.sectionHeading}>Try These Beginner-Friendly Repos</h2>
        <p className={styles.foldersSubtitle}>Click any folder to analyze it instantly</p>
        <div className={styles.foldersRow} role="list">
          {EXAMPLE_REPOS.map(r => (
            <div key={`${r.owner}/${r.repo}`} role="listitem">
              <Folder
                label={r.repo}
                sublabel={r.sublabel}
                tint={r.tint}
                onClick={() => handleExampleClick(r.owner, r.repo)}
              />
            </div>
          ))}
        </div>
      </Window>
    </div>
  );
}

