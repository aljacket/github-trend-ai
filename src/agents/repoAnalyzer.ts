import { z } from 'zod';
import type { Repository } from '../services/github';

// Define the analysis schema
export const repoAnalysisSchema = z.object({
  summary: z.string().describe('A brief summary of what the repository does'),
  keyFeatures: z.array(z.string()).describe('Main features or capabilities'),
  useCase: z.string().describe('Primary use case or problem it solves'),
  technicalStack: z.array(z.string()).describe('Technologies used'),
  potentialValue: z.string().describe('Why this repo is valuable/interesting'),
  category: z.enum(['framework', 'library', 'tool', 'application', 'research', 'tutorial', 'other'])
    .describe('Type of project'),
});

export type RepoAnalysis = z.infer<typeof repoAnalysisSchema>;

// Helper function to analyze a repository using backend Mastra API
export async function analyzeRepository(repo: Repository): Promise<RepoAnalysis> {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

  try {
    // Try backend API first (Mastra agent)
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
  } catch (backendError) {
    console.warn('Backend API failed, trying fallback:', backendError);

    // Fallback to direct OpenAI if backend is not available
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      return getFallbackAnalysis(repo);
    }

    try {
    const prompt = `Analyze this GitHub repository and provide a JSON response:

Name: ${repo.name}
Full Name: ${repo.full_name}
Description: ${repo.description || 'No description provided'}
Language: ${repo.language || 'Not specified'}
Topics: ${repo.topics.join(', ') || 'None'}
Stars: ${repo.stargazers_count}
Forks: ${repo.forks_count}
Created: ${new Date(repo.created_at).toLocaleDateString()}
Last Updated: ${new Date(repo.updated_at).toLocaleDateString()}

Provide a structured analysis with these exact fields:
- summary: (string) brief description of what it does
- keyFeatures: (array) 3-5 main features
- useCase: (string) primary use case
- technicalStack: (array) technologies used
- potentialValue: (string) why it's valuable
- category: (string) one of: framework, library, tool, application, research, tutorial, or other

Return ONLY valid JSON, no additional text.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an AI expert that analyzes GitHub repositories. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const analysis = JSON.parse(content);

    // Validate with zod
    return repoAnalysisSchema.parse(analysis);
    } catch (error) {
      console.error('Error with OpenAI fallback:', error);
      return getFallbackAnalysis(repo);
    }
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

