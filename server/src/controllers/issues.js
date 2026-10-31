import { z } from 'zod';
import { searchGoodFirstIssues, getIssue, getRepo } from '../services/github.js';
import { chat, parseAiJson } from '../services/ai.js';
import { cacheGet, cacheSet, makeCacheKey } from '../services/cache.js';
import { buildIssueAnalysisPrompt, PROMPT_VERSION } from '../prompts/issueAnalysis.js';

const issueAnalysisSchema = z.object({
  what_the_problem_is: z.string(),
  what_you_need_to_do: z.string(),
  likely_files: z.array(z.object({ path: z.string(), reason: z.string() })),
  suggested_approach: z.array(z.string()),
  skills_needed: z.array(z.string()),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  difficulty_reason: z.string(),
  estimated_time: z.string(),
  pr_title_suggestion: z.string(),
  commit_message_suggestion: z.string(),
});

export async function searchIssues(req, res, next) {
  try {
    const { language, label, page } = req.query;
    const issues = await searchGoodFirstIssues({ language, label, page: Number(page) || 1 });
    res.json(issues);
  } catch (err) {
    next(err);
  }
}

export async function analyzeIssue(req, res, next) {
  try {
    const { owner, repo, number } = req.body;
    const cacheKey = makeCacheKey('issue-analysis', owner, repo, number, PROMPT_VERSION);
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ cached: true, analysis: cached });

    const [issue, repoData] = await Promise.all([
      getIssue(owner, repo, number),
      getRepo(owner, repo),
    ]);

    const prompt = buildIssueAnalysisPrompt(issue, repoData);
    const aiText = await chat(prompt);
    const analysis = parseAiJson(aiText, issueAnalysisSchema);

    if (!analysis) {
      return res.status(502).json({ error: { code: 'AI_PARSE_ERROR', message: 'Could not analyze issue.' } });
    }

    await cacheSet(cacheKey, analysis, 6 * 60 * 60 * 1000);
    res.json({ cached: false, issue, analysis });
  } catch (err) {
    next(err);
  }
}
