// Integration tests: real HTTP requests against the real app and a real
// (in-memory) database. Covers US-1 account access.

const request = require('supertest');
const sequelize = require('../server/db');
const { createApp } = require('../server/app');
const { createUser, auth } = require('./helpers');

const app = createApp();

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /api/auth/register', () => {
  const body = { name: 'Alex Rivera', email: 'alex@example.com', password: 'supersecret1' };

  test('creates a requester account and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ name: 'Alex Rivera', email: 'alex@example.com', role: 'requester' });
  });

  test('never returns the password or its hash', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...body, email: 'nohash@example.com' });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  test('ignores a role sent in the request (no self-promotion)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...body, email: 'sneaky@example.com', role: 'manager' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('requester');
  });

  test('rejects a duplicate email, even with different capitalization', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...body, email: 'ALEX@example.com' });
    expect(res.status).toBe(409);
    expect(res.body.fields.email).toMatch(/already exists/i);
  });

  test('rejects a password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...body, email: 'short@example.com', password: '1234567' });
    expect(res.status).toBe(400);
    expect(res.body.fields.password).toBeDefined();
  });

  test('rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.fields)).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  test('rejects a request body that is not valid JSON', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"name": ');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/valid JSON/i);
  });
});

describe('POST /api/auth/login', () => {
  let creds;

  beforeAll(async () => {
    const { user, password } = await createUser({ email: 'login@example.com' });
    creds = { email: user.email, password };
  });

  test('logs in with the right password', async () => {
    const res = await request(app).post('/api/auth/login').send(creds);
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe('login@example.com');
  });

  test('is not case sensitive for the email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ ...creds, email: 'LOGIN@example.com' });
    expect(res.status).toBe(200);
  });

  test('wrong password and unknown email give the same error', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ ...creds, password: 'not-the-password' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever123' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error).toBe(unknownEmail.body.error);
  });

  test('rejects an empty login', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me and protected routes', () => {
  test('returns the logged-in user', async () => {
    const { token } = await createUser({ email: 'me@example.com', name: 'Me Myself' });
    const res = await request(app).get('/api/auth/me').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Me Myself');
  });

  test('rejects a request with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('rejects a garbage token', async () => {
    const res = await request(app).get('/api/auth/me').set(auth('not.a.real.token'));
    expect(res.status).toBe(401);
  });
});

describe('misc API behavior', () => {
  test('health check reports ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('unknown API routes return JSON 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
