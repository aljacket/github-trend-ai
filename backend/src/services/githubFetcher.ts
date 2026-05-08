import { Octokit } from '@octokit/rest';

export type TimeRange = 'daily' | 'weekly' | 'monthly' | 'spikes';

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { value: Repository[]; expiresAt: number }>();

function cacheGet(key: string): Repository[] | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key: string, value: Repository[]) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function searchByTopic(topic: string, dateFilter: string, stars: number, limit: number) {
  return octokit.search.repos({
    q: `topic:${topic} ${dateFilter} stars:>${stars}`,
    sort: 'stars',
    order: 'desc',
    per_page: limit,
  });
}

function mergeAndDedupe(items1: any[], items2: any[], limit: number) {
  const seen = new Set<number>();
  const merged: any[] = [];
  for (const item of [...items1, ...items2]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged.sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, limit);
}

function toRepository(repo: any): Repository {
  return {
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    html_url: repo.html_url,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    language: repo.language,
    topics: repo.topics || [],
    created_at: repo.created_at,
    updated_at: repo.updated_at,
    pushed_at: repo.pushed_at,
    owner: {
      login: repo.owner?.login || '',
      avatar_url: repo.owner?.avatar_url || '',
    },
  };
}

async function searchSpikeRepositories(limit: number): Promise<Repository[]> {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  const dateString = date.toISOString().split('T')[0];

  const [aiActive, aiFullActive, mlActive, llmActive] = await Promise.all([
    searchByTopic('ai', `pushed:>${dateString}`, 100, limit),
    searchByTopic('artificial-intelligence', `pushed:>${dateString}`, 100, limit),
    searchByTopic('machine-learning', `pushed:>${dateString}`, 100, limit),
    searchByTopic('llm', `pushed:>${dateString}`, 100, limit),
  ]);

  const items = mergeAndDedupe(
    [...aiActive.data.items, ...aiFullActive.data.items, ...mlActive.data.items, ...llmActive.data.items],
    [],
    limit,
  );

  return items.map(toRepository);
}

export async function searchTrendingAIRepos(timeRange: TimeRange = 'weekly', limit = 20): Promise<Repository[]> {
  const cacheKey = `${timeRange}:${limit}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  let result: Repository[];

  if (timeRange === 'spikes') {
    result = await searchSpikeRepositories(limit);
  } else {
    const date = new Date();
    const daysAgo = { daily: 1, weekly: 7, monthly: 30 }[timeRange];
    date.setDate(date.getDate() - daysAgo);
    const dateString = date.toISOString().split('T')[0];

    const [aiNew, aiFullNew, mlNew, llmNew] = await Promise.all([
      searchByTopic('ai', `created:>${dateString}`, 1, limit),
      searchByTopic('artificial-intelligence', `created:>${dateString}`, 1, limit),
      searchByTopic('machine-learning', `created:>${dateString}`, 1, limit),
      searchByTopic('llm', `created:>${dateString}`, 1, limit),
    ]);

    let items = mergeAndDedupe(
      [...aiNew.data.items, ...aiFullNew.data.items, ...mlNew.data.items, ...llmNew.data.items],
      [],
      limit,
    );

    const cutoffDate = new Date(dateString);
    items = items.filter((item) => new Date(item.created_at) >= cutoffDate);

    if (items.length < 10) {
      const [aiActive, aiFullActive] = await Promise.all([
        searchByTopic('ai', `pushed:>${dateString}`, 50, limit),
        searchByTopic('artificial-intelligence', `pushed:>${dateString}`, 50, limit),
      ]);

      const existingIds = new Set(items.map((i) => i.id));
      const activeItems = mergeAndDedupe(aiActive.data.items, aiFullActive.data.items, limit).filter(
        (i) => !existingIds.has(i.id),
      );

      items = [...items, ...activeItems].slice(0, limit);
    }

    result = items.map(toRepository);
  }

  cacheSet(cacheKey, result);
  return result;
}
