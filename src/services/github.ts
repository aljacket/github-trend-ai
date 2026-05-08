import type { Repository, TimeRange } from '../types';

export type { Repository };

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export class GitHubService {
  async searchTrendingAIRepos(timeRange: TimeRange = 'weekly', limit = 20): Promise<Repository[]> {
    const url = `${BACKEND_URL}/api/trending?range=${timeRange}&limit=${limit}`;
    const response = await fetch(url);

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || body.error || `Backend returned ${response.status}`);
    }

    const data = await response.json();
    return data.repositories as Repository[];
  }
}

export const githubService = new GitHubService();
