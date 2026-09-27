# Evidex

Legal Contract Intelligence & Semantic Search Engine

## Tech Stack

- TypeScript
- AWS Lambda
- Aurora PostgreSQL + pgvector
- Amazon Textract
- Amazon Bedrock
- React + Vite

## Prerequisites

- Node.js 20+
- AWS CLI
- AWS SAM CLI

## Setup

Install dependencies for backend, frontend, and auth microservice:

```bash
# Auth Microservice
cd auth-service
npm install

# Backend
cd ../backend
npm install

# Frontend
cd ../frontend
npm install
```

## Deployment

Build and deploy AWS resources using SAM CLI:

```bash
sam build
sam deploy
```

## Local Dev

1. Copy `.env.example` to `.env` and configure local database and AWS settings.
2. Auth microservice:
   - `npm run dev` in `auth-service` (starts standalone auth service on `http://localhost:5001`)
   - Default seeded credentials: `demo@evidex.local` / `Password123!`
3. Backend development:
   - `npm run build`: Compile and bundle Lambda handlers
   - `npm run test`: Run unit tests with Vitest
   - `npm run typecheck`: Run TypeScript compiler type checking
4. Frontend development:
   - `npm run dev`: Start local Vite dev server
