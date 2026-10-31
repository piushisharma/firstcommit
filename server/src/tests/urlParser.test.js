import { parseGitHubUrl } from '../services/github.js';

describe('parseGitHubUrl', () => {
  test('parses a standard GitHub URL', () => {
    const result = parseGitHubUrl('https://github.com/facebook/react');
    expect(result).toEqual({ owner: 'facebook', repo: 'react' });
  });

  test('parses URL with trailing slash', () => {
    const result = parseGitHubUrl('https://github.com/vercel/next.js/');
    expect(result).toEqual({ owner: 'vercel', repo: 'next.js' });
  });

  test('parses URL with .git suffix', () => {
    const result = parseGitHubUrl('https://github.com/torvalds/linux.git');
    expect(result).toEqual({ owner: 'torvalds', repo: 'linux' });
  });

  test('rejects non-GitHub URL', () => {
    expect(() => parseGitHubUrl('https://gitlab.com/user/repo')).toThrow();
  });

  test('rejects a plain URL', () => {
    expect(() => parseGitHubUrl('https://example.com')).toThrow();
  });
});
