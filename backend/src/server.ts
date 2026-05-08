import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { analyzeRepository, type RepoData } from './agent.js';
import { rankRepositories, type RepoForRanking } from './ranking-agent.js';
import spikeRoutes from './routes/spikes.js';
import githubRoutes from './routes/github.js';

dotenv.config();
dotenv.config({ path: '../.env' });

const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : true;

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Routes
app.use('/api', spikeRoutes);
app.use('/api', githubRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mastra backend is running' });
});

// Analyze repository endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const repo: RepoData = req.body;

    if (!repo || !repo.name) {
      return res.status(400).json({ error: 'Invalid repository data' });
    }

    const analysis = await analyzeRepository(repo);

    res.json(analysis);
  } catch (error) {
    console.error('Error in /api/analyze:', error);
    res.status(500).json({
      error: 'Failed to analyze repository',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Batch analyze endpoint
app.post('/api/analyze-batch', async (req, res) => {
  try {
    const repos: RepoData[] = req.body.repositories;

    if (!Array.isArray(repos) || repos.length === 0) {
      return res.status(400).json({ error: 'Invalid repositories array' });
    }

    const analyses = await Promise.all(
      repos.map(async (repo) => ({
        id: repo.full_name,
        analysis: await analyzeRepository(repo),
      }))
    );

    res.json({ analyses });
  } catch (error) {
    console.error('Error in /api/analyze-batch:', error);
    res.status(500).json({
      error: 'Failed to analyze repositories',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Rank repositories endpoint (batch analysis with intelligent ranking)
app.post('/api/rank', async (req, res) => {
  try {
    const repos: RepoForRanking[] = req.body.repositories;

    if (!Array.isArray(repos) || repos.length === 0) {
      return res.status(400).json({ error: 'Invalid repositories array' });
    }

    const ranking = await rankRepositories(repos);

    res.json(ranking);
  } catch (error) {
    console.error('Error in /api/rank:', error);
    res.status(500).json({
      error: 'Failed to rank repositories',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Mastra Backend Server Running!`);
  console.log(`   ➜ Local:   http://localhost:${PORT}`);
  console.log(`   ➜ Health:  http://localhost:${PORT}/health`);
  console.log(`   ➜ Analyze: POST http://localhost:${PORT}/api/analyze`);
  console.log(`   ➜ Rank:    POST http://localhost:${PORT}/api/rank`);
  console.log(`   ➜ Spikes:  POST http://localhost:${PORT}/api/spikes\n`);
});
