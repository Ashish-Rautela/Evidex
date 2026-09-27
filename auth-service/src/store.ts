import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { User } from './types.js';
import { hashPassword } from './auth.js';

// ponytail: local JSON file store keeps microservice zero-dependency and persistent across restarts;
// upgrade path for multi-replica prod is Amazon Aurora / DynamoDB / Cognito
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

export class UserStore {
  private users: Map<string, User> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const list: User[] = JSON.parse(raw);
        for (const u of list) {
          this.users.set(u.id, u);
        }
      }

      // Seed demo account if empty
      if (this.users.size === 0) {
        this.seedDemoUser();
      }
    } catch (err) {
      console.warn('Could not read user store file, starting in-memory:', err);
      this.seedDemoUser();
    }
  }

  private seedDemoUser() {
    const { hash, salt } = hashPassword('Password123!');
    const demoUser: User = {
      id: 'usr_demo_evidex_01',
      email: 'demo@evidex.local',
      name: 'Alex Vance',
      tenantId: 'demo-tenant',
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(demoUser.id, demoUser);
    this.persist();
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = JSON.stringify(Array.from(this.users.values()), null, 2);
      fs.writeFileSync(DATA_FILE, data, 'utf8');
    } catch (err) {
      console.error('Failed to persist user store:', err);
    }
  }

  public findByEmail(email: string): User | undefined {
    const normalized = email.trim().toLowerCase();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === normalized) {
        return u;
      }
    }
    return undefined;
  }

  public findById(id: string): User | undefined {
    return this.users.get(id);
  }

  public create(data: { email: string; name: string; tenantId: string; passwordHash: string; salt: string }): User {
    const id = `usr_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();
    const newUser: User = {
      id,
      email: data.email.trim().toLowerCase(),
      name: data.name.trim(),
      tenantId: data.tenantId.trim() || `tenant_${crypto.randomBytes(4).toString('hex')}`,
      passwordHash: data.passwordHash,
      salt: data.salt,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(id, newUser);
    this.persist();
    return newUser;
  }
}

export const userStore = new UserStore();
