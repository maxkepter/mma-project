# MMA AI Service

Python FastAPI server for AI-powered lottery analysis using LangChain and Google AI.

## Setup

### 1. Create virtual environment (optional but recommended)

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Edit `.env`:
- `GOOGLE_API_KEY` — Your Google AI API key
- `LANGCHAIN_API_KEY` — Your LangChain API key (optional)
- `AI_PORT` — Port to run the service (default: 8000)

## Development

### Run server

```bash
python main.py
```

Server will start at `http://localhost:8000`

### View API documentation

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Health Check
- **GET** `/health` — Check service health

### Analysis
- **POST** `/analyze` — Analyze lottery data
  - Request: `{ data: string, context?: string }`
  - Response: `{ result: string, confidence?: float, metadata?: object }`

### Predictions
- **POST** `/predict` — Generate predictions
  - Request: `{ data: string, context?: string }`
  - Response: `{ predicted_numbers: number[], probability: float, reasoning: string }`

### Chat
- **POST** `/chat` — Chat with AI
  - Request: `{ data: string, context?: string }`
  - Response: `{ message: string, timestamp: string }`

## Architecture

```
ai/
├── main.py              # FastAPI app & routes
├── requirements.txt     # Python dependencies
├── .env.example        # Environment template
├── .env                # Environment config (local)
└── README.md           # Documentation
```

## Integration with NestJS Backend

The AI service runs independently on port 8000. To integrate with NestJS backend on port 3000, add API client in `server/src/ai/`:

```typescript
// server/src/ai/ai.client.ts
import axios from 'axios';

export const aiClient = axios.create({
  baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
});
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PORT` | 8000 | Server port |
| `AI_HOST` | 0.0.0.0 | Server host |
| `GOOGLE_API_KEY` | - | Google AI API key |
| `LANGCHAIN_API_KEY` | - | LangChain API key |
| `NODE_ENV` | development | Environment |

## Next Steps

- [ ] Implement LangChain integration
- [ ] Implement Google AI models for analysis
- [ ] Add streaming responses for chat endpoint
- [ ] Add database integration for conversation history
- [ ] Add authentication/authorization
- [ ] Add rate limiting
- [ ] Dockerize the service
