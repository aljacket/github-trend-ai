import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { githubService } from './services/github';
import type { Repository, RankingResult, CachedRanking, TimeRange, SpikeMetrics } from './types';

// Lazy load components for better initial load performance
const Header = lazy(() => import('./components/Header').then(m => ({ default: m.Header })));
const FilterBar = lazy(() => import('./components/FilterBar').then(m => ({ default: m.FilterBar })));
const RepositoryCard = lazy(() => import('./components/RepositoryCard').then(m => ({ default: m.RepositoryCard })));

const CACHE_KEY_PREFIX = 'github-trend-ai-cache-';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ore in millisecondi

function App() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [rankingResult, setRankingResult] = useState<RankingResult | null>(null);
  const [isRanking, setIsRanking] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheInfo, setCacheInfo] = useState<{ timestamp: number } | null>(null);

  // Memoize cache key to avoid recalculation
  const cacheKey = useMemo(() => `${CACHE_KEY_PREFIX}${timeRange}`, [timeRange]);

  // Carica cache da localStorage - memoized per evitare ricreazione
  const loadCache = useCallback((): CachedRanking | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const data: CachedRanking = JSON.parse(cached);
      const now = Date.now();

      if (now - data.timestamp < CACHE_DURATION) {
        return data;
      }

      return null;
    } catch {
      return null;
    }
  }, [cacheKey]);

  // Salva cache in localStorage (ranking + repositories) - memoized
  const saveCache = useCallback((ranking: RankingResult, repos: Repository[]) => {
    try {
      const data: CachedRanking = {
        ranking,
        repositories: repos,
        timestamp: Date.now(),
        timeRange
      };
      localStorage.setItem(cacheKey, JSON.stringify(data));
      setCacheInfo({ timestamp: data.timestamp });
    } catch {
      // Silently fail - cache is optional
    }
  }, [cacheKey, timeRange]);

  // Funzioni helper definite PRIMA di fetchRepositories per evitare dipendenze circolari
  const enrichRepositoriesWithSpikes = useCallback(async (repos: Repository[]) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    try {
      const reposForSpike = repos.map((repo) => ({
        full_name: repo.full_name,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        created_at: repo.created_at,
        pushed_at: repo.pushed_at,
      }));

      const response = await fetch(`${backendUrl}/api/enrich-spikes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repositories: reposForSpike, threshold: 8.0, minStars: 100 }),
      });

      if (response.ok) {
        const data = await response.json() as { repositories: Array<{ full_name: string; spikeMetrics?: SpikeMetrics }> };
        // Arricchisci i repository con spike metrics
        const enrichedRepos = repos.map((repo): Repository => {
          const enrichedRepo = data.repositories.find((r) => r.full_name === repo.full_name);
          if (enrichedRepo?.spikeMetrics) {
            return { ...repo, spikeMetrics: enrichedRepo.spikeMetrics };
          }
          return repo;
        });

        // Ordina per spike score se disponibile
        enrichedRepos.sort((a, b) => {
          const scoreA = a.spikeMetrics?.spikeScore ?? 0;
          const scoreB = b.spikeMetrics?.spikeScore ?? 0;
          return scoreB - scoreA;
        });

        setRepositories(enrichedRepos);
      } else {
        setRepositories(repos);
      }
    } catch {
      // Fallback: usa repos senza spike metrics
      setRepositories(repos);
    }
  }, []);

  const rankRepositoriesWithAI = useCallback(async (repos: Repository[]) => {
    setIsRanking(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    try {
      const reposForRanking = repos.map((repo) => ({
        full_name: repo.full_name,
        name: repo.name,
        description: repo.description || '',
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        language: repo.language || 'Unknown',
        topics: repo.topics,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        spikeMetrics: repo.spikeMetrics,
      }));

      const response = await fetch(`${backendUrl}/api/rank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repositories: reposForRanking }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }

      const ranking: RankingResult = await response.json();
      setRankingResult(ranking);

      // Salva in cache (ranking + repositories)
      saveCache(ranking, repos);
    } catch {
      // Ranking failed - will show repos without badges
    } finally {
      setIsRanking(false);
    }
  }, [saveCache]);

  // fetchRepositories definita dopo le sue dipendenze
  const fetchRepositories = useCallback(async (forceRefresh = false) => {
    // Se non forceRefresh, prova a caricare dalla cache
    if (!forceRefresh) {
      const cached = loadCache();
      if (cached && cached.repositories?.length > 0) {
        // Usa dati dalla cache - nessuna chiamata GitHub
        setRepositories(cached.repositories);
        setRankingResult(cached.ranking);
        setCacheInfo({ timestamp: cached.timestamp });
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const repos = await githubService.searchTrendingAIRepos(timeRange, 20);

      // Per modalità spikes, arricchisci con spike metrics prima del ranking
      if (timeRange === 'spikes') {
        await enrichRepositoriesWithSpikes(repos);
      } else {
        setRepositories(repos);
      }

      // Rank repositories with ONE batch AI call
      await rankRepositoriesWithAI(repos);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch repositories. Please check your GitHub token.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, loadCache, enrichRepositoriesWithSpikes, rankRepositoriesWithAI]);

  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (fetchedRef.current === timeRange) return;
    fetchedRef.current = timeRange;
    fetchRepositories();
  }, [timeRange, fetchRepositories]);

  // Memoize handlers to prevent re-creating functions on every render
  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    if (range === timeRange) return; // Già su questo tab
    fetchedRef.current = null; // Permetti fetch per nuovo timeRange
    setTimeRange(range);
  }, [timeRange]);

  const handleRefresh = useCallback(() => {
    setRankingResult(null);
    setCacheInfo(null);
    localStorage.removeItem(cacheKey);
    fetchRepositories(true);
  }, [cacheKey, fetchRepositories]);

  // Memoize repository cards rendering to prevent unnecessary recalculation
  const repositoryCards = useMemo(() => repositories.map((repo) => {
    // Trova se questo repo è nei top 3
    const topRepo = rankingResult?.top_3?.find((t) => t.repo === repo.full_name);
    const isTop1 = topRepo && topRepo.badge === 'innovation' && rankingResult?.top_3?.[0]?.repo === repo.full_name;

    return (
      <RepositoryCard
        key={repo.id}
        repo={repo}
        analysis={undefined}
        isAnalyzing={false}
        topBadge={topRepo?.badge}
        showStar={isTop1}
      />
    );
  }), [repositories, rankingResult]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30">
      <Suspense fallback={
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-8 mb-8">
          <div className="container mx-auto px-4">
            <div className="h-16 flex items-center">
              <div className="animate-pulse h-8 bg-gray-700 rounded w-64"></div>
            </div>
          </div>
        </div>
      }>
        <Header />
      </Suspense>

      <main className="container mx-auto px-4 pb-12">
        <Suspense fallback={
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
          </div>
        }>
          <FilterBar
            timeRange={timeRange}
            onTimeRangeChange={handleTimeRangeChange}
            onRefresh={handleRefresh}
            isLoading={isLoading}
          />
        </Suspense>

        {error && (
          <div className="relative bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 mb-6 shadow-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-100/50 via-transparent to-pink-100/50"></div>
            <div className="relative flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-900 mb-2 text-lg">Oops! Something went wrong</h3>
                <p className="text-red-800 text-sm leading-relaxed">{error}</p>
                <div className="mt-3 p-3 bg-red-100/50 rounded-xl border border-red-200">
                  <p className="text-red-800 text-sm">
                    💡 Make sure the backend is running and <code className="bg-red-200 px-2 py-0.5 rounded font-mono text-xs">VITE_BACKEND_URL</code> points to it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading && repositories.length === 0 && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="relative mx-auto mb-6 w-16 h-16">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30"></div>
              </div>
              <p className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Loading trending AI repositories...
              </p>
              <p className="text-sm text-gray-500 mt-2">Analyzing with AI agents</p>
            </div>
          </div>
        )}

        {!isLoading && repositories.length === 0 && !error && (
          <div className="text-center py-20">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-600 text-lg">No repositories found</p>
          </div>
        )}

        {isRanking && repositories.length > 0 && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="relative mx-auto mb-6 w-16 h-16">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
              </div>
              <p className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI is analyzing and ranking...
              </p>
              <p className="text-sm text-gray-500 mt-2">Finding the best repositories for you</p>
            </div>
          </div>
        )}

        {/* Cache info moderna */}
        {cacheInfo && !isRanking && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl mb-6 shadow-sm">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-semibold text-blue-700">
              Cached • {Math.round((CACHE_DURATION - (Date.now() - cacheInfo.timestamp)) / (1000 * 60 * 60))}h remaining
            </span>
          </div>
        )}

        {/* Griglia repositories con badge e stella */}
        {!isRanking && repositories.length > 0 && (
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          }>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {repositoryCards}
            </div>
          </Suspense>
        )}

        {repositories.length > 0 && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-sm">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-gray-700">
                Showing <span className="text-purple-600">{repositories.length}</span> trending AI repositories from{' '}
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {timeRange === 'daily'
                    ? 'today'
                    : timeRange === 'weekly'
                    ? 'this week'
                    : timeRange === 'monthly'
                    ? 'this month'
                    : 'hot & rising'}
                </span>
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
