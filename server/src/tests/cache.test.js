import { cacheGet, cacheSet, makeCacheKey } from '../services/cache.js';

describe('Cache service', () => {
  test('makeCacheKey builds colon-separated keys', () => {
    const key = makeCacheKey('repo', 'facebook', 'react');
    expect(key).toBe('repo:facebook:react');
  });

  test('sets and gets value from in-memory L1 cache', async () => {
    const testKey = 'test:key:123';
    const testValue = { data: 'hello firstcommit', count: 42 };

    await cacheSet(testKey, testValue, 10000);
    const result = await cacheGet(testKey);

    expect(result).toEqual(testValue);
  });

  test('returns null for nonexistent keys', async () => {
    const result = await cacheGet('nonexistent:key:xyz');
    expect(result).toBeNull();
  });
});

