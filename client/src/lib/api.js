/**
 * API client — thin wrapper over fetch.
 * All requests go to the Express server via /api/v1.
 */
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  // Attach Supabase JWT if available
  try {
    const { supabase } = await import('./supabase.js');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      opts.headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch {
    // Supabase not configured — skip auth header
  }

  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const error = new Error(err?.error?.message || `Request failed: ${res.status}`);
    error.code = err?.error?.code || 'UNKNOWN';
    error.status = res.status;
    throw error;
  }

  return res.json();
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  patch:  (path, body)  => request('PATCH',  path, body),
  delete: (path)        => request('DELETE', path),

  // Convenience
  analyzeRepo:  (url)              => request('POST', '/repos/analyze', { url }),
  getTree:      (owner, repo)      => request('GET',  `/repos/${owner}/${repo}/tree`),
  getFile:      (owner, repo, path)=> request('GET',  `/repos/${owner}/${repo}/file?path=${encodeURIComponent(path)}`),
  getSetup:     (owner, repo)      => request('POST', `/repos/${owner}/${repo}/setup-guide`),
  chat:         (owner, repo, messages) => request('POST', `/repos/${owner}/${repo}/chat`, { messages }),
  getIssues:    (params)           => request('GET',  `/issues?${new URLSearchParams(params)}`),
  analyzeIssue: (owner, repo, number) => request('POST', '/issues/analyze', { owner, repo, number }),
  createRoadmap:(body)             => request('POST', '/roadmaps', body),
  getRoadmap:   (id)               => request('GET',  `/roadmaps/${id}`),
  updateStep:   (id, stepId, done) => request('PATCH', `/roadmaps/${id}/steps/${stepId}`, { done }),
  getSavedRepos:()                 => request('GET',  '/saved/repos'),
  saveRepo:     (body)             => request('POST', '/saved/repos', body),
  deleteSavedRepo:(owner, repo)    => request('DELETE',`/saved/repos/${owner}/${repo}`),
  getSavedIssues:()                => request('GET',  '/saved/issues'),
  saveIssue:    (body)             => request('POST', '/saved/issues', body),
  deleteSavedIssue:(id)            => request('DELETE',`/saved/issues/${id}`),
};
