// Unit tests for the pure business rules. No database and no HTTP involved.

const {
  validateTicketInput,
  priorityWeight,
  sortQueue,
} = require('../server/services/ticketService');
const { validateRegistration } = require('../server/services/authService');

describe('validateTicketInput', () => {
  const good = {
    title: '  Printer jam  ',
    description: '  Paper is stuck in tray 2.  ',
    category: 'Hardware',
    priority: 'Low',
  };

  test('accepts a complete ticket and trims whitespace', () => {
    const { errors, value } = validateTicketInput(good);
    expect(errors).toEqual({});
    expect(value.title).toBe('Printer jam');
    expect(value.description).toBe('Paper is stuck in tray 2.');
  });

  test('requires every field', () => {
    const { errors } = validateTicketInput({});
    expect(Object.keys(errors).sort()).toEqual(['category', 'description', 'priority', 'title']);
  });

  test('rejects whitespace-only title and description', () => {
    const { errors } = validateTicketInput({ ...good, title: '   ', description: '   ' });
    expect(errors.title).toBeDefined();
    expect(errors.description).toBeDefined();
  });

  test('rejects an unknown category or priority', () => {
    const { errors } = validateTicketInput({ ...good, category: 'Plumbing', priority: 'Urgent!!' });
    expect(errors.category).toMatch(/valid category/i);
    expect(errors.priority).toMatch(/valid urgency/i);
  });

  test('rejects a title over 120 characters', () => {
    const { errors } = validateTicketInput({ ...good, title: 'x'.repeat(121) });
    expect(errors.title).toMatch(/120/);
  });

  test('does not crash on missing input', () => {
    expect(() => validateTicketInput()).not.toThrow();
    expect(() => validateTicketInput({ title: 42, description: null })).not.toThrow();
  });
});

describe('priorityWeight', () => {
  test('ranks Critical above High above Medium above Low', () => {
    expect(priorityWeight('Critical')).toBeGreaterThan(priorityWeight('High'));
    expect(priorityWeight('High')).toBeGreaterThan(priorityWeight('Medium'));
    expect(priorityWeight('Medium')).toBeGreaterThan(priorityWeight('Low'));
  });
});

describe('sortQueue', () => {
  const t = (id, priority, createdAt) => ({ id, priority, createdAt });

  test('puts higher priority first', () => {
    const sorted = sortQueue([t(1, 'Low', '2026-01-01'), t(2, 'Critical', '2026-01-02')]);
    expect(sorted.map((x) => x.id)).toEqual([2, 1]);
  });

  test('sorts oldest first within the same priority', () => {
    const sorted = sortQueue([
      t(1, 'High', '2026-01-03'),
      t(2, 'High', '2026-01-01'),
      t(3, 'High', '2026-01-02'),
    ]);
    expect(sorted.map((x) => x.id)).toEqual([2, 3, 1]);
  });

  test('a new Critical ticket outranks an old Low ticket', () => {
    const sorted = sortQueue([t(1, 'Low', '2025-01-01'), t(2, 'Critical', '2026-06-01')]);
    expect(sorted[0].id).toBe(2);
  });

  test('does not change the original array', () => {
    const original = [t(1, 'Low', '2026-01-01'), t(2, 'High', '2026-01-01')];
    sortQueue(original);
    expect(original.map((x) => x.id)).toEqual([1, 2]);
  });

  test('handles an empty queue', () => {
    expect(sortQueue([])).toEqual([]);
  });
});

describe('validateRegistration', () => {
  test('normalizes the email to lowercase and trims the name', () => {
    const { errors, value } = validateRegistration({
      name: '  Sam  ',
      email: '  SAM@Example.COM ',
      password: 'longenough',
    });
    expect(errors).toEqual({});
    expect(value.name).toBe('Sam');
    expect(value.email).toBe('sam@example.com');
  });

  test('rejects a short password', () => {
    const { errors } = validateRegistration({ name: 'Sam', email: 'sam@example.com', password: 'short' });
    expect(errors.password).toMatch(/8 characters/);
  });

  test('rejects a malformed email', () => {
    const { errors } = validateRegistration({ name: 'Sam', email: 'not-an-email', password: 'longenough' });
    expect(errors.email).toBeDefined();
  });

  test('requires all fields', () => {
    const { errors } = validateRegistration({});
    expect(Object.keys(errors).sort()).toEqual(['email', 'name', 'password']);
  });
});
