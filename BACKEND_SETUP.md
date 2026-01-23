# Backend Setup with Mastra

This guide shows you how to set up and use the Mastra backend for AI-powered repository analysis.

## ✨ What You Get

With the Mastra backend, you get:
- **Real AI Agent Analysis**: Uses Mastra framework with GPT-4o-mini
- **Structured Insights**: Smart categorization and feature extraction
- **Better Performance**: Server-side processing
- **Secure**: API keys never exposed to browser

## 🚀 Quick Start

### 1. Add Your OpenAI API Key

Edit the `.env` file in the project root:

```env
# Uncomment and add your key:
OPENAI_API_KEY=sk-your-key-here
```

Get your key from: https://platform.openai.com/api-keys

### 2. Start Both Servers

**Option A: Use the startup script (recommended)**
```bash
./start-dev.sh
```

**Option B: Start manually in separate terminals**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
npm run dev
```

### 3. Test It!

1. Open http://localhost:5174 (or 5173)
2. Click "This Week"
3. You should see repositories loading
4. Watch for "Analyzing with AI..." on the top repos
5. AI analysis will appear with insights!

## 📂 Project Structure

```
github-trend-ai/
├── backend/                    # Mastra backend server
│   ├── src/
│   │   ├── agent.ts           # Mastra agent configuration
│   │   └── server.ts          # Express API server
│   ├── package.json
│   └── tsconfig.json
├── src/                        # React frontend
│   ├── agents/
│   │   └── repoAnalyzer.ts    # Frontend API client
│   └── ...
└── .env                        # API keys (both services)
```

## 🔧 How It Works

```
┌─────────────┐         ┌──────────────┐         ┌──────────┐
│   React     │  HTTP   │   Express    │   AI    │  OpenAI  │
│  Frontend   ├────────>│   Backend    ├────────>│   API    │
│  (Browser)  │<────────┤  (Mastra)    │<────────┤ GPT-4o   │
└─────────────┘   JSON  └──────────────┘  JSON   └──────────┘
```

1. Frontend fetches repositories from GitHub
2. Sends repo data to backend `/api/analyze`
3. Mastra agent processes with GPT-4o-mini
4. Returns structured analysis
5. Frontend displays insights

## 🛠️ Backend API

### Health Check
```bash
curl http://localhost:3001/health
```

### Analyze Repository
```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "name": "transformers",
    "full_name": "huggingface/transformers",
    "description": "State-of-the-art ML models",
    "language": "Python",
    "topics": ["pytorch", "tensorflow"],
    "stargazers_count": 50000,
    "forks_count": 5000,
    "created_at": "2024-01-01",
    "updated_at": "2024-01-15"
  }'
```

## 🔍 Troubleshooting

### Backend won't start
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### "Cannot connect to backend"
- Make sure backend is running on port 3001
- Check backend logs for errors
- Verify `OPENAI_API_KEY` is set in `.env`

### "OpenAI API error"
- Check your API key is valid
- Verify you have credits in your OpenAI account
- Try the OpenAI API test: https://platform.openai.com/playground

### No AI analysis showing
- Open browser console (F12)
- Look for errors
- Check backend logs
- Verify both servers are running

## 💰 Cost Estimation

Using GPT-4o-mini (very affordable):
- ~$0.00015 per repository analysis
- 100 analyses ≈ $0.015 (1.5 cents)
- Very cost-effective for exploration!

## 🎯 Features

### What the Mastra Agent Does

The agent analyzes each repository and provides:

1. **Summary**: Clear description of what it does
2. **Key Features**: 3-5 standout capabilities
3. **Use Case**: Problem it solves
4. **Technical Stack**: Technologies used
5. **Potential Value**: Why it matters
6. **Category**: Automatic classification

### Customizing the Agent

Edit `backend/src/agent.ts` to modify:
- Agent instructions
- Model selection (gpt-4, gpt-4o, etc.)
- Analysis structure
- Prompts

## 🚢 Production Deployment

### Deploy Backend

**Vercel/Netlify Functions:**
```javascript
// api/analyze.js
import { analyzeRepository } from '../backend/src/agent';

export default async function handler(req, res) {
  const analysis = await analyzeRepository(req.body);
  res.json(analysis);
}
```

**Railway/Render:**
1. Connect your GitHub repo
2. Set build command: `cd backend && npm install && npm run build`
3. Set start command: `cd backend && npm start`
4. Add `OPENAI_API_KEY` environment variable

**Docker:**
```dockerfile
FROM node:18
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
RUN npm run build
CMD ["npm", "start"]
```

## 📚 Resources

- [Mastra Documentation](https://mastra.ai/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Express.js Guide](https://expressjs.com)

## 🎉 Success!

If you see AI analysis appearing on repository cards, congratulations! You've successfully integrated Mastra for intelligent AI-powered insights.

The backend runs Mastra agents properly in a Node.js environment, giving you access to the full framework capabilities including workflows, tools, and advanced agent features.
