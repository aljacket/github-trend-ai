# Quick Start Guide

Get up and running with GitHub AI Trends in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Get Your GitHub Token

You need a GitHub token to access the GitHub API:

1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name like "GitHub AI Trends"
4. Select the `public_repo` scope
5. Click "Generate token"
6. Copy the token (you won't see it again!)

## Step 3: Create Environment File

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Then open `.env` and add your GitHub token:

```env
VITE_GITHUB_TOKEN=github_pat_YOUR_TOKEN_HERE
```

## Step 4: Run the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser!

## Optional: Enable AI Analysis

For AI-powered repository analysis, add an OpenAI API key:

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to `.env`:

```env
VITE_OPENAI_API_KEY=sk-YOUR_KEY_HERE
```

The app works fine without this - you just won't see AI-generated insights.

## What You'll See

- A list of trending AI repositories from GitHub
- Repository stats (stars, forks, language)
- Topics and tags
- AI analysis (if OpenAI key is configured)
- Time filters (Today, This Week, This Month)

## Troubleshooting

**"Failed to fetch repositories"**
→ Check your GitHub token in the `.env` file

**No repositories showing**
→ Try changing the time range filter

**AI analysis not working**
→ This is optional - add an OpenAI key to enable it

## Next Steps

- Customize the search query in `src/services/github.ts`
- Modify the AI agent behavior in `src/agents/repoAnalyzer.ts`
- Adjust the UI styling in component files

Happy exploring! 🚀
