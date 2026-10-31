import { z } from 'zod';
import { parseGitHubUrl, getRepo, getRepoTree as githubGetTree, getFileContent, getKeyFiles } from '../services/github.js';
import { chat, parseAiJson } from '../services/ai.js';
import { cacheGet, cacheSet, makeCacheKey } from '../services/cache.js';
import { buildRepoAnalysisPrompt, PROMPT_VERSION as ANALYZE_V } from '../prompts/repoAnalysis.js';
import { buildFileExplanationPrompt, PROMPT_VERSION as FILE_V } from '../prompts/fileExplanation.js';
import { buildSetupGuidePrompt, PROMPT_VERSION as SETUP_V } from '../prompts/setupGuide.js';
import { buildChatSystemPrompt } from '../prompts/chat.js';

const analyzeSchema = z.object({
  summary: z.string(),
  techStack: z.array(z.object({ name: z.string(), role: z.string(), beginner_tip: z.string().optional() })),
  folderStructure: z.array(z.object({ path: z.string(), purpose: z.string() })),
  keyFiles: z.array(z.object({ file: z.string(), what_it_does: z.string(), why_important: z.string().optional() })),
  howItConnects: z.string(),
  difficultyLevel: z.enum(['Easy', 'Medium', 'Hard']),
  goodFor: z.array(z.string()),
  contributingTip: z.string(),
});

export async function analyzeRepo(req, res, next) {
  try {
    const { url } = req.body;
    const { owner, repo } = parseGitHubUrl(url);

    // Try cache first
    const cacheKey = makeCacheKey('analyze', owner, repo, ANALYZE_V);
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ cached: true, owner, repo, ...cached });

    // Fetch data
    const [repoData, keyFiles] = await Promise.all([
      getRepo(owner, repo),
      getKeyFiles(owner, repo),
    ]);

    // Build prompt and call AI
    const prompt = buildRepoAnalysisPrompt(repoData, keyFiles);
    const aiText = await chat(prompt);
    const analysis = parseAiJson(aiText, analyzeSchema);

    if (!analysis) {
      return res.status(502).json({
        error: { code: 'AI_PARSE_ERROR', message: 'AI returned unexpected format. Please try again.' },
      });
    }

    const result = { owner, repo, repoData, analysis };
    await cacheSet(cacheKey, result, 2 * 60 * 60 * 1000); // 2h
    res.json({ cached: false, owner, repo, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getRepoTree(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const tree = await githubGetTree(owner, repo);
    res.json(tree);
  } catch (err) {
    next(err);
  }
}

const fileExplSchema = z.object({
  what_it_does: z.string(),
  key_parts: z.array(z.object({ name: z.string(), line_hint: z.string().optional(), explanation: z.string() })),
  how_it_connects: z.string(),
  beginner_tips: z.array(z.string()),
  complexity: z.enum(['Simple', 'Moderate', 'Complex']),
  complexity_reason: z.string(),
});

export async function getFileExplanation(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const { path } = req.query;

    // Fetch file content
    const content = await getFileContent(owner, repo, path);
    if (!content) {
      return res.status(404).json({ error: { code: 'FILE_NOT_FOUND', message: 'File not found or is binary.' } });
    }

    // Cache key includes content hash (first 200 chars as proxy)
    const cacheKey = makeCacheKey('file-expl', owner, repo, path, FILE_V, content.slice(0, 200));
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ cached: true, path, content, explanation: cached });

    const repoData = await getRepo(owner, repo);
    const prompt = buildFileExplanationPrompt(path, content, repoData);
    const aiText = await chat(prompt);
    const explanation = parseAiJson(aiText, fileExplSchema);

    if (!explanation) {
      return res.json({ cached: false, path, content, explanation: null });
    }

    await cacheSet(cacheKey, explanation, 4 * 60 * 60 * 1000); // 4h
    res.json({ cached: false, path, content, explanation });
  } catch (err) {
    next(err);
  }
}

const setupSchema = z.object({
  steps: z.array(z.object({
    number: z.number(),
    title: z.string(),
    explanation: z.string(),
    commands: z.array(z.string()),
    note: z.string().optional(),
  })),
  envVars: z.array(z.object({ name: z.string(), description: z.string(), required: z.boolean().optional(), example: z.string().optional() })).optional(),
  commonErrors: z.array(z.object({ error: z.string(), cause: z.string(), fix: z.string() })).optional(),
  estimatedTime: z.string().optional(),
  prerequisites: z.array(z.string()).optional(),
});

export async function getSetupGuide(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const cacheKey = makeCacheKey('setup', owner, repo, SETUP_V);
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ cached: true, owner, repo, guide: cached });

    const [repoData, keyFiles] = await Promise.all([
      getRepo(owner, repo),
      getKeyFiles(owner, repo),
    ]);

    const prompt = buildSetupGuidePrompt(repoData, keyFiles);
    const aiText = await chat(prompt);
    const guide = parseAiJson(aiText, setupSchema);

    if (!guide) {
      return res.status(502).json({ error: { code: 'AI_PARSE_ERROR', message: 'Could not generate setup guide.' } });
    }

    await cacheSet(cacheKey, guide, 4 * 60 * 60 * 1000);
    res.json({ cached: false, owner, repo, guide });
  } catch (err) {
    next(err);
  }
}

export async function chatWithRepo(req, res, next) {
  try {
    const { owner, repo } = req.params;
    const { messages } = req.body;

    const [repoData, keyFiles] = await Promise.all([
      getRepo(owner, repo),
      getKeyFiles(owner, repo),
    ]);

    const repoContext = Object.entries(keyFiles)
      .slice(0, 3)
      .map(([name, content]) => `--- ${name} ---\n${content.slice(0, 2000)}`)
      .join('\n\n');

    const system = buildChatSystemPrompt(repoData, repoContext);
    const response = await chat({ system, messages, maxTokens: 1024 });

    res.json({ response });
  } catch (err) {
    next(err);
  }
}
