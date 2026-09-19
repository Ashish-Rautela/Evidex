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

Install dependencies for both the backend and frontend:

```bash
# Backend
cd backend
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
2. Backend development:
   - `npm run build`: Compile and bundle Lambda handlers
   - `npm run test`: Run unit tests with Vitest
   - `npm run typecheck`: Run TypeScript compiler type checking
3. Frontend development:
   - `npm run dev`: Start local Vite dev server
