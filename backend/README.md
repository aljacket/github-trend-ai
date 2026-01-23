# Mastra Backend for GitHub AI Trends

This is the backend server that powers AI analysis using the Mastra framework.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Add OpenAI API key to `.env`:**
   ```bash
   # In the root .env file, add:
   OPENAI_API_KEY=your_openai_key_here
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /health
```

Returns server status.

### Analyze Single Repository
```
POST /api/analyze
Content-Type: application/json

{
  "name": "repo-name",
  "full_name": "owner/repo-name",
  "description": "Repository description",
  "language": "Python",
  "topics": ["ml", "ai"],
  "stargazers_count": 1000,
  "forks_count": 50,
  "created_at": "2024-01-01",
  "updated_at": "2024-01-15"
}
```

Returns:
```json
{
  "summary": "Description of the project",
  "keyFeatures": ["feature1", "feature2"],
  "useCase": "Primary use case",
  "technicalStack": ["Python", "TensorFlow"],
  "potentialValue": "Why it's valuable",
  "category": "library"
}
```

### Analyze Multiple Repositories
```
POST /api/analyze-batch
Content-Type: application/json

{
  "repositories": [...]
}
```

## Development

```bash
npm run dev     # Start with hot reload
npm run build   # Build for production
npm run start   # Run production build
```

## Tech Stack

- **Express**: Web framework
- **Mastra**: AI agent framework
- **TypeScript**: Type safety
- **OpenAI GPT-4o-mini**: AI model

## How It Works

1. Frontend sends repository data to `/api/analyze`
2. Mastra agent processes the data with GPT-4o-mini
3. Agent returns structured analysis
4. Frontend displays the insights

The Mastra agent is configured with specific instructions to analyze GitHub repositories and return structured data about their purpose, features, and value.
