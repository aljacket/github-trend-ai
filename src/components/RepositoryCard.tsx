import { memo } from 'react';
import type { Repository, RepoAnalysis, BadgeType } from '../types';

interface RepositoryCardProps {
  repo: Repository;
  analysis?: RepoAnalysis;
  isAnalyzing?: boolean;
  topBadge?: BadgeType;
  showStar?: boolean;
}

const RepositoryCardComponent = ({ repo, analysis, isAnalyzing, topBadge, showStar }: RepositoryCardProps) => {
  const categoryColors: Record<string, string> = {
    framework: 'bg-purple-100 text-purple-800',
    library: 'bg-blue-100 text-blue-800',
    tool: 'bg-green-100 text-green-800',
    application: 'bg-orange-100 text-orange-800',
    research: 'bg-pink-100 text-pink-800',
    tutorial: 'bg-yellow-100 text-yellow-800',
    other: 'bg-gray-100 text-gray-800',
  };

  // Badge colors minimalisti
  const badgeColors = {
    innovation: 'border-orange-400 bg-orange-50',
    production: 'border-purple-400 bg-purple-50',
    learning: 'border-green-400 bg-green-50',
    community: 'border-pink-400 bg-pink-50',
    research: 'border-blue-400 bg-blue-50',
    'rising-star': 'border-yellow-400 bg-yellow-50',
  };

  const badgeLabels = {
    innovation: 'Most Innovative',
    production: 'Best for Production',
    learning: 'Best for Learning',
    community: 'Best Community',
    research: 'Cutting-edge Research',
    'rising-star': 'Rising Star',
  };

  const badgeAccent = {
    innovation: 'bg-orange-500',
    production: 'bg-purple-500',
    learning: 'bg-emerald-500',
    community: 'bg-pink-500',
    research: 'bg-blue-500',
    'rising-star': 'bg-yellow-500',
  };

  const badgePillBg = {
    innovation: 'bg-orange-50',
    production: 'bg-purple-50',
    learning: 'bg-emerald-50',
    community: 'bg-pink-50',
    research: 'bg-blue-50',
    'rising-star': 'bg-yellow-50',
  };

  const badgeBorderColors = {
    innovation: 'border-orange-400',
    production: 'border-purple-400',
    learning: 'border-green-400',
    community: 'border-pink-400',
    research: 'border-blue-400',
    'rising-star': 'border-yellow-400',
  };

  const badgeTextColors = {
    innovation: 'text-orange-700',
    production: 'text-purple-700',
    learning: 'text-green-700',
    community: 'text-pink-700',
    research: 'text-blue-700',
    'rising-star': 'text-yellow-700',
  };

  const borderClass = topBadge
    ? `border-2 ${badgeBorderColors[topBadge]}`
    : 'border border-gray-200';

  return (
    <div className={`group relative bg-white rounded-2xl shadow-sm p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${borderClass} ${topBadge ? badgeColors[topBadge] : ''} overflow-hidden`}>
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Stella per #1: medaglia in alto a sinistra */}
      {showStar && (
        <div className="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md ring-2 ring-white animate-badge-pop">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      )}

      {/* Badge top-right: tab inset che segue la curvatura della card */}
      {topBadge && (
        <div
          className={`absolute top-0 right-0 z-10 inline-flex items-center gap-2 pl-3 pr-4 py-2 rounded-tr-2xl rounded-bl-2xl ${badgePillBg[topBadge]} ${badgeTextColors[topBadge]} animate-badge-pop`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${badgeAccent[topBadge]}`}></span>
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            {badgeLabels[topBadge]}
          </span>
        </div>
      )}

      {/* Header */}
      <div className={`relative flex items-start justify-between mb-4 ${topBadge ? 'pr-32' : ''} ${showStar ? 'pl-12' : ''}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative">
            <img
              src={repo.owner.avatar_url}
              alt={repo.owner.login}
              className="w-12 h-12 rounded-xl ring-2 ring-gray-100 group-hover:ring-purple-200 transition-all"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="min-w-0 flex-1">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-lg text-gray-900 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 transition-all truncate block"
            >
              {repo.name}
            </a>
            <p className="text-sm text-gray-500 truncate">{repo.full_name}</p>
          </div>
        </div>
        {analysis && (
          <span
            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
              categoryColors[analysis.category] || categoryColors.other
            }`}
          >
            {analysis.category}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="relative text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
        {repo.description || 'No description available'}
      </p>

      {/* AI Analysis */}
      {isAnalyzing && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-700">Analyzing with AI...</span>
          </div>
        </div>
      )}

      {analysis && !isAnalyzing && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-gray-600 uppercase mb-1">
              AI Summary
            </h4>
            <p className="text-sm text-gray-700">{analysis.summary}</p>
          </div>

          {analysis.keyFeatures.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 uppercase mb-1">
                Key Features
              </h4>
              <ul className="text-sm text-gray-700 list-disc list-inside space-y-0.5">
                {analysis.keyFeatures.slice(0, 3).map((feature, idx) => (
                  <li key={idx} className="line-clamp-1">{feature}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-gray-600 uppercase mb-1">
              Why It Matters
            </h4>
            <p className="text-sm text-gray-700 line-clamp-2">
              {analysis.potentialValue}
            </p>
          </div>
        </div>
      )}

      {/* Stats con design moderno */}
      <div className="relative flex items-center gap-4 text-sm mb-4">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg group-hover:from-yellow-100 group-hover:to-amber-100 transition-colors">
          <svg
            className="w-4 h-4 text-yellow-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="font-semibold text-gray-700">{repo.stargazers_count.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg group-hover:from-blue-100 group-hover:to-indigo-100 transition-colors">
          <svg
            className="w-4 h-4 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-semibold text-gray-700">{repo.forks_count.toLocaleString()}</span>
        </div>
        {repo.language && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg group-hover:from-purple-100 group-hover:to-pink-100 transition-colors">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"></div>
            <span className="font-semibold text-gray-700">{repo.language}</span>
          </div>
        )}
      </div>

      {/* Topics con hover effect */}
      {repo.topics.length > 0 && (
        <div className="relative flex flex-wrap gap-2">
          {repo.topics.slice(0, 5).map((topic) => (
            <span
              key={topic}
              className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-purple-100 hover:to-pink-100 text-gray-700 hover:text-purple-700 text-xs font-medium rounded-full border border-gray-200 hover:border-purple-300 cursor-default transition-all"
            >
              {topic}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
// Only re-render if repo.id, topBadge, showStar, or analysis changes
export const RepositoryCard = memo(RepositoryCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.repo.id === nextProps.repo.id &&
    prevProps.topBadge === nextProps.topBadge &&
    prevProps.showStar === nextProps.showStar &&
    prevProps.isAnalyzing === nextProps.isAnalyzing &&
    prevProps.analysis === nextProps.analysis
  );
});
