import { Octokit } from '@octokit/rest';
import type { Repository, TimeRange } from '../types';

export type { Repository };

export class GitHubService {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token || import.meta.env.VITE_GITHUB_TOKEN,
    });
  }

  private async searchByTopic(
    topic: string,
    dateFilter: string,
    stars: number,
    limit: number
  ) {
    return this.octokit.search.repos({
      q: `topic:${topic} ${dateFilter} stars:>${stars}`,
      sort: 'stars',
      order: 'desc',
      per_page: limit,
    });
  }

  private mergeAndDedupe(
    items1: typeof Array.prototype,
    items2: typeof Array.prototype,
    limit: number
  ) {
    const seen = new Set<number>();
    const merged = [];
    for (const item of [...items1, ...items2]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
    return merged.sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, limit);
  }

  async searchTrendingAIRepos(
    timeRange: TimeRange = 'weekly',
    limit: number = 20
  ): Promise<Repository[]> {
    const date = new Date();
    const daysAgo = { daily: 1, weekly: 7, monthly: 30 }[timeRange];
    date.setDate(date.getDate() - daysAgo);
    const dateString = date.toISOString().split('T')[0];

    try {
      // Prima priorità: repo CREATI nel periodo (nuovi progetti)
      const [aiNew, aiFullNew, mlNew, llmNew] = await Promise.all([
        this.searchByTopic('ai', `created:>${dateString}`, 1, limit),
        this.searchByTopic('artificial-intelligence', `created:>${dateString}`, 1, limit),
        this.searchByTopic('machine-learning', `created:>${dateString}`, 1, limit),
        this.searchByTopic('llm', `created:>${dateString}`, 1, limit),
      ]);

      // Merge e deduplica repo creati
      let items = this.mergeAndDedupe(
        [
          ...aiNew.data.items,
          ...aiFullNew.data.items,
          ...mlNew.data.items,
          ...llmNew.data.items
        ],
        [],
        limit
      );

      // Filtra esplicitamente per assicurarsi che siano davvero nuovi
      const cutoffDate = new Date(dateString);
      items = items.filter(item => {
        const createdDate = new Date(item.created_at);
        return createdDate >= cutoffDate;
      });

      // Fallback: se meno di 10 repo creati, aggiungi i più popolari con attività recente
      if (items.length < 10) {
        const [aiActive, aiFullActive] = await Promise.all([
          this.searchByTopic('ai', `pushed:>${dateString}`, 50, limit),
          this.searchByTopic('artificial-intelligence', `pushed:>${dateString}`, 50, limit),
        ]);

        const existingIds = new Set(items.map(i => i.id));
        const activeItems = this.mergeAndDedupe(aiActive.data.items, aiFullActive.data.items, limit)
          .filter(i => !existingIds.has(i.id));

        items = [...items, ...activeItems].slice(0, limit);
      }

      return items.map(repo => ({
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
      }));
    } catch (error) {
      throw error;
    }
  }

  async getRepositoryDetails(owner: string, repo: string) {
    try {
      const response = await this.octokit.repos.get({
        owner,
        repo,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getRepositoryReadme(owner: string, repo: string): Promise<string | null> {
    try {
      const response = await this.octokit.repos.getReadme({
        owner,
        repo,
      });

      // Decode base64 content
      const content = atob(response.data.content);
      return content;
    } catch {
      return null;
    }
  }
}

export const githubService = new GitHubService();
