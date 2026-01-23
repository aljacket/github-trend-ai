import type { Repository } from '../services/github';
import type { RepoAnalysis } from '../agents/repoAnalyzer';

interface RepositoryCardProps {
  repo: Repository;
  analysis?: RepoAnalysis;
  isAnalyzing?: boolean;
  topBadge?: 'innovation' | 'production' | 'learning' | 'community' | 'research' | 'rising-star';
  showStar?: boolean;
}

export const RepositoryCard = ({ repo, analysis, isAnalyzing, topBadge, showStar }: RepositoryCardProps) => {
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
    innovation: '💡 Most Innovative',
    production: '🚀 Best for Production',
    learning: '📚 Best for Learning',
    community: '👥 Best Community',
    research: '🔬 Cutting-edge Research',
    'rising-star': '⚡ Rising Star',
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
    <div className={`relative bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all ${borderClass} ${topBadge ? badgeColors[topBadge] : ''}`}>
      {/* Stella per #1 */}
      {showStar && (
        <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg transform rotate-12 animate-pulse z-10">
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      )}

      {/* Badge per top 3 */}
      {topBadge && (
        <div className="absolute -top-2 left-4 z-10">
          <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full border-2 bg-white shadow-sm ${badgeBorderColors[topBadge]} ${badgeTextColors[topBadge]}`}>
            {badgeLabels[topBadge]}
          </span>
        </div>
      )}

      {/* Header */}
      <div className={`flex items-start justify-between mb-3 ${topBadge ? 'mt-4' : ''}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <img
            src={repo.owner.avatar_url}
            alt={repo.owner.login}
            className="w-10 h-10 rounded-full"
          />
          <div className="min-w-0 flex-1">
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-lg text-gray-900 hover:text-blue-600 transition-colors truncate block"
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
      <p className="text-gray-700 text-sm mb-4 line-clamp-2">
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

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-1">
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span>{repo.stargazers_count.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>{repo.forks_count.toLocaleString()}</span>
        </div>
        {repo.language && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>{repo.language}</span>
          </div>
        )}
      </div>

      {/* Topics */}
      {repo.topics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {repo.topics.slice(0, 5).map((topic) => (
            <span
              key={topic}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {topic}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
