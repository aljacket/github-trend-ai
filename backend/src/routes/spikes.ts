import { Router } from 'express';
import {
  detectSpikes,
  enrichWithSpikeMetrics,
  explainSpike,
  type RepositoryInput,
  type RepositoryWithSpike,
  type SpikeDetectionConfig,
} from '../services/spikeDetector.js';

const router = Router();

/**
 * POST /api/spikes
 *
 * Analizza repository per identificare spike di popolarità
 *
 * Body:
 * {
 *   repositories: RepositoryInput[],
 *   threshold?: number,
 *   minStars?: number
 * }
 */
router.post('/spikes', async (req, res) => {
  try {
    const { repositories, threshold, minStars } = req.body;

    if (!repositories || !Array.isArray(repositories)) {
      return res.status(400).json({
        error: 'Invalid request: repositories array is required',
      });
    }

    // Configurazione spike detection
    const config: Partial<SpikeDetectionConfig> = {};
    if (threshold !== undefined) config.threshold = threshold;
    if (minStars !== undefined) config.minStars = minStars;

    // Rileva spike
    const spikes = detectSpikes(repositories, config);

    // Formatta risposta
    const formattedSpikes = spikes.map((repo: RepositoryWithSpike) => ({
      full_name: repo.full_name,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      spikeScore: Math.round(repo.spikeMetrics.spikeScore * 10) / 10,
      velocityStarsPerDay: Math.round(repo.spikeMetrics.velocityStarsPerDay * 10) / 10,
      velocityForksPerDay: Math.round(repo.spikeMetrics.velocityForksPerDay * 10) / 10,
      combinedVelocity: Math.round(repo.spikeMetrics.combinedVelocity * 10) / 10,
      ageInDays: repo.spikeMetrics.ageInDays,
      daysSinceLastPush: repo.spikeMetrics.daysSinceLastPush,
      reason: explainSpike(repo.spikeMetrics),
    }));

    res.json({
      spikes: formattedSpikes,
      analyzed: repositories.length,
      spikesFound: spikes.length,
      config: {
        threshold: config.threshold ?? 8.0,
        minStars: config.minStars ?? 100,
      },
    });
  } catch (error) {
    console.error('Error in /api/spikes:', error);
    res.status(500).json({
      error: 'Internal server error during spike detection',
    });
  }
});

/**
 * POST /api/enrich-spikes
 *
 * Arricchisce repository con spike metrics senza filtrarli
 *
 * Body:
 * {
 *   repositories: RepositoryInput[],
 *   threshold?: number,
 *   minStars?: number
 * }
 */
router.post('/enrich-spikes', async (req, res) => {
  try {
    const { repositories, threshold, minStars } = req.body;

    if (!repositories || !Array.isArray(repositories)) {
      return res.status(400).json({
        error: 'Invalid request: repositories array is required',
      });
    }

    // Configurazione spike detection
    const config: Partial<SpikeDetectionConfig> = {};
    if (threshold !== undefined) config.threshold = threshold;
    if (minStars !== undefined) config.minStars = minStars;

    // Arricchisci con spike metrics
    const enriched = enrichWithSpikeMetrics(repositories, config);

    // Formatta risposta
    const formattedRepos = enriched.map((repo: RepositoryWithSpike) => ({
      ...repo,
      spikeMetrics: {
        ...repo.spikeMetrics,
        spikeScore: Math.round(repo.spikeMetrics.spikeScore * 10) / 10,
        velocityStarsPerDay: Math.round(repo.spikeMetrics.velocityStarsPerDay * 10) / 10,
        velocityForksPerDay: Math.round(repo.spikeMetrics.velocityForksPerDay * 10) / 10,
        combinedVelocity: Math.round(repo.spikeMetrics.combinedVelocity * 10) / 10,
        explanation: explainSpike(repo.spikeMetrics),
      },
    }));

    res.json({
      repositories: formattedRepos,
      analyzed: repositories.length,
    });
  } catch (error) {
    console.error('Error in /api/enrich-spikes:', error);
    res.status(500).json({
      error: 'Internal server error during spike enrichment',
    });
  }
});

export default router;
