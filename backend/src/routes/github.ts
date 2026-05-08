import { Router } from 'express';
import { searchTrendingAIRepos, type TimeRange } from '../services/githubFetcher.js';

const router = Router();

const VALID_RANGES: TimeRange[] = ['daily', 'weekly', 'monthly', 'spikes'];

router.get('/trending', async (req, res) => {
  try {
    const range = (req.query.range as string) || 'weekly';
    const limit = Math.min(parseInt((req.query.limit as string) || '20', 10) || 20, 50);

    if (!VALID_RANGES.includes(range as TimeRange)) {
      return res.status(400).json({ error: `Invalid range. Use one of: ${VALID_RANGES.join(', ')}` });
    }

    const repositories = await searchTrendingAIRepos(range as TimeRange, limit);
    res.json({ repositories });
  } catch (error) {
    console.error('Error in /api/trending:', error);
    const status = (error as { status?: number })?.status === 403 ? 403 : 500;
    res.status(status).json({
      error: 'Failed to fetch trending repositories',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
