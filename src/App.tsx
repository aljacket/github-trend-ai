import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { RepositoryCard } from './components/RepositoryCard';
import { githubService } from './services/github';
import type { Repository, RankingResult, CachedRanking, TimeRange } from './types';

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

  const getCacheKey = (range: string) => `${CACHE_KEY_PREFIX}${range}`;

  // Carica cache da localStorage
  const loadCache = (): CachedRanking | null => {
    try {
      const cached = localStorage.getItem(getCacheKey(timeRange));
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
  };

  // Salva cache in localStorage (ranking + repositories)
  const saveCache = (ranking: RankingResult, repos: Repository[]) => {
    try {
      const data: CachedRanking = {
        ranking,
        repositories: repos,
        timestamp: Date.now(),
        timeRange
      };
      localStorage.setItem(getCacheKey(timeRange), JSON.stringify(data));
      setCacheInfo({ timestamp: data.timestamp });
    } catch {
      // Silently fail - cache is optional
    }
  };

  const fetchRepositories = async (forceRefresh = false) => {
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
  };

  const enrichRepositoriesWithSpikes = async (repos: Repository[]) => {
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
        const data = await response.json();
        // Arricchisci i repository con spike metrics
        const enrichedRepos = repos.map((repo) => {
          const enrichedRepo = data.repositories.find((r: any) => r.full_name === repo.full_name);
          if (enrichedRepo?.spikeMetrics) {
            return { ...repo, spikeMetrics: enrichedRepo.spikeMetrics };
          }
          return repo;
        });

        // Ordina per spike score se disponibile
        enrichedRepos.sort((a, b) => {
          const scoreA = a.spikeMetrics?.spikeScore || 0;
          const scoreB = b.spikeMetrics?.spikeScore || 0;
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
  };

  const rankRepositoriesWithAI = async (repos: Repository[]) => {
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
  };

  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (fetchedRef.current === timeRange) return;
    fetchedRef.current = timeRange;
    fetchRepositories();
  }, [timeRange]);

  const handleTimeRangeChange = (range: TimeRange) => {
    if (range === timeRange) return; // Già su questo tab
    fetchedRef.current = null; // Permetti fetch per nuovo timeRange
    setTimeRange(range);
  };

  const handleRefresh = () => {
    setRankingResult(null);
    setCacheInfo(null);
    localStorage.removeItem(getCacheKey(timeRange));
    fetchRepositories(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 pb-12">
        <FilterBar
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
                {!import.meta.env.VITE_GITHUB_TOKEN && (
                  <p className="text-red-700 text-sm mt-2">
                    Please add your GitHub token to the <code className="bg-red-100 px-1 py-0.5 rounded">.env</code> file
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {isLoading && repositories.length === 0 && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading trending AI repositories...</p>
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">AI is analyzing and ranking repositories...</p>
            </div>
          </div>
        )}

        {/* Cache info minimalista */}
        {cacheInfo && !isRanking && (
          <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Cached {Math.round((CACHE_DURATION - (Date.now() - cacheInfo.timestamp)) / (1000 * 60 * 60))}h left
          </div>
        )}

        {/* Griglia repositories con badge e stella */}
        {!isRanking && repositories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repositories.map((repo) => {
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
            })}
          </div>
        )}

        {repositories.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Showing {repositories.length} trending AI repositories from{' '}
            {timeRange === 'daily'
              ? 'today'
              : timeRange === 'weekly'
              ? 'this week'
              : timeRange === 'monthly'
              ? 'this month'
              : 'hot & rising (7 days activity)'}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
