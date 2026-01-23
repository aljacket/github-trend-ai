# Mastra Framework Integration Notes

## Current Implementation

The current implementation uses **direct OpenAI API calls** instead of the full Mastra framework because Mastra requires Node.js modules (crypto, fs, stream, etc.) that aren't available in the browser environment.

## Why Not Full Mastra in Browser?

Mastra is designed for server-side applications and includes features like:
- File system access for workflows
- Server-side cryptographic operations
- Node.js streams for data processing
- Model Context Protocol (MCP) servers

These features require a Node.js environment and cannot run directly in the browser with Vite/React.

## Recommended Architecture for Full Mastra Integration

To use Mastra's full capabilities, consider this architecture:

### Option 1: Backend API with Mastra (Recommended)

```
Frontend (React)  →  Backend API (Node.js/Express)  →  Mastra Agents
                        ↓
                   GitHub API + OpenAI
```

**Setup:**

1. Create a separate backend folder:
```bash
mkdir backend
cd backend
npm init -y
npm install @mastra/core express cors dotenv
```

2. Create an Express server (`backend/server.js`):
```javascript
import { Agent } from '@mastra/core/agent';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const repoAnalyzer = new Agent({
  id: 'repo-analyzer',
  name: 'Repository Analyzer',
  instructions: '...',
  model: 'openai/gpt-4o-mini',
});

app.post('/api/analyze', async (req, res) => {
  const { repo } = req.body;
  const analysis = await repoAnalyzer.generate(prompt);
  res.json(analysis);
});

app.listen(3000);
```

3. Update frontend to call the backend:
```typescript
const response = await fetch('http://localhost:3000/api/analyze', {
  method: 'POST',
  body: JSON.stringify({ repo }),
});
```

### Option 2: Serverless Functions

Deploy Mastra agents as serverless functions:
- **Vercel Functions**: `/api/analyze.ts`
- **Netlify Functions**: `netlify/functions/analyze.ts`
- **AWS Lambda**: With API Gateway

Example Vercel function:
```typescript
// api/analyze.ts
import { Agent } from '@mastra/core/agent';

export default async function handler(req, res) {
  const agent = new Agent({...});
  const result = await agent.generate(req.body.prompt);
  res.json(result);
}
```

### Option 3: Next.js with App Router

Use Next.js which supports both client and server components:
- Server Components can use Mastra directly
- API Routes can expose Mastra agents
- Client components consume the API

```typescript
// app/api/analyze/route.ts
import { Agent } from '@mastra/core/agent';

export async function POST(request: Request) {
  const agent = new Agent({...});
  const data = await request.json();
  const result = await agent.generate(data.prompt);
  return Response.json(result);
}
```

## Benefits of Using Full Mastra

When you implement server-side Mastra:

1. **Advanced Features**:
   - Multi-step workflows with `.then()`, `.branch()`, `.parallel()`
   - Human-in-the-loop for approval workflows
   - Persistent memory across conversations
   - Tool integration (APIs, databases, file systems)

2. **Better Performance**:
   - Batch processing of repositories
   - Caching and rate limiting
   - Background job processing

3. **Enhanced Security**:
   - API keys never exposed to frontend
   - Request validation and rate limiting
   - Secure data handling

## Current vs Full Mastra Comparison

| Feature | Current (Direct API) | Full Mastra (Server-Side) |
|---------|---------------------|---------------------------|
| Browser Support | ✅ Yes | ❌ No |
| Complex Workflows | ❌ No | ✅ Yes |
| Multi-step Reasoning | ❌ No | ✅ Yes |
| Tool Integration | ❌ Limited | ✅ Extensive |
| Memory/Context | ❌ No | ✅ Yes |
| API Key Security | ⚠️ Exposed | ✅ Secure |
| Setup Complexity | ✅ Simple | ⚠️ Moderate |

## Migration Path

To migrate from the current implementation to full Mastra:

1. Keep the current React frontend as-is
2. Create a backend service with Mastra
3. Replace direct OpenAI API calls with backend API calls
4. Gradually add advanced Mastra features (workflows, tools, memory)

## Resources

- [Mastra Documentation](https://mastra.ai/docs)
- [Mastra GitHub](https://github.com/mastra-ai/mastra)
- [Mastra Templates](https://mastra.ai/templates)
- [Discord Community](https://discord.gg/BTYqqHKUrf)

## Conclusion

The current implementation provides a working solution that runs entirely in the browser. For production applications that need advanced AI agent capabilities, consider implementing a backend service with full Mastra integration.
