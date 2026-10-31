/**
 * AI service — single abstraction layer supporting Groq and Anthropic Claude.
 * Automatically selects Groq if GROQ_API_KEY is configured.
 */
import Groq from 'groq-sdk';
import Anthropic from '@anthropic-ai/sdk';

let groqClient = null;
let anthropicClient = null;

function getProvider() {
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return 'groq'; // Default to groq
}

function getGroqClient() {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
  }
  return groqClient;
}

function getAnthropicClient() {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
  }
  return anthropicClient;
}

const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const DEFAULT_ANTHROPIC_MODEL = 'claude-3-haiku-20240307';
const DEFAULT_MAX_TOKENS = 2048;

/**
 * Send a prompt and return the text response.
 * Content inside <untrusted_content> tags is treated as data — the model is
 * instructed to ignore any instructions within it (prompt-injection defense).
 *
 * @param {object} opts
 * @param {string} [opts.system]      System prompt text
 * @param {Array}  opts.messages      Array of { role, content } message objects
 * @param {number} [opts.maxTokens]
 * @param {string} [opts.model]
 * @returns {Promise<string>}
 */
export async function chat({ system, messages, maxTokens, model }) {
  const provider = getProvider();

  if (provider === 'groq') {
    const groq = getGroqClient();
    const chatMessages = [];
    if (system) {
      chatMessages.push({ role: 'system', content: system });
    }
    chatMessages.push(...messages);

    const completion = await groq.chat.completions.create({
      model: model || DEFAULT_GROQ_MODEL,
      messages: chatMessages,
      max_tokens: maxTokens || DEFAULT_MAX_TOKENS,
      temperature: 0.2,
    });

    return completion.choices[0]?.message?.content || '';
  }

  // Anthropic fallback
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: model || DEFAULT_ANTHROPIC_MODEL,
    max_tokens: maxTokens || DEFAULT_MAX_TOKENS,
    system,
    messages,
  });

  return response.content[0]?.text || '';
}

/**
 * Parse a JSON response from the AI, with Zod validation.
 * Extracts JSON from markdown blocks or raw text.
 * Returns null if parsing/validation fails.
 *
 * @param {string}                responseText
 * @param {import('zod').ZodSchema} schema
 */
export function parseAiJson(responseText, schema) {
  if (!responseText) return null;

  // 1. Try markdown code blocks: ```json ... ``` or ``` ... ```
  const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let candidate = codeBlockMatch ? codeBlockMatch[1].trim() : responseText.trim();

  // 2. If candidate still has outer text, find outer brackets { ... } or [ ... ]
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidate = candidate.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(candidate);
    const result = schema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
