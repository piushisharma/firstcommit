import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Window from '../components/Window.jsx';
import Button from '../components/Button.jsx';
import Skeleton from '../components/Skeleton.jsx';
import ErrorState from '../components/ErrorState.jsx';
import DifficultyBadge from '../components/DifficultyBadge.jsx';
import MarkdownMessage from '../components/MarkdownMessage.jsx';
import { api } from '../lib/api.js';
import styles from './Explain.module.css';

function useRepoAnalysis(owner, repo) {
  return useQuery({
    queryKey: ['repo-analysis', owner, repo],
    queryFn: () => api.analyzeRepo(`https://github.com/${owner}/${repo}`),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}

function SkeletonWindow({ title }) {
  return (
    <Window title={title}>
      <Skeleton height="24px" width="60%" />
      <div style={{ marginTop: '12px' }}>
        <Skeleton height="16px" />
        <div style={{ marginTop: '8px' }}><Skeleton height="16px" width="80%" /></div>
        <div style={{ marginTop: '8px' }}><Skeleton height="16px" width="90%" /></div>
      </div>
    </Window>
  );
}

function RepoChat({ owner, repo }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi! I'm your mentor for ${owner}/${repo}. Ask me anything about how this codebase is structured, what technologies it uses, or where to start contributing!` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chat(owner, repo, newMessages.map(m => ({ role: m.role, content: m.content })));
      setMessages([...newMessages, { role: 'assistant', content: res.response }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I hit a snag trying to answer that. Please try again!' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Window title="ask_about_repo.chat" className={styles.chatWindow}>
      <h2 className={styles.winHeading}>Ask about this repo</h2>
      <div className={styles.chatBox}>
        <div className={styles.chatMessages} role="log" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className={`${styles.chatMsg} ${styles[m.role]}`}>
              <span className={styles.chatRole}>{m.role === 'assistant' ? '✦ mentor' : 'you'}:</span>
              {m.role === 'assistant' ? (
                <MarkdownMessage content={m.content} />
              ) : (
                <p className={styles.chatText}>{m.content}</p>
              )}
            </div>
          ))}
          {loading && (
            <div className={`${styles.chatMsg} ${styles.assistant}`}>
              <span className={styles.chatRole}>✦ mentor:</span>
              <p className={styles.chatText}><Skeleton width="160px" height="14px" /></p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className={styles.chatForm}>
          <input
            type="text"
            className={styles.chatInput}
            placeholder="e.g. How does authentication work? Where is the main router?"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" size="sm" loading={loading} disabled={!input.trim()}>
            Ask
          </Button>
        </form>
      </div>
    </Window>
  );
}

export default function Explain() {
  const { owner, repo } = useParams();
  const { data, isLoading, isError, error, refetch } = useRepoAnalysis(owner, repo);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <Skeleton width="200px" height="28px" />
        </div>
        <div className={styles.grid}>
          <SkeletonWindow title="overview.md" />
          <SkeletonWindow title="tech_stack.json" />
          <SkeletonWindow title="folder_map.txt" />
          <SkeletonWindow title="key_files.md" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.page}>
        <Window title="error.txt">
          <ErrorState
            code={error?.code}
            message={error?.message}
            onRetry={refetch}
          />
        </Window>
      </div>
    );
  }

  const { analysis, repoData } = data;

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden="true"> › </span>
        <span>{owner}/{repo}</span>
      </nav>

      <div className={styles.titleRow}>
        <h1 className={styles.pageTitle}>{owner}/{repo}</h1>
        <div className={styles.actions}>
          <DifficultyBadge level={analysis.difficultyLevel} />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => window.open(repoData.htmlUrl, '_blank', 'noopener')}
          >
            View on GitHub ↗
          </Button>
          <Button
            size="sm"
            onClick={() => window.location.href = `/explore/${owner}/${repo}`}
          >
            Explore Files
          </Button>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Overview */}
        <Window title="overview.md" className={styles.overviewWindow}>
          <h2 className={styles.winHeading}>What this project does</h2>
          <p className={styles.summary}>{analysis.summary}</p>
          <p className={styles.connectsText}>{analysis.howItConnects}</p>

          <div className={styles.metaRow}>
            <span className={styles.metaPill}>⭐ {repoData.stars?.toLocaleString()} stars</span>
            {repoData.language && <span className={styles.metaPill}>📝 {repoData.language}</span>}
            {repoData.license && <span className={styles.metaPill}>⚖️ {repoData.license}</span>}
          </div>

          {analysis.goodFor?.length > 0 && (
            <div className={styles.goodFor}>
              <strong>Good for:</strong>{' '}
              {analysis.goodFor.join(', ')}
            </div>
          )}

          {analysis.contributingTip && (
            <div className={styles.tip}>
              <strong>💡 Contributing tip:</strong> {analysis.contributingTip}
            </div>
          )}
        </Window>

        {/* Tech Stack */}
        <Window title="tech_stack.json" className={styles.techWindow}>
          <h2 className={styles.winHeading}>Tech Stack</h2>
          <ul className={styles.techList}>
            {analysis.techStack?.map(tech => (
              <li key={tech.name} className={styles.techItem}>
                <strong className={styles.techName}>{tech.name}</strong>
                <span className={styles.techRole}>{tech.role}</span>
                {tech.beginner_tip && (
                  <span className={styles.techTip}>💡 {tech.beginner_tip}</span>
                )}
              </li>
            ))}
          </ul>
        </Window>

        {/* Folder Structure */}
        <Window title="folder_map.txt" className={styles.folderWindow}>
          <h2 className={styles.winHeading}>Folder Structure</h2>
          <ul className={styles.folderList}>
            {analysis.folderStructure?.map(folder => (
              <li key={folder.path} className={styles.folderItem}>
                <code className={styles.folderPath}>{folder.path}</code>
                <span className={styles.folderPurpose}>{folder.purpose}</span>
              </li>
            ))}
          </ul>
        </Window>

        {/* Key Files */}
        <Window title="key_files.md" className={styles.keyFilesWindow}>
          <h2 className={styles.winHeading}>Key Files</h2>
          <ul className={styles.keyFilesList}>
            {analysis.keyFiles?.map(kf => (
              <li key={kf.file} className={styles.keyFileItem}>
                <code className={styles.keyFilePath}>{kf.file}</code>
                <p className={styles.keyFileDesc}>{kf.what_it_does}</p>
                {kf.why_important && (
                  <p className={styles.keyFileWhy}>Why it matters: {kf.why_important}</p>
                )}
              </li>
            ))}
          </ul>
        </Window>

        {/* Chat window */}
        <div className={styles.chatContainer}>
          <RepoChat owner={owner} repo={repo} />
        </div>
      </div>

      {/* CTA row */}
      <div className={styles.ctaRow}>
        <Button onClick={() => window.location.href = `/setup/${owner}/${repo}`} size="lg">
          Setup Guide →
        </Button>
        <Button onClick={() => window.location.href = `/issues`} variant="secondary" size="lg">
          Find Issues
        </Button>
      </div>
    </div>
  );
}

