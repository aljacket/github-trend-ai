import { memo } from 'react';

// Memoize Header since it never changes - pure static component
const HeaderComponent = () => {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 py-16 mb-12">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center text-center">
          {/* Logo with pulse animation */}
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 shadow-2xl">
              <svg
                className="w-16 h-16 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
          </div>

          {/* Title with gradient */}
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">
            GitHub AI Trends
          </h1>

          {/* Subtitle with glassmorphism */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 shadow-xl">
            <p className="text-white/90 text-lg font-medium">
              Discover the most innovative AI repositories, ranked by AI agents
            </p>
          </div>

          {/* Stats badges */}
          <div className="flex gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
              <span className="text-white/90 text-sm font-medium">⚡ Real-time</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
              <span className="text-white/90 text-sm font-medium">🤖 AI-Powered</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
              <span className="text-white/90 text-sm font-medium">🔥 Trending</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export const Header = memo(HeaderComponent);
