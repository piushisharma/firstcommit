import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Window from '../components/Window.jsx';
import Skeleton from '../components/Skeleton.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Toast from '../components/Toast.jsx';
import { api } from '../lib/api.js';
import styles from './Roadmap.module.css';

function useRoadmap(id) {
  return useQuery({
    queryKey: ['roadmap', id],
    queryFn: () => api.getRoadmap(id),
    staleTime: 0,
  });
}

export default function Roadmap() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useRoadmap(id);
  const [toastMessage, setToastMessage] = useState('');

  const toggleStep = useMutation({
    mutationFn: ({ stepId, done }) => api.updateStep(id, stepId, done),
    onMutate: async ({ stepId, done }) => {
      await queryClient.cancelQueries({ queryKey: ['roadmap', id] });
      const prev = queryClient.getQueryData(['roadmap', id]);
      if (prev && prev.roadmap_steps) {
        queryClient.setQueryData(['roadmap', id], old => ({
          ...old,
          roadmap_steps: old.roadmap_steps.map(s => s.id === stepId ? { ...s, done } : s),
        }));
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['roadmap', id], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['roadmap', id] }),
  });

  function copyText(text) {
    navigator.clipboard.writeText(text).then(() => {
      setToastMessage('copied!');
    });
  }

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Skeleton width="250px" height="28px" />
        <Window title="roadmap.checklist">
          <div className={styles.loadingList}>
            {[1,2,3,4,5].map(n => <Skeleton key={n} height="52px" />)}
          </div>
        </Window>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.page}>
        <Window title="error.txt">
          <ErrorState code={error?.code} message={error?.message} />
        </Window>
      </div>
    );
  }

  const steps = [...(data.roadmap_steps || [])].sort((a, b) => a.position - b.position);
  const doneCount = steps.filter(s => s.done).length;
  const progress = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const completed = progress === 100;

  const prTitle = `fix: resolve issue #${data.issue_number || 1} in ${data.repo}`;
  const commitMsg = `fix: resolve ${data.title.toLowerCase()}\n\nCloses #${data.issue_number || 1}`;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{data.title}</h1>
      <p className={styles.meta}>{data.owner}/{data.repo}</p>

      {/* Progress */}
      <Window title="progress.bar">
        <div className={styles.progressWrap}>
          <div className={styles.progressLabel}>
            <span>{doneCount} of {steps.length} steps done</span>
            <span className={styles.progressPct}>{progress}%</span>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Roadmap progress"
          >
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {completed && (
          <div className={styles.celebration} role="status" aria-live="polite">
            <span className={styles.celebrationIcon} aria-hidden="true">🎉</span>
            <div>
              <strong>You did it!</strong> You&rsquo;ve completed your first contribution roadmap.
              Time to open that PR!
            </div>
          </div>
        )}
      </Window>

      {/* Helper snippets: PR title & commit message */}
      <Window title="git_helpers.txt">
        <div className={styles.helperSection}>
          <div className={styles.helperItem}>
            <span className={styles.helperLabel}>Suggested PR Title:</span>
            <div className={styles.helperBox}>
              <code>{prTitle}</code>
              <button
                className={styles.copyBtn}
                onClick={() => copyText(prTitle)}
                aria-label="Copy suggested PR title"
              >
                Copy
              </button>
            </div>
          </div>

          <div className={styles.helperItem}>
            <span className={styles.helperLabel}>Suggested Commit Message:</span>
            <div className={styles.helperBox}>
              <pre><code>{commitMsg}</code></pre>
              <button
                className={styles.copyBtn}
                onClick={() => copyText(commitMsg)}
                aria-label="Copy suggested commit message"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </Window>

      {/* Checklist */}
      <Window title="contribution_checklist.md">
        <ol className={styles.checklist} aria-label="Contribution steps">
          {steps.map(step => (
            <li key={step.id} className={`${styles.checkItem} ${step.done ? styles.done : ''}`}>
              <button
                className={styles.checkbox}
                onClick={() => toggleStep.mutate({ stepId: step.id, done: !step.done })}
                aria-checked={step.done}
                role="checkbox"
                aria-label={step.done ? `Uncheck: ${step.title}` : `Check: ${step.title}`}
              >
                {step.done ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                    <rect x="1" y="1" width="12" height="12" fill="var(--badge-easy)" stroke="var(--maroon)" strokeWidth="1.5"/>
                    <path d="M3 7 L6 10 L11 4" stroke="var(--maroon)" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                    <rect x="1" y="1" width="12" height="12" fill="none" stroke="var(--maroon)" strokeWidth="1.5"/>
                  </svg>
                )}
              </button>
              <div className={styles.checkContent}>
                <strong className={styles.checkTitle}>{step.title}</strong>
                {step.description && (
                  <p className={styles.checkDesc}>{step.description}</p>
                )}
                {step.done_at && (
                  <span className={styles.checkTime}>
                    Done {new Date(step.done_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Window>

      <Toast visible={!!toastMessage} message={toastMessage} onHide={() => setToastMessage('')} />
    </div>
  );
}

