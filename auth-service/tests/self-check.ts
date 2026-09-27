import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, signJWT, verifyJWT, sanitizeUser } from '../src/auth.js';
import { UserStore } from '../src/store.js';

console.log('Running auth-service self-checks...');

// 1. Password hashing & verification
const pwd = 'TestSecretPassword123!';
const { hash, salt } = hashPassword(pwd);
assert(verifyPassword(pwd, hash, salt), 'Password verification must succeed for valid password');
assert(!verifyPassword('WrongPassword', hash, salt), 'Password verification must fail for invalid password');

// 2. JWT signing & verification
const payload = {
  sub: 'usr_test_123',
  email: 'test@evidex.local',
  name: 'Test Agent',
  tenant_id: 'test-tenant',
  'custom:tenant_id': 'test-tenant',
};
const token = signJWT(payload);
assert(typeof token === 'string' && token.split('.').length === 3, 'Token must be standard 3-part JWT');

const decoded = verifyJWT(token);
assert(decoded !== null, 'Valid JWT must verify');
assert.equal(decoded?.sub, payload.sub, 'Subject in JWT payload must match');
assert.equal(decoded?.['custom:tenant_id'], payload['custom:tenant_id'], 'custom:tenant_id must match');

// 3. Invalid token rejection
assert.equal(verifyJWT(token + 'tampered'), null, 'Tampered JWT must be rejected');

// 4. Store operations
const store = new UserStore();
const testUser = store.create({
  email: `test_${Date.now()}@evidex.local`,
  name: 'Tester',
  tenantId: 'tenant-test',
  passwordHash: hash,
  salt,
});
assert(store.findByEmail(testUser.email) !== undefined, 'User must be found by email');
assert(store.findById(testUser.id) !== undefined, 'User must be found by id');

console.log('All auth-service self-checks PASSED!');
