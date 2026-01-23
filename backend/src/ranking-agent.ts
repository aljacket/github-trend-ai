import { Agent } from '@mastra/core/agent';

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
}

export interface TopRepo {
  repo: string; // full_name
  badge: 'innovation' | 'production' | 'learning' | 'community' | 'research' | 'rising-star';
  score: number;
}

export interface RankingResult {
  top_3: TopRepo[];
}

// Create the Mastra agent for intelligent ranking
export const rankingAgent = new Agent({
  id: 'repo-ranking-agent',
  name: 'Repository Ranking Expert',
  instructions: `Rank NEW AI repos. Find top 3 with DIFFERENT badges.

Badges (pick 3 different):
- innovation: Most innovative/novel
- production: Production-ready
- learning: Best for learning
- community: Strong community
- research: Cutting-edge research
- rising-star: Fastest growth

Criteria: Innovation(40) + Quality(30) + Practicality(20) + Traction(10).

JSON only:
{
  "top_3": [
    {"repo": "owner/name", "badge": "innovation", "score": 95},
    {"repo": "owner/name", "badge": "community", "score": 90},
    {"repo": "owner/name", "badge": "learning", "score": 88}
  ]
}`,
  model: 'openai/gpt-4o-mini',
});

export async function rankRepositories(repos: RepoForRanking[]): Promise<RankingResult> {
  try {
    // Analizza TUTTI i repos (20 max)
    const repoList = repos.map((r, i) => {
      const age = Math.floor((Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24));
      return `${i + 1}. ${r.full_name} (${r.language || 'N/A'}, ⭐${r.stargazers_count}, ${age}d): ${(r.description || '').substring(0, 50)}`;
    }).join('\n');

    const prompt = `Top 3 from:\n${repoList}`;

    console.log(`🔍 Ranking ALL ${repos.length} repos...`);

    const result = await rankingAgent.generate(prompt);

    const text = result.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const ranking = JSON.parse(jsonMatch[0]);

      // Validate top_3 exists
      if (ranking.top_3 && ranking.top_3.length === 3) {
        return ranking as RankingResult;
      }
    }

    return getFallbackRanking(repos);
  } catch (error) {
    console.error('Error ranking repositories:', error);
    return getFallbackRanking(repos);
  }
}

function getFallbackRanking(repos: RepoForRanking[]): RankingResult {
  // Simple fallback: rank by stars
  const sorted = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count);

  return {
    top_3: [
      { repo: sorted[0].full_name, badge: 'innovation', score: 95 },
      { repo: sorted[1]?.full_name || sorted[0].full_name, badge: 'production', score: 88 },
      { repo: sorted[2]?.full_name || sorted[0].full_name, badge: 'learning', score: 85 }
    ]
  };
}
