import assert from 'node:assert/strict';
import http from 'node:http';
import server from '../src/server.js';

const PORT = 5099;

server.listen(PORT, async () => {
  try {
    console.log(`Integration test server running on port ${PORT}...`);

    // Helper for requests
    async function request(path: string, options: { method: string; body?: any; headers?: any }) {
      const res = await fetch(`http://localhost:${PORT}${path}`, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
      const data = await res.json();
      return { status: res.status, data };
    }

    // 1. Health check
    const health = await request('/health', { method: 'GET' });
    assert.equal(health.status, 200, 'Health check should return 200');
    assert.equal(health.data.status, 'ok', 'Health status should be ok');

    // 2. Login with seeded demo user
    const demoLogin = await request('/api/v1/auth/login', {
      method: 'POST',
      body: { email: 'demo@evidex.local', password: 'Password123!' },
    });
    assert.equal(demoLogin.status, 200, 'Demo login should succeed');
    assert(demoLogin.data.accessToken, 'Access token should be returned');
    assert(demoLogin.data.idToken, 'ID token should be returned');
    assert.equal(demoLogin.data.user.email, 'demo@evidex.local', 'User email should match');

    // 3. Signup with new user
    const newUserEmail = `tester_${Date.now()}@evidex.local`;
    const signupRes = await request('/api/v1/auth/signup', {
      method: 'POST',
      body: {
        name: 'Retro Mac User',
        email: newUserEmail,
        password: 'SecurePassword2026!',
        tenantId: 'retro-tenant',
      },
    });
    assert.equal(signupRes.status, 201, 'Signup should return 201');
    assert(signupRes.data.idToken, 'Signup should return token');
    assert.equal(signupRes.data.user.tenantId, 'retro-tenant', 'Tenant ID should match');

    // 4. Verify /me with token
    const meRes = await request('/api/v1/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${signupRes.data.idToken}` },
    });
    assert.equal(meRes.status, 200, '/me should return 200');
    assert.equal(meRes.data.user.email, newUserEmail, '/me email should match');

    // 5. Verify /verify endpoint
    const verifyRes = await request('/api/v1/auth/verify', {
      method: 'POST',
      body: { token: signupRes.data.idToken },
    });
    assert.equal(verifyRes.status, 200, 'Token verification should succeed');
    assert.equal(verifyRes.data.valid, true, 'Token should be marked valid');

    // 6. Test invalid login
    const badLogin = await request('/api/v1/auth/login', {
      method: 'POST',
      body: { email: newUserEmail, password: 'WrongPassword' },
    });
    assert.equal(badLogin.status, 401, 'Invalid password should return 401');

    console.log('All auth-service integration tests PASSED successfully!');
  } catch (err) {
    console.error('Integration test failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
});
