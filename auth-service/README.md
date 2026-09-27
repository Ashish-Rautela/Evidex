# Evidex Authentication Microservice

Standalone, lightweight authentication microservice for Evidex Contract Intelligence platform.

## Features
- **Zero Heavy Dependencies**: Built using standard Node.js runtime and native `node:crypto` (HMAC-SHA256 JWTs & scrypt password hashing).
- **Persistent Storage**: Atomic JSON persistence with default seeded demo credentials.
- **Evidex Backend Compatible**: Emits standard JWT claims (`sub`, `tenant_id`, `custom:tenant_id`) expected by Evidex Lambda authorizers and services.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/signup` | Register new user (email, password, name, tenantId) |
| `POST` | `/api/v1/auth/login` | Authenticate with email & password |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile (`Bearer <token>`) |
| `POST` | `/api/v1/auth/verify` | Verify JWT validity |
| `POST` | `/api/v1/auth/logout` | Session teardown / logout |
| `GET` | `/health` | Service health status |

## Quick Start

```bash
cd auth-service
npm install
npm run dev # Starts server on http://localhost:5001
```

Default demo credentials:
- **Email**: `demo@evidex.local`
- **Password**: `Password123!`
- **Tenant**: `demo-tenant`
