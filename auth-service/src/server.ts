import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { userStore } from './store.js';
import { hashPassword, verifyPassword, signJWT, verifyJWT, sanitizeUser } from './auth.js';
import type { SignupInput, LoginInput } from './types.js';

export const PORT = parseInt(process.env.PORT || '5001', 10);

function sendJson(res: http.ServerResponse, statusCode: number, data: any) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id, x-user-id',
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody<T>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) { // 1MB ceiling
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

export const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id, x-user-id',
    });
    return res.end();
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;
  const method = req.method;

  try {
    // Health check
    if (path === '/health' && method === 'GET') {
      return sendJson(res, 200, {
        status: 'ok',
        service: 'evidex-auth-service',
        timestamp: new Date().toISOString(),
      });
    }

    // SIGNUP: POST /api/v1/auth/signup
    if (path === '/api/v1/auth/signup' && method === 'POST') {
      const body = await parseJsonBody<SignupInput>(req);
      const { email, password, name, tenantId } = body;

      if (!email || !password || !name) {
        return sendJson(res, 400, { message: 'Missing required fields: email, password, and name are required.' });
      }

      // ponytail: basic strength checks — upgrade path is zxcvbn or NIST-style entropy scoring
      const passwordErrors: string[] = [];
      if (password.length < 8) passwordErrors.push('at least 8 characters');
      if (!/[A-Z]/.test(password)) passwordErrors.push('one uppercase letter');
      if (!/[a-z]/.test(password)) passwordErrors.push('one lowercase letter');
      if (!/[0-9]/.test(password)) passwordErrors.push('one digit');
      if (passwordErrors.length > 0) {
        return sendJson(res, 400, { message: `Password must contain: ${passwordErrors.join(', ')}.` });
      }

      const existing = userStore.findByEmail(email);
      if (existing) {
        return sendJson(res, 409, { message: 'An account with this email already exists.' });
      }

      const { hash, salt } = hashPassword(password);
      const effectiveTenant = tenantId?.trim() || `tenant_${Date.now().toString(36)}`;
      const user = userStore.create({
        email,
        name,
        tenantId: effectiveTenant,
        passwordHash: hash,
        salt,
      });

      const tokenPayload = {
        sub: user.id,
        email: user.email,
        name: user.name,
        tenant_id: user.tenantId,
        'custom:tenant_id': user.tenantId,
      };

      const token = signJWT(tokenPayload);

      return sendJson(res, 201, {
        message: 'Account created successfully',
        accessToken: token,
        idToken: token,
        user: sanitizeUser(user),
      });
    }

    // LOGIN: POST /api/v1/auth/login
    if (path === '/api/v1/auth/login' && method === 'POST') {
      const body = await parseJsonBody<LoginInput>(req);
      const { email, password } = body;

      if (!email || !password) {
        return sendJson(res, 400, { message: 'Email and password are required.' });
      }

      const user = userStore.findByEmail(email);
      if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
        return sendJson(res, 401, { message: 'Invalid email or password.' });
      }

      const tokenPayload = {
        sub: user.id,
        email: user.email,
        name: user.name,
        tenant_id: user.tenantId,
        'custom:tenant_id': user.tenantId,
      };

      const token = signJWT(tokenPayload);

      return sendJson(res, 200, {
        message: 'Login successful',
        accessToken: token,
        idToken: token,
        user: sanitizeUser(user),
      });
    }

    // CURRENT USER: GET /api/v1/auth/me
    if (path === '/api/v1/auth/me' && method === 'GET') {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return sendJson(res, 401, { message: 'Missing or malformed Authorization header.' });
      }

      const token = authHeader.substring(7);
      const payload = verifyJWT(token);
      if (!payload) {
        return sendJson(res, 401, { message: 'Invalid or expired session token.' });
      }

      const user = userStore.findById(payload.sub);
      if (!user) {
        return sendJson(res, 404, { message: 'User not found.' });
      }

      return sendJson(res, 200, {
        user: sanitizeUser(user),
        tokenPayload: payload,
      });
    }

    // TOKEN VERIFICATION: POST /api/v1/auth/verify
    if (path === '/api/v1/auth/verify' && method === 'POST') {
      const body = await parseJsonBody<{ token: string }>(req);
      if (!body.token) {
        return sendJson(res, 400, { valid: false, message: 'Token is required' });
      }

      const payload = verifyJWT(body.token);
      if (!payload) {
        return sendJson(res, 401, { valid: false, message: 'Invalid or expired token' });
      }

      return sendJson(res, 200, { valid: true, payload });
    }

    // LOGOUT: POST /api/v1/auth/logout
    if (path === '/api/v1/auth/logout' && method === 'POST') {
      return sendJson(res, 200, { message: 'Logged out successfully' });
    }

    // 404 Not Found
    return sendJson(res, 404, { message: `Route ${method} ${path} not found` });
  } catch (err: any) {
    console.error('Unhandled Auth Microservice Error:', err);
    return sendJson(res, 500, { message: err.message || 'Internal server error' });
  }
});

// Start listener only if run as main script
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] === currentFile) {
  server.listen(PORT, () => {
    console.log(`[Evidex Auth Microservice] Running on http://localhost:${PORT}`);
    console.log(`[Evidex Auth Microservice] Demo account seeded: demo@evidex.local / Password123!`);
  });
}

export default server;
