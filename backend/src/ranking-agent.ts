import { query } from '@anthropic-ai/claude-agent-sdk';

export interface SpikeMetrics {
  velocityStarsPerDay: number;
  velocityForksPerDay: number;
  combinedVelocity: number;
  spikeScore: number;
  isSpike: boolean;
  ageInDays: number;
  daysSinceLastPush: number;
}

export interface RepoForRanking {
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  spikeMetrics?: SpikeMetrics;
}

export interface TopRepo {
  repo: string;
  badge: 'innovation' | 'production' | 'learning' | 'community' | 'research' | 'rising-star';
  score: number;
}

export interface RankingResult {
  top_3: TopRepo[];
}

const CLAUDE_MODEL = 'claude-haiku-4-5';

const SYSTEM_PROMPT = `You are a senior AI engineer ranking GitHub repos for a "what's hot in AI right now" feed.

# TASK
Pick the TOP 3 from the list and assign each a DIFFERENT badge.

# BADGES (each can be used at most once)
- innovation:  novel idea, unusual technique, paper-to-code, breaks a status quo.
- production:  battle-tested, ships well, real APIs/SDKs, deployed by teams.
- learning:    excellent for understanding a topic — clear docs, examples, tutorial-shaped.
- community:   strong, active community, many contributors, vibrant discussions.
- research:    cutting-edge research code, model weights, reproductions of recent papers.
- rising-star: sudden growth spike. ALWAYS prefer this badge for repos marked Spike: YES.

# SCORING (0-100)
Compose the final score from these weighted components:
- Innovation / novelty       (0-40)
- Engineering quality        (0-25)  — based on description clarity, language, topics
- Practical value            (0-20)  — does it solve a real problem an engineer cares about
- Traction / momentum        (0-15)  — stars + spike signal (spike > raw stars)

# HARD RULES
1. Repos with "Spike: YES" MUST be considered for "rising-star" first; do not skip them just because their star count is lower.
2. Do NOT just pick the 3 with the most stars — that defeats the point of ranking.
3. The 3 badges MUST be different.
4. Prefer DIVERSITY of categories (don't pick 3 LLM wrappers; mix infra / models / apps / tools).
5. If two repos look similar, pick the one with stronger differentiation in description/topics.
6. Avoid duplicates of well-known projects unless the repo is meaningfully novel.

# OUTPUT
Return ONLY a single valid JSON object, nothing else. No prose, no markdown fences.
Schema:
{
  "top_3": [
    { "repo": "owner/name", "badge": "<badge>", "score": <int 0-100> },
    { "repo": "owner/name", "badge": "<badge>", "score": <int 0-100> },
    { "repo": "owner/name", "badge": "<badge>", "score": <int 0-100> }
  ]
}

Scores must be calibrated: 90+ is rare and exceptional, 75-89 is strong, 60-74 is solid.`;

export async function rankRepositories(repos: RepoForRanking[]): Promise<RankingResult> {
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    console.warn('CLAUDE_CODE_OAUTH_TOKEN missing — using fallback ranking');
    return getFallbackRanking(repos);
  }

  const repoList = repos
    .map((r, i) => {
      const age = Math.floor((Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const spikeInfo = r.spikeMetrics
        ? ` | Spike: ${r.spikeMetrics.isSpike ? 'YES' : 'no'} (score ${r.spikeMetrics.spikeScore.toFixed(1)}, ${r.spikeMetrics.velocityStarsPerDay.toFixed(1)} ⭐/day)`
        : '';
      const topics = r.topics.slice(0, 5).join(', ') || 'none';
      const desc = (r.description || '').substring(0, 120);
      return `${i + 1}. ${r.full_name} [${r.language || 'N/A'}] ⭐${r.stargazers_count} 🍴${r.forks_count} ${age}d old${spikeInfo}
   topics: ${topics}
   desc: ${desc}`;
    })
    .join('\n\n');

  const userPrompt = `Rank these ${repos.length} AI repositories. Return JSON only.\n\n${repoList}`;

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
        const parsed = parseRanking(msg.result);
        if (parsed) return parsed;
        break;
      }
    }
    return getFallbackRanking(repos);
  } catch (error) {
    console.error('Error ranking repositories:', error);
    return getFallbackRanking(repos);
  }
}

function parseRanking(text: string): RankingResult | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (parsed?.top_3?.length === 3) {
      const badges = new Set(parsed.top_3.map((r: TopRepo) => r.badge));
      if (badges.size !== 3) return null;
      return parsed as RankingResult;
    }
    return null;
  } catch {
    return null;
  }
}

function getFallbackRanking(repos: RepoForRanking[]): RankingResult {
  const sorted = [...repos].sort((a, b) => {
    const aSpike = a.spikeMetrics?.isSpike ? 50 : 0;
    const bSpike = b.spikeMetrics?.isSpike ? 50 : 0;
    return b.stargazers_count + bSpike - (a.stargazers_count + aSpike);
  });

  return {
    top_3: [
      { repo: sorted[0].full_name, badge: 'innovation', score: 88 },
      { repo: sorted[1]?.full_name || sorted[0].full_name, badge: 'production', score: 82 },
      { repo: sorted[2]?.full_name || sorted[0].full_name, badge: 'learning', score: 78 },
    ],
  };
}
