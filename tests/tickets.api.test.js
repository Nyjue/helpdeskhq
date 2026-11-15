// Integration tests for US-2 (submit), US-3 (track my tickets), and US-4
// (technician queue), including the role and ownership rules.

const request = require('supertest');
const sequelize = require('../server/db');
const { Ticket } = require('../server/models');
const { createApp } = require('../server/app');
const { createUser, auth, validTicket } = require('./helpers');

const app = createApp();
let alice; // requester
let bob; // requester
let tech; // technician
let boss; // manager

beforeAll(async () => {
  await sequelize.sync({ force: true });
  alice = await createUser({ name: 'Alice', email: 'alice@example.com' });
  bob = await createUser({ name: 'Bob', email: 'bob@example.com' });
  tech = await createUser({ name: 'Tess Tech', email: 'tech@example.com', role: 'technician' });
  boss = await createUser({ name: 'Bo Boss', email: 'boss@example.com', role: 'manager' });
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /api/tickets (US-2)', () => {
  test('creates an Open ticket owned by the logged-in user', async () => {
    const res = await request(app).post('/api/tickets').set(auth(alice.token)).send(validTicket());
    expect(res.status).toBe(201);
    expect(res.body.ticket).toMatchObject({
      title: 'Laptop will not turn on',
      category: 'Hardware',
      priority: 'High',
      status: 'Open',
      requester: { id: alice.user.id, name: 'Alice' },
    });
    expect(res.body.ticket.id).toEqual(expect.any(Number));
    expect(res.body.ticket.createdAt).toBeDefined();
  });

  test('requires login', async () => {
    const res = await request(app).post('/api/tickets').send(validTicket());
    expect(res.status).toBe(401);
  });

  test('returns an error for each empty field', async () => {
    const res = await request(app).post('/api/tickets').set(auth(alice.token)).send({});
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.fields).sort()).toEqual(['category', 'description', 'priority', 'title']);
  });

  test('rejects an invalid category', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set(auth(alice.token))
      .send(validTicket({ category: 'Plumbing' }));
    expect(res.status).toBe(400);
    expect(res.body.fields.category).toBeDefined();
  });

  test('ignores a status or requester sent by the client', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set(auth(alice.token))
      .send(validTicket({ status: 'Closed', requesterId: bob.user.id }));
    expect(res.status).toBe(201);
    expect(res.body.ticket.status).toBe('Open');
    expect(res.body.ticket.requester.id).toBe(alice.user.id);
  });
});

describe('GET /api/tickets/mine (US-3)', () => {
  test('lists only the logged-in requester\'s tickets, newest first', async () => {
    await Ticket.destroy({ where: {} });
    const first = await request(app).post('/api/tickets').set(auth(bob.token)).send(validTicket({ title: 'Bob first' }));
    const second = await request(app).post('/api/tickets').set(auth(bob.token)).send(validTicket({ title: 'Bob second' }));
    await request(app).post('/api/tickets').set(auth(alice.token)).send(validTicket({ title: 'Alice only' }));

    const res = await request(app).get('/api/tickets/mine').set(auth(bob.token));
    expect(res.status).toBe(200);
    expect(res.body.tickets.map((t) => t.title)).toEqual(['Bob second', 'Bob first']);
    expect(res.body.tickets[0].id).toBe(second.body.ticket.id);
    expect(res.body.tickets[1].id).toBe(first.body.ticket.id);
  });

  test('is empty for a user with no tickets', async () => {
    const { token } = await createUser({ email: 'empty@example.com' });
    const res = await request(app).get('/api/tickets/mine').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.tickets).toEqual([]);
  });

  test('requires login', async () => {
    const res = await request(app).get('/api/tickets/mine');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/tickets/:id (US-3 privacy)', () => {
  let aliceTicketId;

  beforeAll(async () => {
    const res = await request(app).post('/api/tickets').set(auth(alice.token)).send(validTicket({ title: 'Alice private' }));
    aliceTicketId = res.body.ticket.id;
  });

  test('the owner can open their ticket', async () => {
    const res = await request(app).get(`/api/tickets/${aliceTicketId}`).set(auth(alice.token));
    expect(res.status).toBe(200);
    expect(res.body.ticket.title).toBe('Alice private');
  });

  test('another requester cannot open it, even by guessing the id', async () => {
    const res = await request(app).get(`/api/tickets/${aliceTicketId}`).set(auth(bob.token));
    expect(res.status).toBe(404);
  });

  test('a technician and a manager can open any ticket', async () => {
    const asTech = await request(app).get(`/api/tickets/${aliceTicketId}`).set(auth(tech.token));
    const asBoss = await request(app).get(`/api/tickets/${aliceTicketId}`).set(auth(boss.token));
    expect(asTech.status).toBe(200);
    expect(asBoss.status).toBe(200);
  });

  test('a missing or non-numeric id returns 404', async () => {
    const missing = await request(app).get('/api/tickets/999999').set(auth(alice.token));
    const garbage = await request(app).get('/api/tickets/abc').set(auth(alice.token));
    expect(missing.status).toBe(404);
    expect(garbage.status).toBe(404);
  });
});

describe('GET /api/tickets/queue (US-4)', () => {
  beforeEach(async () => {
    await Ticket.destroy({ where: {} });
  });

  const make = (title, priority, createdAt, status = 'Open') =>
    Ticket.create({
      title,
      description: 'details',
      category: 'Software',
      priority,
      status,
      createdAt,
      requesterId: alice.user.id,
    });

  test('is closed to requesters', async () => {
    const res = await request(app).get('/api/tickets/queue').set(auth(alice.token));
    expect(res.status).toBe(403);
  });

  test('requires login', async () => {
    const res = await request(app).get('/api/tickets/queue');
    expect(res.status).toBe(401);
  });

  test('shows Critical and High first, then oldest first', async () => {
    await make('old low', 'Low', new Date('2026-01-01T09:00:00Z'));
    await make('new critical', 'Critical', new Date('2026-03-01T09:00:00Z'));
    await make('old high', 'High', new Date('2026-01-05T09:00:00Z'));
    await make('older high', 'High', new Date('2026-01-02T09:00:00Z'));
    await make('medium', 'Medium', new Date('2026-01-01T08:00:00Z'));

    const res = await request(app).get('/api/tickets/queue').set(auth(tech.token));
    expect(res.status).toBe(200);
    expect(res.body.tickets.map((t) => t.title)).toEqual([
      'new critical',
      'older high',
      'old high',
      'medium',
      'old low',
    ]);
  });

  test('includes the info a technician needs on each row', async () => {
    await make('row check', 'High', new Date('2026-02-01T09:00:00Z'));
    const res = await request(app).get('/api/tickets/queue').set(auth(tech.token));
    expect(res.body.tickets[0]).toMatchObject({
      title: 'row check',
      category: 'Software',
      priority: 'High',
      status: 'Open',
      requester: { name: 'Alice' },
    });
    expect(res.body.tickets[0].id).toEqual(expect.any(Number));
    expect(res.body.tickets[0].createdAt).toBeDefined();
  });

  test('leaves out Resolved and Closed tickets', async () => {
    await make('still open', 'Low', new Date('2026-01-01T09:00:00Z'));
    await make('done', 'Critical', new Date('2026-01-01T09:00:00Z'), 'Resolved');
    await make('shut', 'Critical', new Date('2026-01-01T09:00:00Z'), 'Closed');

    const res = await request(app).get('/api/tickets/queue').set(auth(tech.token));
    expect(res.body.tickets.map((t) => t.title)).toEqual(['still open']);
  });

  test('a manager can open the queue too', async () => {
    const res = await request(app).get('/api/tickets/queue').set(auth(boss.token));
    expect(res.status).toBe(200);
  });

  test('an empty queue is an empty list, not an error', async () => {
    const res = await request(app).get('/api/tickets/queue').set(auth(tech.token));
    expect(res.status).toBe(200);
    expect(res.body.tickets).toEqual([]);
  });
});
