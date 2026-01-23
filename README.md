# GitHub AI Trends

AI-powered analysis of GitHub trending repositories using autonomous AI agents. A full-stack application that monitors and analyzes trending AI repositories on GitHub with the Mastra AI agent framework.

## Features

- **Autonomous AI Agents**: Dual-agent system powered by Mastra framework
  - **Analyzer Agent**: Deep contextual analysis of each repository
  - **Ranking Agent**: Intelligent prioritization across all results
- **Real-time Trending Repositories**: Discover the latest AI repositories trending on GitHub
- **Structured Insights**: AI-generated summaries, key features, use cases, and value assessments
- **Time Range Filters**: View trends from today, this week, or this month
- **Minimalist UI**: Clean, modern interface built with Tailwind CSS
- **GitHub API Integration**: Direct integration with GitHub's search API

## Architecture

```
Frontend (React + TypeScript + Vite)
    ↓ API calls
Backend (Express + Node.js)
    ↓ Agent orchestration
Mastra AI Framework
    ├── Analyzer Agent (repo analysis)
    └── Ranking Agent (intelligent prioritization)
    ↓
OpenAI API (GPT-4o-mini)
```

## Tech Stack

**Frontend:**
- React 18 + TypeScript + Vite
- Tailwind CSS
- GitHub REST API (via Octokit)

**Backend:**
- Node.js + Express
- [Mastra](https://github.com/mastra-ai/mastra) AI agent framework
- OpenAI API integration

**Why Mastra?**
Mastra provides structured agent patterns, autonomous reasoning capabilities, multi-agent orchestration, and production-ready error handling - making it superior to direct API calls for building intelligent agent systems.

## Prerequisites

- Node.js 18+ and npm
- GitHub Personal Access Token (required)
- OpenAI API Key (required for AI agents)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd github-trend-ai
```

2. Install dependencies (including backend workspace):
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Add your API keys to `.env`:
```env
VITE_GITHUB_TOKEN=your_github_token_here
OPENAI_API_KEY=your_openai_key_here
VITE_BACKEND_URL=http://localhost:3001  # Optional, defaults to this
```

### Getting API Keys

**GitHub Token** (Required):
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes: `public_repo` (for public repositories)
4. Copy the token and add it to your `.env` file

**OpenAI API Key** (Required):
1. Visit [OpenAI Platform](https://platform.openai.com)
2. Navigate to API Keys section
3. Create a new API key
4. Add it to your `.env` file

Note: The OpenAI key is required for the Mastra agents to work. Without it, the app will use basic metadata-based fallback analysis.

## Usage

### Development Mode

Start both frontend and backend servers concurrently:
```bash
npm start
```

This will run:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

Or start them separately:

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd backend
npm run dev
```

### Build for Production

**Frontend:**
```bash
npm run build
```

**Backend:**
```bash
cd backend
npm run build
```

The optimized builds will be in their respective `dist` folders.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
github-trend-ai/
├── src/                         # Frontend React application
│   ├── agents/
│   │   └── repoAnalyzer.ts      # Frontend API client for Mastra backend
│   ├── components/
│   │   ├── Header.tsx           # App header component
│   │   ├── FilterBar.tsx        # Time range filter controls
│   │   └── RepositoryCard.tsx   # Repository display card
│   ├── services/
│   │   └── github.ts            # GitHub API integration
│   ├── App.tsx                  # Main application component
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Tailwind CSS imports
├── backend/                     # Backend Express + Mastra agents
│   ├── src/
│   │   ├── agent.ts             # Mastra Analyzer Agent
│   │   ├── ranking-agent.ts     # Mastra Ranking Agent
│   │   └── server.ts            # Express API server
│   └── package.json             # Backend dependencies
├── .env.example                 # Environment variables template
├── vite.config.ts               # Vite configuration
└── package.json                 # Root workspace package
```

## How It Works

1. **GitHub API Integration**: The frontend queries GitHub's search API to find repositories tagged with AI-related topics (ai, machine-learning, deep-learning, llm, etc.)

2. **Multi-Agent Analysis System**: The backend uses two specialized Mastra agents:

   **Analyzer Agent** (`agent.ts`):
   - Analyzes repository metadata (description, topics, stats)
   - Generates structured insights (summary, key features, use cases)
   - Categorizes repositories (framework, library, tool, etc.)
   - Evaluates the potential value for developers

   **Ranking Agent** (`ranking-agent.ts`):
   - Intelligently prioritizes repositories across all results
   - Makes contextual ranking decisions
   - Considers multiple factors (stars, recency, relevance, innovation)

3. **Express API Backend**:
   - `/api/analyze` - Single repository analysis
   - `/api/analyze-batch` - Batch repository analysis
   - `/api/rank` - Intelligent ranking with the Ranking Agent

4. **React Frontend**: A minimalist interface that:
   - Fetches trending repos from GitHub
   - Sends them to the backend for AI analysis
   - Displays results with structured insights
   - Provides time range filtering (daily/weekly/monthly)
   - Shows real-time loading states

## Features Explained

### Time Range Filters
- **Today**: Repositories created in the last 24 hours
- **This Week**: Repositories created in the last 7 days
- **This Month**: Repositories created in the last 30 days

### AI Agent Analysis

**Analyzer Agent** analyzes repositories and provides:
- **Summary**: What the project does
- **Key Features**: Main capabilities
- **Use Case**: Problems it solves
- **Technical Stack**: Technologies used
- **Potential Value**: Why it matters
- **Category**: Type classification

**Ranking Agent** intelligently prioritizes repositories based on:
- Innovation and uniqueness
- Community engagement (stars, forks)
- Recency and active development
- Practical value for developers
- Technical sophistication

## Customization

### Modify Search Criteria

Edit `src/services/github.ts` to change the search query:
```typescript
q: `topic:your-topics created:>${dateString}`
```

### Adjust Analysis Depth

In `src/App.tsx`, modify how many repos to analyze:
```typescript
const topRepos = repos.slice(0, 10); // Change 10 to desired number
```

### Customize AI Agents

Edit `backend/src/agent.ts` (Analyzer Agent):
- Agent instructions and prompts
- Analysis schema structure
- Model selection (gpt-4o-mini, gpt-4, etc.)

Edit `backend/src/ranking-agent.ts` (Ranking Agent):
- Ranking criteria and priorities
- Scoring logic
- Model configuration

## Troubleshooting

**"Failed to fetch repositories"**
- Check your GitHub token is valid and has the correct permissions
- Verify the token is properly set in `.env` as `VITE_GITHUB_TOKEN`

**Backend not starting / AI analysis not working**
- Ensure `OPENAI_API_KEY` is set in `.env` (required for Mastra agents)
- Check your OpenAI API credits
- Verify backend is running on port 3001: `curl http://localhost:3001/health`
- Check backend logs for errors

**Frontend can't connect to backend**
- Verify both servers are running (`npm start` or run them separately)
- Check `VITE_BACKEND_URL` in `.env` (defaults to `http://localhost:3001`)
- Ensure no firewall/CORS issues

**Rate limiting**
- GitHub API has rate limits (60 requests/hour unauthenticated, 5000/hour authenticated)
- OpenAI API has rate limits based on your tier
- Reduce the number of repositories being analyzed concurrently

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT

## Why Multi-Agent Architecture?

This project demonstrates the power of specialized AI agents:

- **Single-purpose agents** are more reliable and easier to maintain
- **Agent orchestration** allows complex workflows with simple components
- **Structured outputs** ensure consistent, predictable results
- **Mastra framework** provides production-ready patterns for agent systems

Instead of one monolithic "do everything" AI, we have focused agents that excel at specific tasks and work together seamlessly.

## Acknowledgments

- [Mastra Framework](https://github.com/mastra-ai/mastra) - AI agent framework that powers the autonomous analysis
- [Octokit](https://github.com/octokit/rest.js) - GitHub API client
- [Vite](https://vitejs.dev) - Build tool
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Express](https://expressjs.com) - Backend framework
