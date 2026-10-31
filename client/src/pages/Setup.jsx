import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Window from '../components/Window.jsx';
import Button from '../components/Button.jsx';
import Skeleton from '../components/Skeleton.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Toast from '../components/Toast.jsx';
import { api } from '../lib/api.js';
import styles from './Setup.module.css';

function CodeBlock({ command }) {
  const [toastVisible, setToastVisible] = useState(false);

  function copy() {
    navigator.clipboard.writeText(command).then(() => setToastVisible(true));
  }

  return (
    <div className={styles.codeWrap}>
      <pre className={styles.code}><code>{command}</code></pre>
      <button className={styles.copyBtn} onClick={copy} aria-label={`Copy command: ${command}`}>
        Copy
      </button>
      <Toast visible={toastVisible} onHide={() => setToastVisible(false)} />
    </div>
  );
}

export default function Setup() {
  const { owner, repo } = useParams();
  const [activeStep, setActiveStep] = useState(0);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['setup', owner, repo],
    queryFn: () => api.getSetup(owner, repo),
    staleTime: 4 * 60 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className={styles.page}>
        <Skeleton width="300px" height="28px" />
        <Window title="setup_guide.sh">
          <div className={styles.loadingGrid}>
            {[1,2,3].map(n => <Skeleton key={n} height="80px" />)}
          </div>
        </Window>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.page}>
        <Window title="error.txt">
          <ErrorState code={error?.code} message={error?.message} onRetry={refetch} />
        </Window>
      </div>
    );
  }

  const { guide } = data;

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to={`/explain/${owner}/${repo}`}>{owner}/{repo}</Link>
        <span aria-hidden="true"> › </span>
        <span>Setup Guide</span>
      </nav>

      <h1 className={styles.heading}>Setup Guide: {owner}/{repo}</h1>

      {guide.estimatedTime && (
        <p className={styles.estimate}>⏱ Estimated time: {guide.estimatedTime}</p>
      )}

      {guide.prerequisites?.length > 0 && (
        <Window title="prerequisites.txt">
          <h2 className={styles.sectionHeading}>Prerequisites</h2>
          <ul className={styles.prereqList}>
            {guide.prerequisites.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </Window>
      )}

      <div className={styles.stepper}>
        {/* Step indicators */}
        <ol className={styles.stepNav} aria-label="Setup steps">
          {guide.steps.map((step, i) => (
            <li key={step.number}>
              <button
                className={`${styles.stepDot} ${i === activeStep ? styles.active : ''} ${i < activeStep ? styles.done : ''}`}
                onClick={() => setActiveStep(i)}
                aria-label={`Step ${step.number}: ${step.title}`}
                aria-current={i === activeStep ? 'step' : undefined}
              >
                {i < activeStep ? '✓' : step.number}
              </button>
            </li>
          ))}
        </ol>

        {/* Active step */}
        {guide.steps[activeStep] && (
          <Window title={`step_${activeStep + 1}.sh`} key={activeStep}>
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>
                Step {guide.steps[activeStep].number}: {guide.steps[activeStep].title}
              </h2>
              <p className={styles.stepExpl}>{guide.steps[activeStep].explanation}</p>

              {guide.steps[activeStep].commands.map((cmd, i) => (
                <CodeBlock key={i} command={cmd} />
              ))}

              {guide.steps[activeStep].note && (
                <div className={styles.noteBox}>
                  💡 {guide.steps[activeStep].note}
                </div>
              )}

              <div className={styles.stepNav2}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveStep(s => Math.max(0, s - 1))}
                  disabled={activeStep === 0}
                >
                  ← Previous
                </Button>
                <Button
                  size="sm"
                  onClick={() => setActiveStep(s => Math.min(guide.steps.length - 1, s + 1))}
                  disabled={activeStep === guide.steps.length - 1}
                >
                  Next →
                </Button>
              </div>
            </div>
          </Window>
        )}
      </div>

      {/* Common errors */}
      {guide.commonErrors?.length > 0 && (
        <Window title="common_errors.md">
          <h2 className={styles.sectionHeading}>Common Errors & Fixes</h2>
          <ul className={styles.errorList}>
            {guide.commonErrors.map((e, i) => (
              <li key={i} className={styles.errorItem}>
                <strong className={styles.errorTitle}>{e.error}</strong>
                <p className={styles.errorCause}><em>Why:</em> {e.cause}</p>
                <p className={styles.errorFix}>✅ <em>Fix:</em> {e.fix}</p>
              </li>
            ))}
          </ul>
        </Window>
      )}

      {/* Env vars */}
      {guide.envVars?.length > 0 && (
        <Window title="env_vars.env">
          <h2 className={styles.sectionHeading}>Environment Variables</h2>
          <table className={styles.envTable}>
            <thead>
              <tr>
                <th>Variable</th>
                <th>Description</th>
                <th>Required</th>
                <th>Example</th>
              </tr>
            </thead>
            <tbody>
              {guide.envVars.map(v => (
                <tr key={v.name}>
                  <td><code>{v.name}</code></td>
                  <td>{v.description}</td>
                  <td>{v.required ? '✅' : '⬜'}</td>
                  <td><code>{v.example || '—'}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Window>
      )}
    </div>
  );
}

