import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { createApp } from '../server.js';

// --- HTTP API integration tests ---

describe('API', () => {
  let server: import('node:http').Server;
  let base: string;
  let tmpDir: string;
  let dbPath: string;

  before(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'cr-api-test-'));
    dbPath = join(tmpDir, 'db.sqlite');
    const app = createApp(dbPath);
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    const addr = server.address() as import('node:net').AddressInfo;
    base = `http://127.0.0.1:${addr.port}`;
  });

  after(() => {
    server.close();
    rmSync(tmpDir, { recursive: true });
  });

  // --- Products ---

  it('GET /api/products returns empty array on fresh db', async () => {
    const res = await fetch(`${base}/api/products`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), []);
  });

  it('POST /api/products saves and GET returns the data', async () => {
    const products = [{ id: 'p1', name: 'Água', emoji: '💧', price: 1, initialStock: 10, stock: 10, minStock: 2 }];
    const post = await fetch(`${base}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(products),
    });
    assert.equal(post.status, 200);
    assert.deepEqual(await post.json(), { ok: true });

    const get = await fetch(`${base}/api/products`);
    assert.deepEqual(await get.json(), products);
  });

  it('POST /api/products replaces existing products', async () => {
    const updated = [{ id: 'p2', name: 'Sumo', emoji: '🍊', price: 1.5, initialStock: 20, stock: 20, minStock: 4 }];
    await fetch(`${base}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    const get = await fetch(`${base}/api/products`);
    assert.deepEqual(await get.json(), updated);
  });

  it('POST /api/products with non-array body returns 400', async () => {
    const res = await fetch(`${base}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ not: 'an array' }),
    });
    assert.equal(res.status, 400);
  });

  // --- Events ---

  it('GET /api/events returns empty array on fresh db', async () => {
    const res = await fetch(`${base}/api/events`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), []);
  });

  it('POST /api/events saves and GET returns the data', async () => {
    const events = [{ id: 'e1', name: 'Festa', date: '2026-05-31', status: 'open' }];
    await fetch(`${base}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(events),
    });
    const get = await fetch(`${base}/api/events`);
    assert.deepEqual(await get.json(), events);
  });

  // --- Sales ---

  it('GET /api/sales returns empty array on fresh db', async () => {
    const res = await fetch(`${base}/api/sales`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), []);
  });

  it('POST /api/sales adds a single sale and GET returns it', async () => {
    const sale = {
      id: 's1',
      date: '2026-05-31T10:00:00.000Z',
      eventId: 'e1',
      eventName: 'Festa',
      eventDate: '2026-05-31',
      items: [{ productId: 'p2', name: 'Sumo', price: 1.5, quantity: 2 }],
      total: 3,
      paymentMethod: 'cash',
      status: 'completed',
    };
    const post = await fetch(`${base}/api/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale),
    });
    assert.equal(post.status, 200);
    assert.deepEqual(await post.json(), { ok: true });

    const get = await fetch(`${base}/api/sales`);
    const sales = await get.json();
    assert.equal(sales.length, 1);
    assert.equal(sales[0].id, 's1');
    assert.equal(sales[0].total, 3);
    assert.equal(sales[0].items.length, 1);
    assert.equal(sales[0].items[0].name, 'Sumo');
  });

  it('POST /api/sales adds a second sale without losing the first', async () => {
    const sale2 = {
      id: 's2',
      date: '2026-05-31T10:05:00.000Z',
      eventId: 'e1',
      eventName: 'Festa',
      items: [{ productId: 'p2', name: 'Sumo', price: 1.5, quantity: 1 }],
      total: 1.5,
      paymentMethod: 'mbway',
      status: 'completed',
    };
    await fetch(`${base}/api/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale2),
    });

    const get = await fetch(`${base}/api/sales`);
    const sales = await get.json();
    assert.equal(sales.length, 2);
  });

  it('PATCH /api/sales/:id/cancel cancels a sale', async () => {
    const patch = await fetch(`${base}/api/sales/s1/cancel`, { method: 'PATCH' });
    assert.equal(patch.status, 200);
    const updated = await patch.json();
    assert.equal(updated.id, 's1');
    assert.equal(updated.status, 'cancelled');
    assert.ok(updated.cancelledAt);
  });

  it('PATCH /api/sales/:id/cancel on already cancelled sale returns 404', async () => {
    const res = await fetch(`${base}/api/sales/s1/cancel`, { method: 'PATCH' });
    assert.equal(res.status, 404);
  });

  it('PATCH /api/sales/:id/cancel on unknown id returns 404', async () => {
    const res = await fetch(`${base}/api/sales/nonexistent/cancel`, { method: 'PATCH' });
    assert.equal(res.status, 404);
  });

  it('POST /api/sales with array body returns 400', async () => {
    const res = await fetch(`${base}/api/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([]),
    });
    assert.equal(res.status, 400);
  });

  it('GET /api/unknown returns 404', async () => {
    const res = await fetch(`${base}/api/unknown`);
    assert.equal(res.status, 404);
  });
});

// --- Migration from legacy db.json ---

describe('Migration from db.json', () => {
  let server: import('node:http').Server;
  let base: string;
  let tmpDir: string;

  before(async () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'cr-migration-test-'));

    const legacyData = {
      products: [{ id: 'p-legacy', name: 'Pão', emoji: '🍞', price: 0.5, initialStock: 50, stock: 45, minStock: 10 }],
      events: [{ id: 'e-legacy', name: 'Magusto', date: '2025-11-11', status: 'closed', closedAt: '2025-11-11T20:00:00.000Z' }],
      sales: [
        {
          id: 's-legacy',
          date: '11/11/2025, 19:00:00',
          eventId: 'e-legacy',
          eventName: 'Magusto',
          items: [{ productId: 'p-legacy', name: 'Pão', price: 0.5, quantity: 5 }],
          total: 2.5,
          paymentMethod: 'cash',
          status: 'completed',
        },
      ],
    };
    writeFileSync(join(tmpDir, 'db.json'), JSON.stringify(legacyData));

    const dbPath = join(tmpDir, 'db.sqlite');
    const app = createApp(dbPath);
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    const addr = server.address() as import('node:net').AddressInfo;
    base = `http://127.0.0.1:${addr.port}`;
  });

  after(() => {
    server.close();
    rmSync(tmpDir, { recursive: true });
  });

  it('migrates products from db.json', async () => {
    const res = await fetch(`${base}/api/products`);
    const products = await res.json();
    assert.equal(products.length, 1);
    assert.equal(products[0].id, 'p-legacy');
    assert.equal(products[0].name, 'Pão');
  });

  it('migrates events from db.json', async () => {
    const res = await fetch(`${base}/api/events`);
    const events = await res.json();
    assert.equal(events.length, 1);
    assert.equal(events[0].id, 'e-legacy');
    assert.equal(events[0].status, 'closed');
  });

  it('migrates sales from db.json', async () => {
    const res = await fetch(`${base}/api/sales`);
    const sales = await res.json();
    assert.equal(sales.length, 1);
    assert.equal(sales[0].id, 's-legacy');
    assert.equal(sales[0].total, 2.5);
    assert.equal(sales[0].items.length, 1);
  });

  it('does not migrate again if SQLite already has data', async () => {
    // Add a product directly via API
    await fetch(`${base}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ id: 'p-new', name: 'Água', emoji: '💧', price: 1, initialStock: 10, stock: 10, minStock: 2 }]),
    });

    // Create a new app instance pointing to same sqlite — should not re-migrate
    const app2 = createApp(join(tmpDir, 'db.sqlite'));
    let server2: import('node:http').Server;
    let base2: string;
    await new Promise<void>((resolve) => {
      server2 = app2.listen(0, '127.0.0.1', resolve);
    });
    const addr2 = server2!.address() as import('node:net').AddressInfo;
    base2 = `http://127.0.0.1:${addr2.port}`;

    const res = await fetch(`${base2}/api/products`);
    const products = await res.json();
    // Should have only p-new (the full replace we did above), not the legacy one again
    assert.equal(products.length, 1);
    assert.equal(products[0].id, 'p-new');

    server2!.close();
  });
});
