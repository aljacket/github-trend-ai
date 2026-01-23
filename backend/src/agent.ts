import { Agent } from '@mastra/core/agent';

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

// Create the Mastra agent for repository analysis
export const repoAnalyzerAgent = new Agent({
  id: 'repo-analyzer',
  name: 'Repository Analyzer',
  instructions: `You are an AI expert that analyzes GitHub repositories to help developers discover valuable AI projects.

Your task is to analyze repository information and provide structured insights including:
1. A clear, concise summary of what the project does
2. Key features that make it stand out (3-5 items)
3. The primary use case or problem it solves
4. Technical stack and technologies used
5. Why developers would find this valuable
6. The category/type of project

Focus on practical insights that help developers quickly understand if this repo is relevant to their interests.
Be objective and highlight both strengths and any limitations you can infer from the data.

Always respond with valid JSON matching this structure:
{
  "summary": "Brief description",
  "keyFeatures": ["feature1", "feature2", "feature3"],
  "useCase": "Primary use case",
  "technicalStack": ["tech1", "tech2"],
  "potentialValue": "Why it matters",
  "category": "one of: framework, library, tool, application, research, tutorial, other"
}`,
  model: 'openai/gpt-4o-mini',
});

export async function analyzeRepository(repo: RepoData): Promise<RepoAnalysis> {
  const prompt = `Analyze this GitHub repository:

Name: ${repo.name}
Full Name: ${repo.full_name}
Description: ${repo.description || 'No description provided'}
Language: ${repo.language || 'Not specified'}
Topics: ${repo.topics.join(', ') || 'None'}
Stars: ${repo.stargazers_count}
Forks: ${repo.forks_count}
Created: ${new Date(repo.created_at).toLocaleDateString()}
Last Updated: ${new Date(repo.updated_at).toLocaleDateString()}

Provide a structured analysis as JSON.`;

  try {
    const result = await repoAnalyzerAgent.generate(prompt);

    // Parse the response
    const text = result.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return analysis;
    }

    // Fallback if parsing fails
    return getFallbackAnalysis(repo);
  } catch (error) {
    console.error('Error analyzing repository:', error);
    return getFallbackAnalysis(repo);
  }
}

function getFallbackAnalysis(repo: RepoData): RepoAnalysis {
  // Infer category from topics
  let category: RepoAnalysis['category'] = 'other';
  const topics = repo.topics.map(t => t.toLowerCase());

  if (topics.some(t => t.includes('framework'))) category = 'framework';
  else if (topics.some(t => t.includes('library') || t.includes('lib'))) category = 'library';
  else if (topics.some(t => t.includes('tool') || t.includes('cli'))) category = 'tool';
  else if (topics.some(t => t.includes('app') || t.includes('application'))) category = 'application';
  else if (topics.some(t => t.includes('research') || t.includes('paper'))) category = 'research';
  else if (topics.some(t => t.includes('tutorial') || t.includes('learning'))) category = 'tutorial';

  return {
    summary: repo.description || `${repo.name} - An AI/ML project on GitHub`,
    keyFeatures: repo.topics.slice(0, 5).length > 0
      ? repo.topics.slice(0, 5)
      : ['Machine learning capabilities', 'Active development', 'Open source'],
    useCase: 'AI/ML development and research',
    technicalStack: repo.language
      ? [repo.language, ...repo.topics.slice(0, 3)]
      : repo.topics.slice(0, 4),
    potentialValue: `Popular repository with ${repo.stargazers_count} stars and ${repo.forks_count} forks, indicating strong community interest`,
    category,
  };
}
