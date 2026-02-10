import { test } from 'node:test';
import assert from 'node:assert';

// Tests fonctionnels de base
// Pour tester l'API en conditions réelles, lancer le serveur puis exécuter ces tests

const API_URL = process.env.API_URL || 'http://localhost:3000';

test('Health check should return OK', async () => {
  const response = await fetch(`${API_URL}/health`);
  const data = await response.json();

  assert.strictEqual(response.status, 200);
  assert.strictEqual(data.status, 'ok');
  assert.strictEqual(data.service, 'home-api');
});

test('Register should create a new user', async () => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test_${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User'
    })
  });

  const data = await response.json();

  assert.strictEqual(response.status, 201);
  assert.ok(data.token);
  assert.ok(data.user);
  assert.strictEqual(data.user.name, 'Test User');
});

test('Login should return a token', async () => {
  // D'abord créer un user
  const email = `test_${Date.now()}@example.com`;
  await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'password123',
      name: 'Test User'
    })
  });

  // Puis login
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'password123'
    })
  });

  const data = await response.json();

  assert.strictEqual(response.status, 200);
  assert.ok(data.token);
  assert.ok(data.user);
});

test('Protected route should require authentication', async () => {
  const response = await fetch(`${API_URL}/auth/me`);

  assert.strictEqual(response.status, 401);
});
