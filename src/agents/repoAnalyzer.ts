import { z } from 'zod';
import type { Repository, RepoAnalysis } from '../types';

// Define the analysis schema for validation
export const repoAnalysisSchema = z.object({
  summary: z.string(),
  keyFeatures: z.array(z.string()),
  useCase: z.string(),
  technicalStack: z.array(z.string()),
  potentialValue: z.string(),
  category: z.enum(['framework', 'library', 'tool', 'application', 'research', 'tutorial', 'other']),
});

export type { RepoAnalysis };

// Helper function to analyze a repository using backend Mastra API
export async function analyzeRepository(repo: Repository): Promise<RepoAnalysis> {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${backendUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        language: repo.language,
        topics: repo.topics,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    const analysis = await response.json();
    return repoAnalysisSchema.parse(analysis);
  } catch {
    // Backend unavailable - use metadata-based fallback
    return getFallbackAnalysis(repo);
  }
}

function getFallbackAnalysis(repo: Repository): RepoAnalysis {
  // Infer category from topics
  let category: RepoAnalysis['category'] = 'other';
  const topics = repo.topics.map(t => t.toLowerCase());

  if (topics.some(t => t.includes('framework'))) category = 'framework';
  else if (topics.some(t => t.includes('library') || t.includes('lib'))) category = 'library';
  else if (topics.some(t => t.includes('tool') || t.includes('cli'))) category = 'tool';
  else if (topics.some(t => t.includes('app') || t.includes('application'))) category = 'application';
  else if (topics.some(t => t.includes('research') || t.includes('paper'))) category = 'research';
  else if (topics.some(t => t.includes('tutorial') || t.includes('learning') || t.includes('course'))) category = 'tutorial';

  return {
    summary: repo.description || `${repo.name} - An AI-related project on GitHub`,
    keyFeatures: repo.topics.slice(0, 5).length > 0 ? repo.topics.slice(0, 5) : ['AI/ML capabilities', 'Active development', 'Open source'],
    useCase: 'AI development and research',
    technicalStack: repo.language ? [repo.language, ...repo.topics.slice(0, 3)] : repo.topics.slice(0, 4),
    potentialValue: `Popular repository with ${repo.stargazers_count} stars and ${repo.forks_count} forks, showing active community interest and adoption`,
    category,
  };
}
