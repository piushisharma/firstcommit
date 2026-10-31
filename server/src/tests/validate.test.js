import { z } from 'zod';

// Test the Zod schemas used in routes
describe('Zod route schemas', () => {
  const repoParamSchema = z.object({
    owner: z.string().regex(/^[a-zA-Z0-9_-]+$/).max(39),
    repo:  z.string().regex(/^[a-zA-Z0-9_.-]+$/).max(100),
  });

  test('accepts valid owner/repo', () => {
    const result = repoParamSchema.safeParse({ owner: 'facebook', repo: 'react' });
    expect(result.success).toBe(true);
  });

  test('rejects owner with special chars', () => {
    const result = repoParamSchema.safeParse({ owner: 'hack; DROP TABLE', repo: 'repo' });
    expect(result.success).toBe(false);
  });

  test('rejects missing repo', () => {
    const result = repoParamSchema.safeParse({ owner: 'facebook' });
    expect(result.success).toBe(false);
  });

  const analyzeBodySchema = z.object({
    url: z.string().url().includes('github.com'),
  });

  test('accepts a valid GitHub URL', () => {
    expect(analyzeBodySchema.safeParse({ url: 'https://github.com/facebook/react' }).success).toBe(true);
  });

  test('rejects non-GitHub URL', () => {
    expect(analyzeBodySchema.safeParse({ url: 'https://evil.com/inject' }).success).toBe(false);
  });
});
