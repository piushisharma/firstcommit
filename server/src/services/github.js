import { Octokit } from '@octokit/rest';
import { cacheGet, cacheSet, makeCacheKey } from './cache.js';

let octokit = null;

function getOctokit() {
  if (!octokit) {
    const token = process.env.GITHUB_TOKEN?.trim();
    octokit = new Octokit({
      ...(token ? { auth: token } : {}),
      userAgent: 'FirstCommit/1.0',
    });
  }
  return octokit;
}

const MAX_FILE_BYTES = 100 * 1024; // 100 KB
const MAX_TREE_ITEMS = 500;

/**
 * Parse a GitHub URL into { owner, repo }.
 */
export function parseGitHubUrl(url) {
  const match = url.match(
    /^https?:\/\/github\.com\/([a-zA-Z0-9_-]{1,39})\/([a-zA-Z0-9_.-]{1,100}?)(\/|\.git)?(\?.*)?$/
  );
  if (!match) throw Object.assign(new Error('Not a valid GitHub repository URL'), { status: 400, code: 'INVALID_URL' });
  return { owner: match[1], repo: match[2] };
}

/**
 * Fetch repository metadata.
 */
export async function getRepo(owner, repo) {
  const key = makeCacheKey('repo', owner, repo);
  const cached = await cacheGet(key);
  if (cached) return cached;

  const { data } = await getOctokit().repos.get({ owner, repo });
  const result = {
    owner: data.owner.login,
    repo: data.name,
    description: data.description,
    language: data.language,
    topics: data.topics || [],
    stars: data.stargazers_count,
    forks: data.forks_count,
    openIssues: data.open_issues_count,
    defaultBranch: data.default_branch,
    htmlUrl: data.html_url,
    pushedAt: data.pushed_at,
    license: data.license?.name,
  };

  await cacheSet(key, result, 10 * 60 * 1000); // 10 min
  return result;
}

/**
 * Fetch file content as UTF-8 string. Returns null if file too large or binary.
 */
export async function getFileContent(owner, repo, path, ref) {
  const key = makeCacheKey('file', owner, repo, ref || 'HEAD', path);
  const cached = await cacheGet(key);
  if (cached) return cached;

  try {
    const { data } = await getOctokit().repos.getContent({ owner, repo, path, ref });
    if (Array.isArray(data)) return null; // it's a directory
    if (data.encoding !== 'base64') return null;

    const bytes = Buffer.from(data.content, 'base64');
    if (bytes.length > MAX_FILE_BYTES) {
      // Return truncated content with notice
      const truncated = bytes.slice(0, MAX_FILE_BYTES).toString('utf8') +
        '\n\n[... file truncated for size ...]';
      await cacheSet(key, truncated, 30 * 60 * 1000);
      return truncated;
    }

    const content = bytes.toString('utf8');
    await cacheSet(key, content, 30 * 60 * 1000);
    return content;
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

/**
 * Fetch the git tree (flat file list).
 */
export async function getRepoTree(owner, repo, ref) {
  const key = makeCacheKey('tree', owner, repo, ref || 'HEAD');
  const cached = await cacheGet(key);
  if (cached) return cached;

  const repoData = await getRepo(owner, repo);
  const branch = ref || repoData.defaultBranch || 'HEAD';

  // GitHub getTree accepts branch name, commit sha, or 'HEAD' directly as tree_sha
  let data;
  try {
    const res = await getOctokit().git.getTree({
      owner, repo, tree_sha: branch, recursive: 'true',
    });
    data = res.data;
  } catch (err) {
    if (branch !== 'HEAD') {
      const res = await getOctokit().git.getTree({
        owner, repo, tree_sha: 'HEAD', recursive: 'true',
      });
      data = res.data;
    } else {
      throw err;
    }
  }

  const items = (data.tree || [])
    .filter(i => i.type === 'blob')
    .slice(0, MAX_TREE_ITEMS)
    .map(i => ({ path: i.path, size: i.size || 0, sha: i.sha }));

  const result = { sha: data.sha, items, truncated: data.truncated };
  await cacheSet(key, result, 15 * 60 * 1000); // 15 min
  return result;
}

/**
 * Fetch a list of key files (README, package.json, etc.).
 */
export async function getKeyFiles(owner, repo, branch) {
  const candidates = [
    'README.md', 'readme.md', 'README.rst', 'README',
    'package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod',
    'requirements.txt', 'Gemfile', 'composer.json',
    'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
    'CONTRIBUTING.md', 'CONTRIBUTING', '.env.example', 'Makefile',
  ];

  const results = {};
  await Promise.allSettled(
    candidates.map(async (p) => {
      const content = await getFileContent(owner, repo, p, branch);
      if (content) results[p] = content.slice(0, 8000); // cap per file
    })
  );
  return results;
}

/**
 * Search GitHub for beginner-friendly issues.
 */
export async function searchGoodFirstIssues({ language, label, page = 1 }) {
  const labels = label
    ? [label]
    : ['good first issue', 'help wanted', 'beginner friendly', 'easy', 'starter'];

  const labelQuery = labels.map(l => `label:"${l}"`).join(' OR ');
  const langQuery  = language ? ` language:${language}` : '';
  const q = `is:open is:issue (${labelQuery})${langQuery} no:assignee`;

  const key = makeCacheKey('issues-search', q, page);
  const cached = await cacheGet(key);
  if (cached) return cached;

  const { data } = await getOctokit().search.issuesAndPullRequests({
    q,
    sort: 'created',
    order: 'desc',
    per_page: 20,
    page,
  });

  const result = {
    total: data.total_count,
    items: data.items.map(i => ({
      id: i.id,
      number: i.number,
      title: i.title,
      url: i.html_url,
      repoUrl: i.repository_url.replace('https://api.github.com/repos/', 'https://github.com/'),
      owner: i.repository_url.split('/').at(-2),
      repo:  i.repository_url.split('/').at(-1),
      labels: i.labels.map(l => l.name),
      comments: i.comments,
      createdAt: i.created_at,
      updatedAt: i.updated_at,
      body: (i.body || '').slice(0, 1000),
    })),
  };

  await cacheSet(key, result, 5 * 60 * 1000); // 5 min
  return result;
}

/**
 * Fetch a single issue with its comments.
 */
export async function getIssue(owner, repo, issueNumber) {
  const key = makeCacheKey('issue', owner, repo, issueNumber);
  const cached = await cacheGet(key);
  if (cached) return cached;

  const [issueRes, commentsRes] = await Promise.all([
    getOctokit().issues.get({ owner, repo, issue_number: issueNumber }),
    getOctokit().issues.listComments({ owner, repo, issue_number: issueNumber, per_page: 10 }),
  ]);

  const result = {
    number: issueRes.data.number,
    title: issueRes.data.title,
    body: (issueRes.data.body || '').slice(0, 4000),
    labels: issueRes.data.labels.map(l => l.name),
    url: issueRes.data.html_url,
    comments: commentsRes.data.slice(0, 5).map(c => ({
      body: (c.body || '').slice(0, 1000),
      author: c.user?.login,
    })),
  };

  await cacheSet(key, result, 10 * 60 * 1000);
  return result;
}
