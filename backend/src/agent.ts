import { query } from '@anthropic-ai/claude-agent-sdk';

export interface RepoData {
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
}

export interface RepoAnalysis {
  summary: string;
  keyFeatures: string[];
  useCase: string;
  technicalStack: string[];
  potentialValue: string;
  category: 'framework' | 'library' | 'tool' | 'application' | 'research' | 'tutorial' | 'other';
}

const CLAUDE_MODEL = 'claude-haiku-4-5';

const SYSTEM_PROMPT = `You are an AI engineer summarizing GitHub repos for a "trending AI projects" feed.

For each repo, return a structured JSON analysis with:
- summary: one sentence (max 25 words) describing what it does in plain English.
- keyFeatures: 3-5 short bullet items (max 6 words each) — concrete capabilities, not marketing.
- useCase: the primary practical scenario where you'd reach for this.
- technicalStack: technologies/languages used (max 5).
- potentialValue: why a developer would care, 1 sentence.
- category: one of framework | library | tool | application | research | tutorial | other.

Rules:
- Be objective and concrete, not promotional.
- If info is sparse, infer carefully from topics/language but don't invent features.
- Output ONLY a single valid JSON object, no markdown fences, no prose around it.

Schema:
{
  "summary": "...",
  "keyFeatures": ["...", "..."],
  "useCase": "...",
  "technicalStack": ["..."],
  "potentialValue": "...",
  "category": "..."
}`;

export async function analyzeRepository(repo: RepoData): Promise<RepoAnalysis> {
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    return getFallbackAnalysis(repo);
  }

  const userPrompt = `Analyze this repository:

Name: ${repo.full_name}
Description: ${repo.description || 'No description provided'}
Language: ${repo.language || 'Not specified'}
Topics: ${repo.topics.join(', ') || 'none'}
Stars: ${repo.stargazers_count}
Forks: ${repo.forks_count}
Created: ${new Date(repo.created_at).toLocaleDateString()}
Last Updated: ${new Date(repo.updated_at).toLocaleDateString()}

Return JSON only.`;

  try {
    const response = query({
      prompt: userPrompt,
      options: {
        systemPrompt: SYSTEM_PROMPT,
        model: CLAUDE_MODEL,
        maxTurns: 1,
        allowedTools: [],
        permissionMode: 'default',
      },
    });

    for await (const msg of response) {
      if (msg.type === 'result') {
        if (msg.subtype !== 'success') {
          throw new Error(`Agent SDK error: ${msg.subtype}`);
        }
        const parsed = parseAnalysis(msg.result);
        if (parsed) return parsed;
        break;
      }
    }
    return getFallbackAnalysis(repo);
  } catch (error) {
    console.error('Error analyzing repository:', error);
    return getFallbackAnalysis(repo);
  }
}

function parseAnalysis(text: string): RepoAnalysis | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as RepoAnalysis;
  } catch {
    return null;
  }
}

function getFallbackAnalysis(repo: RepoData): RepoAnalysis {
  let category: RepoAnalysis['category'] = 'other';
  const topics = repo.topics.map((t) => t.toLowerCase());

  if (topics.some((t) => t.includes('framework'))) category = 'framework';
  else if (topics.some((t) => t.includes('library') || t.includes('lib'))) category = 'library';
  else if (topics.some((t) => t.includes('tool') || t.includes('cli'))) category = 'tool';
  else if (topics.some((t) => t.includes('app') || t.includes('application'))) category = 'application';
  else if (topics.some((t) => t.includes('research') || t.includes('paper'))) category = 'research';
  else if (topics.some((t) => t.includes('tutorial') || t.includes('learning'))) category = 'tutorial';

  return {
    summary: repo.description || `${repo.name} - An AI/ML project on GitHub`,
    keyFeatures:
      repo.topics.slice(0, 5).length > 0
        ? repo.topics.slice(0, 5)
        : ['Machine learning capabilities', 'Active development', 'Open source'],
    useCase: 'AI/ML development and research',
    technicalStack: repo.language ? [repo.language, ...repo.topics.slice(0, 3)] : repo.topics.slice(0, 4),
    potentialValue: `Popular repository with ${repo.stargazers_count} stars and ${repo.forks_count} forks, indicating strong community interest`,
    category,
  };
}
