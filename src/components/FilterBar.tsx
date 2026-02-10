import { memo, useMemo } from 'react';

interface FilterBarProps {
  timeRange: 'daily' | 'weekly' | 'monthly' | 'spikes';
  onTimeRangeChange: (range: 'daily' | 'weekly' | 'monthly' | 'spikes') => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const FilterBarComponent = ({
  timeRange,
  onTimeRangeChange,
  onRefresh,
  isLoading,
}: FilterBarProps) => {
  // Memoize ranges array to prevent recreation on every render
  const ranges = useMemo(() => [
    { value: 'daily' as const, label: 'Today' },
    { value: 'weekly' as const, label: 'This Week' },
    { value: 'monthly' as const, label: 'This Month' },
    { value: 'spikes' as const, label: 'Hot & Rising', icon: '🔥' },
  ], []);

  return (
    <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-8 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-pink-50/50 pointer-events-none"></div>

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
          <span className="text-sm font-bold text-gray-700 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Time Range
          </span>
          <div className="flex flex-wrap gap-2">
            {ranges.map((range) => (
              <button
                key={range.value}
                onClick={() => onTimeRangeChange(range.value)}
                className={`group relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  timeRange === range.value
                    ? range.value === 'spikes'
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/50'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-gray-100 text-gray-700 hover:bg-gradient-to-r hover:from-gray-200 hover:to-gray-100 hover:shadow-md'
                }`}
                disabled={isLoading}
              >
                {range.icon && <span className="mr-1.5">{range.icon}</span>}
                {range.label}
                {timeRange === range.value && (
                  <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="group relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <svg
            className={`relative w-4 h-4 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span className="relative">{isLoading ? 'Loading...' : 'Refresh'}</span>
        </button>
      </div>
    </div>
  );
};

// Memoize FilterBar - only re-render if props actually change
export const FilterBar = memo(FilterBarComponent);
