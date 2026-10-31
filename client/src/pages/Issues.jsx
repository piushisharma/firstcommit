import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Window from '../components/Window.jsx';
import Button from '../components/Button.jsx';
import Skeleton from '../components/Skeleton.jsx';
import ErrorState from '../components/ErrorState.jsx';
import DifficultyBadge from '../components/DifficultyBadge.jsx';
import { api } from '../lib/api.js';
import styles from './Issues.module.css';

const LANGUAGES = ['JavaScript', 'Python', 'TypeScript', 'Go', 'Rust', 'Java', 'C++', 'Ruby', 'PHP'];
const LABELS    = ['good first issue', 'help wanted', 'beginner friendly', 'easy', 'documentation'];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const d = Math.floor(diff / 86400000);
  if (d < 1) return 'today';
  if (d === 1) return '1 day ago';
  if (d < 30) return `${d} days ago`;
  const m = Math.floor(d / 30);
  return m === 1 ? '1 month ago' : `${m} months ago`;
}

export default function Issues() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('');
  const [label, setLabel]       = useState('');
  const [page, setPage]         = useState(1);
  const [analyzing, setAnalyzing] = useState(null);
  const [analysisMap, setAnalysisMap] = useState({});
  const [startingRoadmap, setStartingRoadmap] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['issues', language, label, page],
    queryFn: () => api.getIssues({ language: language || undefined, label: label || undefined, page }),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });

  async function handleAnalyze(issue) {
    const key = `${issue.owner}/${issue.repo}/${issue.number}`;
    if (analysisMap[key]) return;
    setAnalyzing(key);
    try {
      const result = await api.analyzeIssue(issue.owner, issue.repo, issue.number);
      setAnalysisMap(m => ({ ...m, [key]: result.analysis }));
    } catch {
      setAnalysisMap(m => ({ ...m, [key]: null }));
    } finally {
      setAnalyzing(null);
    }
  }

  async function handleStartRoadmap(issue) {
    const key = `${issue.owner}/${issue.repo}/${issue.number}`;
    setStartingRoadmap(key);
    try {
      const roadmap = await api.createRoadmap({
        owner: issue.owner,
        repo: issue.repo,
        issue_number: issue.number,
        title: `Fix: ${issue.title}`,
      });
      navigate(`/roadmap/${roadmap.id}`);
    } catch {
      // If unauthenticated or failed, navigate to dashboard to sign in
      navigate('/dashboard');
    } finally {
      setStartingRoadmap(null);
    }
  }

  return (
    <div className={styles.page}>
      {/* Filters */}
      <Window title="filters.cfg" className={styles.filtersWindow}>
        <div className={styles.filters}>
          <label className={styles.filterLabel}>
            <span>Language</span>
            <select
              className={styles.select}
              value={language}
              onChange={e => { setLanguage(e.target.value); setPage(1); }}
              aria-label="Filter by language"
            >
              <option value="">All languages</option>
              {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>

          <label className={styles.filterLabel}>
            <span>Label</span>
            <select
              className={styles.select}
              value={label}
              onChange={e => { setLabel(e.target.value); setPage(1); }}
              aria-label="Filter by label"
            >
              <option value="">All labels</option>
              {LABELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>

          <Button variant="ghost" size="sm" onClick={() => { setLanguage(''); setLabel(''); setPage(1); }}>
            Clear filters
          </Button>
        </div>
      </Window>

      {/* Results */}
      <Window title="issues.list">
        <div className={styles.resultsHeader}>
          <h1 className={styles.heading}>Good First Issues</h1>
          {data && <span className={styles.count}>{data.total?.toLocaleString()} results</span>}
        </div>

        {isLoading && (
          <div className={styles.list}>
            {[1,2,3,4,5].map(n => <Skeleton key={n} height="90px" />)}
          </div>
        )}

        {isError && (
          <ErrorState code={error?.code} message={error?.message} onRetry={refetch} />
        )}

        {data?.items && (
          <>
            <ul className={styles.list} aria-label="Issues list">
              {data.items.map(issue => {
                const key = `${issue.owner}/${issue.repo}/${issue.number}`;
                const analysis = analysisMap[key];
                return (
                  <li key={issue.id} className={styles.issueCard}>
                    <div className={styles.issueTop}>
                      <a
                        href={issue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.issueTitle}
                      >
                        {issue.title}
                      </a>
                      {analysis && <DifficultyBadge level={analysis.difficulty} />}
                    </div>

                    <div className={styles.issueMeta}>
                      <a
                        href={issue.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.repoLink}
                      >
                        {issue.owner}/{issue.repo}
                      </a>
                      <span className={styles.metaSep}>·</span>
                      <span className={styles.metaItem}>💬 {issue.comments}</span>
                      <span className={styles.metaSep}>·</span>
                      <span className={styles.metaItem}>{timeAgo(issue.createdAt)}</span>
                    </div>

                    <div className={styles.labelRow}>
                      {issue.labels.slice(0, 4).map(l => (
                        <span key={l} className={styles.labelChip}>{l}</span>
                      ))}
                    </div>

                    {analysis && (
                      <div className={styles.analysisBox}>
                        <p><strong>The problem:</strong> {analysis.what_the_problem_is}</p>
                        <p><strong>What you need to do:</strong> {analysis.what_you_need_to_do}</p>
                        {analysis.likely_files?.length > 0 && (
                          <div>
                            <strong>Likely files:</strong>{' '}
                            {analysis.likely_files.map(f => f.path).join(', ')}
                          </div>
                        )}
                        <p className={styles.analysisTime}>⏱ {analysis.estimated_time}</p>
                      </div>
                    )}

                    <div className={styles.issueActions}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAnalyze(issue)}
                        loading={analyzing === key}
                        disabled={!!analysis}
                      >
                        {analysis ? 'Analyzed ✓' : 'AI Breakdown'}
                      </Button>
                      {analysis && (
                        <Button
                          size="sm"
                          onClick={() => handleStartRoadmap(issue)}
                          loading={startingRoadmap === key}
                        >
                          Start this Issue ✦
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/explain/${issue.owner}/${issue.repo}`)}
                      >
                        Explore Repo →
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Pagination */}
            <div className={styles.pagination} role="navigation" aria-label="Page navigation">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Previous
              </Button>
              <span className={styles.pageNum}>Page {page}</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPage(p => p + 1)}
                disabled={!data?.items?.length || data.items.length < 20}
              >
                Next →
              </Button>
            </div>
          </>
        )}
      </Window>
    </div>
  );
}

