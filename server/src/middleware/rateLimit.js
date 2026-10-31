import rateLimit from 'express-rate-limit';

export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
  skip: (req) => req.path === '/health',
});

export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'AI request limit reached. Please wait a minute.' } },
});
