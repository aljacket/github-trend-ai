# GitHub AI Trends

A modern React application that monitors and analyzes trending AI repositories on GitHub using the Mastra AI framework.

## Features

- **Real-time Trending Repositories**: Discover the latest AI repositories trending on GitHub
- **AI-Powered Analysis**: Uses Mastra framework to provide intelligent insights about repositories
- **Time Range Filters**: View trends from today, this week, or this month
- **Minimalist UI**: Clean, modern interface built with Tailwind CSS
- **Repository Insights**: Get AI-generated summaries, key features, and value assessments
- **GitHub API Integration**: Direct integration with GitHub's search API

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI Analysis**: OpenAI API (direct integration)
- **APIs**: GitHub REST API (via Octokit)
- **Inspiration**: Project structure inspired by [Mastra](https://github.com/mastra-ai/mastra) AI agent framework

> **Note**: While this project was inspired by Mastra, the current implementation uses direct OpenAI API calls since Mastra requires a server-side environment. See `MASTRA_NOTES.md` for information on implementing full Mastra integration with a backend server.

## Prerequisites

- Node.js 18+ and npm
- GitHub Personal Access Token (required)
- OpenAI API Key (optional - for AI analysis features)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd github-trend-ai
```

2. Install dependencies:
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
VITE_OPENAI_API_KEY=your_openai_key_here  # Optional
```

### Getting API Keys

**GitHub Token** (Required):
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes: `public_repo` (for public repositories)
4. Copy the token and add it to your `.env` file

**OpenAI API Key** (Optional - for AI analysis):
1. Visit [OpenAI Platform](https://platform.openai.com)
2. Navigate to API Keys section
3. Create a new API key
4. Add it to your `.env` file

Note: The app will work without the OpenAI key, but AI analysis features will be disabled.

## Usage

### Development Mode

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The optimized build will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
github-trend-ai/
├── src/
│   ├── agents/
│   │   └── repoAnalyzer.ts      # Mastra AI agent for repository analysis
│   ├── components/
│   │   ├── Header.tsx           # App header component
│   │   ├── FilterBar.tsx        # Time range filter controls
│   │   └── RepositoryCard.tsx   # Repository display card
│   ├── services/
│   │   └── github.ts            # GitHub API integration
│   ├── App.tsx                  # Main application component
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Tailwind CSS imports
├── .env.example                 # Environment variables template
├── vite.config.ts               # Vite configuration (includes Tailwind)
└── package.json
```

## How It Works

1. **GitHub API Integration**: The app queries GitHub's search API to find repositories tagged with AI-related topics (ai, machine-learning, deep-learning, llm, etc.)

2. **Mastra AI Agent**: When an OpenAI key is provided, the Mastra framework powers an AI agent that:
   - Analyzes repository metadata (description, topics, stats)
   - Generates structured insights (summary, key features, use cases)
   - Categorizes repositories (framework, library, tool, etc.)
   - Evaluates the potential value for developers

3. **React Frontend**: A minimalist interface displays repositories with:
   - Repository cards with stats and metadata
   - AI-generated analysis (when available)
   - Time range filtering (daily/weekly/monthly)
   - Real-time loading states

## Features Explained

### Time Range Filters
- **Today**: Repositories created in the last 24 hours
- **This Week**: Repositories created in the last 7 days
- **This Month**: Repositories created in the last 30 days

### AI Analysis
The Mastra agent analyzes the top 10 repositories and provides:
- **Summary**: What the project does
- **Key Features**: Main capabilities
- **Use Case**: Problems it solves
- **Technical Stack**: Technologies used
- **Potential Value**: Why it matters
- **Category**: Type classification

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

### Customize AI Agent

Edit `src/agents/repoAnalyzer.ts` to modify:
- Agent instructions
- Analysis schema
- Model selection (gpt-4o-mini, gpt-4, etc.)

## Troubleshooting

**"Failed to fetch repositories"**
- Check your GitHub token is valid and has the correct permissions
- Verify the token is properly set in `.env`

**AI analysis not working**
- Ensure VITE_OPENAI_API_KEY is set (optional feature)
- Check your OpenAI API credits

**Rate limiting**
- GitHub API has rate limits (60 requests/hour unauthenticated, 5000/hour authenticated)
- Reduce the number of repositories being analyzed

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT

## Acknowledgments

- [Mastra Framework](https://github.com/mastra-ai/mastra) - AI agent framework
- [Octokit](https://github.com/octokit/rest.js) - GitHub API client
- [Vite](https://vitejs.dev) - Build tool
- [Tailwind CSS](https://tailwindcss.com) - Styling
