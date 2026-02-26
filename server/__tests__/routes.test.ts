import request from 'supertest';

// mock database functions to avoid native bindings
jest.mock('../src/db', () => {
  let data: any[] = [];
  return {
    initDb: jest.fn(() => {}),
    getDb: jest.fn(() => ({
      prepare: () => ({ run: jest.fn(), all: jest.fn(() => data), get: jest.fn() }),
    })),
    db: {
      exec: jest.fn(),
    },
  };
});

import { createServer } from '../src/index';

let app: any;

beforeAll(() => {
  app = createServer();
});

describe('Auth and payment routes', () => {
  const testEmail = 'tester@example.com';
  const password = 'password123';
  let token: string;

  it('should register a user', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ email: testEmail, name: 'Tester', password });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(testEmail);
  });

  it('should login the user and return a token', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: testEmail, password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('should not allow unauthorized payment charge', async () => {
    const res = await request(app)
      .post('/api/payments/charge')
      .send({ amount: 100, methodType: 'CARD', referenceId: 'never' });
    expect(res.status).toBe(401);
  });

  it('should charge ledger when authenticated', async () => {
    const res = await request(app)
      .post('/api/payments/charge')
      .set('authorization', `Bearer ${token}`)
      .send({ amount: 42, methodType: 'CARD', referenceId: 'abc123' });
    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(42);
  });
});
