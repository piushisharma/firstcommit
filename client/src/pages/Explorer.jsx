import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Window from '../components/Window.jsx';
import Skeleton from '../components/Skeleton.jsx';
import ErrorState from '../components/ErrorState.jsx';
import DifficultyBadge from '../components/DifficultyBadge.jsx';
import { api } from '../lib/api.js';
import styles from './Explorer.module.css';

function buildTree(items) {
  const root = {};
  items.forEach(item => {
    const parts = item.path.split('/');
    let node = root;
    parts.forEach((part, i) => {
      if (!node[part]) node[part] = { __isFile: i === parts.length - 1, __item: item, __children: {} };
      node = node[part].__children;
    });
  });
  return root;
}

function FileTreeNode({ node, name, depth, onSelect, selectedPath }) {
  const [open, setOpen] = useState(depth < 2);
  const isFile = node.__isFile;
  const hasChildren = Object.keys(node.__children || {}).length > 0;
  const path = node.__item?.path;

  if (isFile) {
    return (
      <li>
        <button
          className={`${styles.treeFile} ${selectedPath === path ? styles.selected : ''}`}
          onClick={() => onSelect(path)}
          aria-current={selectedPath === path ? 'true' : undefined}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <span aria-hidden="true">📄</span>
          <span className={styles.treeName}>{name}</span>
        </button>
      </li>
    );
  }

  return (
    <li>
      <button
        className={styles.treeDir}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
        <span className={styles.treeName}>{name}</span>
      </button>
      {open && hasChildren && (
        <ul className={styles.treeChildren}>
          {Object.entries(node.__children).sort(([,a],[,b]) => {
            if (!a.__isFile && b.__isFile) return -1;
            if (a.__isFile && !b.__isFile) return 1;
            return 0;
          }).map(([childName, childNode]) => (
            <FileTreeNode
              key={childName}
              node={childNode}
              name={childName}
              depth={depth + 1}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function FileTree({ items, onSelect, selectedPath }) {
  const tree = buildTree(items);
  return (
    <nav aria-label="File tree">
      <ul className={styles.tree}>
        {Object.entries(tree).sort(([,a],[,b]) => {
          if (!a.__isFile && b.__isFile) return -1;
          if (a.__isFile && !b.__isFile) return 1;
          return 0;
        }).map(([name, node]) => (
          <FileTreeNode key={name} node={node} name={name} depth={0} onSelect={onSelect} selectedPath={selectedPath} />
        ))}
      </ul>
    </nav>
  );
}

export default function Explorer() {
  const { owner, repo } = useParams();
  const [selectedPath, setSelectedPath] = useState(null);

  const { data: treeData, isLoading: treeLoading, isError: treeError } = useQuery({
    queryKey: ['tree', owner, repo],
    queryFn: () => api.getTree(owner, repo),
    staleTime: 15 * 60 * 1000,
  });

  const { data: fileData, isLoading: fileLoading, isError: fileError } = useQuery({
    queryKey: ['file', owner, repo, selectedPath],
    queryFn: () => api.getFile(owner, repo, selectedPath),
    enabled: !!selectedPath,
    staleTime: 60 * 60 * 1000,
  });

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>{owner}/{repo} — File Explorer</h1>

      <div className={styles.layout}>
        {/* File tree */}
        <Window title="file_tree.dir" className={styles.treeWindow} noPad>
          <div className={styles.treeHeader}>
            <span className={styles.treeHeaderText}>Files</span>
            {treeData?.truncated && (
              <span className={styles.treeWarning} role="note">Tree truncated (large repo)</span>
            )}
          </div>

          {treeLoading && (
            <div className={styles.treePad}>
              {[1,2,3,4,5].map(n => <Skeleton key={n} height="20px" />)}
            </div>
          )}

          {treeError && (
            <div className={styles.treePad}>
              <ErrorState code="DEFAULT" message="Could not load file tree." />
            </div>
          )}

          {treeData && (
            <FileTree
              items={treeData.items}
              onSelect={setSelectedPath}
              selectedPath={selectedPath}
            />
          )}
        </Window>

        {/* File detail */}
        <div className={styles.detail}>
          {!selectedPath && (
            <Window title="select_a_file.txt">
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon} aria-hidden="true">👈</span>
                <p>Click any file in the tree to see an AI explanation and the code.</p>
              </div>
            </Window>
          )}

          {selectedPath && fileLoading && (
            <Window title={selectedPath}>
              <Skeleton height="100px" />
              <div style={{ marginTop: '16px' }}>
                <Skeleton height="16px" />
                <div style={{ marginTop: '8px' }}><Skeleton height="16px" width="80%" /></div>
              </div>
            </Window>
          )}

          {selectedPath && fileError && (
            <Window title={selectedPath || 'error.txt'}>
              <ErrorState code="FILE_NOT_FOUND" message="Could not load this file." />
            </Window>
          )}

          {selectedPath && fileData && (
            <>
              <Window title={`explanation_${selectedPath.split('/').pop()}`}>
                {fileData.explanation ? (
                  <div className={styles.explanation}>
                    <div className={styles.explHeader}>
                      <h2 className={styles.explTitle}>What this file does</h2>
                      <DifficultyBadge level={fileData.explanation.complexity === 'Simple' ? 'Easy' : fileData.explanation.complexity === 'Complex' ? 'Hard' : 'Medium'} />
                    </div>
                    <p className={styles.explText}>{fileData.explanation.what_it_does}</p>

                    {fileData.explanation.how_it_connects && (
                      <div className={styles.explSection}>
                        <h3 className={styles.explSubheading}>How it connects</h3>
                        <p className={styles.explText}>{fileData.explanation.how_it_connects}</p>
                      </div>
                    )}

                    {fileData.explanation.key_parts?.length > 0 && (
                      <div className={styles.explSection}>
                        <h3 className={styles.explSubheading}>Key parts</h3>
                        <ul className={styles.partsList}>
                          {fileData.explanation.key_parts.map((part, i) => (
                            <li key={i} className={styles.partItem}>
                              <code className={styles.partName}>{part.name}</code>
                              <span>{part.explanation}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {fileData.explanation.beginner_tips?.length > 0 && (
                      <div className={styles.tipBox}>
                        <strong>💡 Tips for beginners:</strong>
                        <ul>
                          {fileData.explanation.beginner_tips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className={styles.noExpl}>AI explanation unavailable for this file type.</p>
                )}
              </Window>

              <Window title={selectedPath} style={{ marginTop: 'var(--sp-5)' }}>
                <pre className={styles.codeBlock}>
                  <code>{fileData.content}</code>
                </pre>
              </Window>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

