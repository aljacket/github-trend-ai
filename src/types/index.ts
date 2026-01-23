// Shared types for GitHub Trend AI

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

export interface RepoAnalysis {
  summary: string;
  keyFeatures: string[];
  useCase: string;
  technicalStack: string[];
  potentialValue: string;
  category: 'framework' | 'library' | 'tool' | 'application' | 'research' | 'tutorial' | 'other';
}

export type BadgeType = 'innovation' | 'production' | 'learning' | 'community' | 'research' | 'rising-star';

export interface TopRepo {
  repo: string;
  badge: BadgeType;
  score: number;
}

export interface RankingResult {
  top_3: TopRepo[];
}

export interface CachedRanking {
  ranking: RankingResult;
  repositories: Repository[];
  timestamp: number;
  timeRange: 'daily' | 'weekly' | 'monthly';
}

export type TimeRange = 'daily' | 'weekly' | 'monthly';
