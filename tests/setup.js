// Runs before every test file. Each test file gets its own throwaway
// in-memory database, so tests never touch real data or each other.
process.env.NODE_ENV = 'test';
process.env.DB_STORAGE = ':memory:';
