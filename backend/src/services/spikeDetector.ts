/**
 * Spike Detection Service
 *
 * Calcola spike scores per repository GitHub basandosi su:
 * - Star velocity (stelle/giorno)
 * - Fork velocity (fork/giorno)
 * - Recency multiplier (attività recente)
 *
 * Formula: spike_score = (star_velocity * 0.7 + fork_velocity * 0.3) * recency_multiplier
 */

export interface SpikeMetrics {
  velocityStarsPerDay: number;
  velocityForksPerDay: number;
  combinedVelocity: number;
  recencyMultiplier: number;
  spikeScore: number;
  isSpike: boolean;
  ageInDays: number;
  daysSinceLastPush: number;
}

export interface RepositoryInput {
  full_name: string;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  pushed_at: string;
}

export interface RepositoryWithSpike extends RepositoryInput {
  spikeMetrics: SpikeMetrics;
}

export interface SpikeDetectionConfig {
  threshold: number;        // Spike score minimo per considerarlo spike
  minStars: number;          // Stelle minime richieste
  starWeight: number;        // Peso stelle nel calcolo (default: 0.7)
  forkWeight: number;        // Peso fork nel calcolo (default: 0.3)
  recencyDaysThreshold: number; // Giorni per recency multiplier pieno (default: 7)
}

const DEFAULT_CONFIG: SpikeDetectionConfig = {
  threshold: 8.0,
  minStars: 100,
  starWeight: 0.7,
  forkWeight: 0.3,
  recencyDaysThreshold: 7,
};

/**
 * Calcola il numero di giorni tra due date
 */
function daysBetween(date1: Date, date2: Date): number {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calcola il recency multiplier basato su quanto tempo fa è stato l'ultimo push
 * - Push negli ultimi 7 giorni: multiplier = 1.0
 * - Push più vecchi: multiplier = 0.5
 */
function calculateRecencyMultiplier(daysSinceLastPush: number, threshold: number): number {
  return daysSinceLastPush <= threshold ? 1.0 : 0.5;
}

/**
 * Calcola le spike metrics per un singolo repository
 */
export function calculateSpikeMetrics(
  repo: RepositoryInput,
  config: Partial<SpikeDetectionConfig> = {}
): SpikeMetrics {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const now = new Date();
  const createdDate = new Date(repo.created_at);
  const pushedDate = new Date(repo.pushed_at);

  // Calcola età del repository e giorni dall'ultimo push
  const ageInDays = daysBetween(createdDate, now);
  const daysSinceLastPush = daysBetween(pushedDate, now);

  // Evita divisione per zero: repository di 0 giorni viene trattato come 1 giorno
  const effectiveAge = Math.max(ageInDays, 1);

  // Calcola velocità
  const velocityStarsPerDay = repo.stargazers_count / effectiveAge;
  const velocityForksPerDay = repo.forks_count / effectiveAge;

  // Velocità combinata (weighted average)
  const combinedVelocity =
    (velocityStarsPerDay * cfg.starWeight) +
    (velocityForksPerDay * cfg.forkWeight);

  // Recency multiplier
  const recencyMultiplier = calculateRecencyMultiplier(
    daysSinceLastPush,
    cfg.recencyDaysThreshold
  );

  // Spike score finale
  const spikeScore = combinedVelocity * recencyMultiplier;

  // Determina se è uno spike
  const isSpike = spikeScore >= cfg.threshold && repo.stargazers_count >= cfg.minStars;

  return {
    velocityStarsPerDay,
    velocityForksPerDay,
    combinedVelocity,
    recencyMultiplier,
    spikeScore,
    isSpike,
    ageInDays,
    daysSinceLastPush,
  };
}

/**
 * Arricchisce un array di repository con spike metrics
 */
export function enrichWithSpikeMetrics(
  repositories: RepositoryInput[],
  config: Partial<SpikeDetectionConfig> = {}
): RepositoryWithSpike[] {
  return repositories.map(repo => ({
    ...repo,
    spikeMetrics: calculateSpikeMetrics(repo, config),
  }));
}

/**
 * Filtra e ordina repository per spike score
 */
export function detectSpikes(
  repositories: RepositoryInput[],
  config: Partial<SpikeDetectionConfig> = {}
): RepositoryWithSpike[] {
  const enriched = enrichWithSpikeMetrics(repositories, config);

  // Filtra solo spike e ordina per spike score decrescente
  return enriched
    .filter(repo => repo.spikeMetrics.isSpike)
    .sort((a, b) => b.spikeMetrics.spikeScore - a.spikeMetrics.spikeScore);
}

/**
 * Categorizza un repository spike in base allo score
 */
export function categorizeSpikeIntensity(spikeScore: number): 'hot' | 'rising' | 'steady' {
  if (spikeScore >= 15) return 'hot';
  if (spikeScore >= 10) return 'rising';
  return 'steady';
}

/**
 * Genera una spiegazione testuale dello spike
 */
export function explainSpike(metrics: SpikeMetrics): string {
  const intensity = categorizeSpikeIntensity(metrics.spikeScore);
  const activityDesc = metrics.daysSinceLastPush === 0
    ? 'active today'
    : metrics.daysSinceLastPush === 1
    ? 'active yesterday'
    : `active ${metrics.daysSinceLastPush} days ago`;

  const ageDesc = metrics.ageInDays < 30
    ? 'new repository'
    : metrics.ageInDays < 90
    ? 'recent repository'
    : 'established repository';

  if (intensity === 'hot') {
    return `Explosive growth: ${ageDesc} with extremely high momentum, ${activityDesc}`;
  } else if (intensity === 'rising') {
    return `Strong growth: ${ageDesc} gaining significant traction, ${activityDesc}`;
  } else {
    return `Steady rise: ${ageDesc} with consistent growth, ${activityDesc}`;
  }
}
