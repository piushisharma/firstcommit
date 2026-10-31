/**
 * Centralized error handler.
 * Returns consistent JSON shape: { error: { code, message } }
 */
export function errorHandler(err, _req, res, _next) {
  console.error('[error]', err.message || err);

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.errors[0]?.message || 'Invalid input' },
    });
  }

  if (err.status === 404 || err.code === 'NOT_FOUND') {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: err.message || 'Not found' },
    });
  }

  if (err.status === 401 || err.code === 'UNAUTHORIZED') {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  // GitHub / Octokit rate limit errors (often returned as status 403 with 'rate limit' message or 429)
  if (
    err.status === 429 ||
    err.code === 'RATE_LIMITED' ||
    (err.status === 403 && (err.message?.includes('rate limit') || err.message?.includes('API rate limit')))
  ) {
    return res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'GitHub API rate limit reached. Make sure your GITHUB_TOKEN is set in .env to enjoy 5,000 requests/hour.',
      },
    });
  }

  if (err.status === 403 || err.code === 'FORBIDDEN') {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: err.message || 'Forbidden' },
    });
  }

  if (err.status === 429 || err.code === 'RATE_LIMITED') {
    return res.status(429).json({
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait a moment.' },
    });
  }

  // GitHub / Octokit errors
  if (err.status === 404 && err.name === 'HttpError') {
    return res.status(404).json({
      error: { code: 'REPO_NOT_FOUND', message: 'Repository not found or is private.' },
    });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: status === 500 ? 'Something went wrong. Please try again.' : err.message,
    },
  });
}
