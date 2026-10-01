import Database from 'better-sqlite3';
import express from 'express';
import { existsSync, readFileSync } from 'fs';
import { networkInterfaces } from 'os';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = join(__dirname, 'db.sqlite');
const DIST_PATH = join(__dirname, 'dist');

const getLocalIPs = () => {
  const ips = [];
  for (const iface of Object.values(networkInterfaces())) {
    for (const addr of iface ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) ips.push(addr.address);
    }
  }
  return ips;
};

const initDb = (dbPath) => {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '',
      price REAL NOT NULL,
      initial_stock INTEGER NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      min_stock INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      closed_at TEXT,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      event_id TEXT,
      event_name TEXT NOT NULL,
      event_date TEXT,
      cash_register_name TEXT,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      cancelled_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id TEXT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL
    );
  `);

  // Add columns introduced after initial schema (safe on existing databases)
  const salesColumns = db.prepare("PRAGMA table_info(sales)").all().map((c) => c.name);
  if (!salesColumns.includes('cash_register_name')) {
    db.exec('ALTER TABLE sales ADD COLUMN cash_register_name TEXT');
  }

  return db;
};

// --- Row mappers ---

const rowToProduct = (row) => ({
  id: row.id,
  name: row.name,
  emoji: row.emoji,
  price: row.price,
  initialStock: row.initial_stock,
  stock: row.stock,
  minStock: row.min_stock,
});

const rowToEvent = (row) => {
  const event = { id: row.id, name: row.name, date: row.date, status: row.status };
  if (row.description != null) event.description = row.description;
  if (row.closed_at != null) event.closedAt = row.closed_at;
  if (row.deleted_at != null) event.deletedAt = row.deleted_at;
  return event;
};

const rowsToSale = (saleRow, itemRows) => {
  const sale = {
    id: saleRow.id,
    date: saleRow.date,
    eventName: saleRow.event_name,
    items: itemRows.map((item) => ({
      productId: item.product_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
    total: saleRow.total,
    paymentMethod: saleRow.payment_method,
    status: saleRow.status,
  };
  if (saleRow.event_id != null) sale.eventId = saleRow.event_id;
  if (saleRow.event_date != null) sale.eventDate = saleRow.event_date;
  if (saleRow.cash_register_name != null) sale.cashRegisterName = saleRow.cash_register_name;
  if (saleRow.cancelled_at != null) sale.cancelledAt = saleRow.cancelled_at;
  return sale;
};

// --- Migration from legacy db.json ---

const migrateFromJson = (db, jsonPath) => {
  if (!existsSync(jsonPath)) return;

  let data;
  try {
    data = JSON.parse(readFileSync(jsonPath, 'utf8'));
  } catch {
    return;
  }

  const hasData =
    db.prepare('SELECT COUNT(*) as n FROM products').get().n > 0 ||
    db.prepare('SELECT COUNT(*) as n FROM events').get().n > 0 ||
    db.prepare('SELECT COUNT(*) as n FROM sales').get().n > 0;

  if (hasData) return;

  const migrate = db.transaction(() => {
    for (const p of data.products ?? []) {
      db.prepare(`
        INSERT OR IGNORE INTO products (id, name, emoji, price, initial_stock, stock, min_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(p.id, p.name, p.emoji ?? '', p.price, p.initialStock ?? 0, p.stock ?? 0, p.minStock ?? 0);
    }

    for (const e of data.events ?? []) {
      db.prepare(`
        INSERT OR IGNORE INTO events (id, name, date, description, status, closed_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(e.id, e.name, e.date, e.description ?? null, e.status ?? 'open', e.closedAt ?? null, e.deletedAt ?? null);
    }

    for (const s of data.sales ?? []) {
      db.prepare(`
        INSERT OR IGNORE INTO sales (id, date, event_id, event_name, event_date, cash_register_name, total, payment_method, status, cancelled_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(s.id, s.date, s.eventId ?? null, s.eventName, s.eventDate ?? null, s.cashRegisterName ?? null, s.total, s.paymentMethod, s.status ?? 'completed', s.cancelledAt ?? null);

      for (const item of s.items ?? []) {
        db.prepare(`
          INSERT OR IGNORE INTO sale_items (id, sale_id, product_id, name, price, quantity)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(crypto.randomUUID(), s.id, item.productId ?? null, item.name, item.price, item.quantity);
      }
    }
  });

  migrate();
  console.log('✓ Dados migrados de db.json para SQLite');
};

export const createApp = (dbPath = DEFAULT_DB_PATH) => {
  const db = initDb(dbPath);

  // Migrate from legacy db.json if it exists alongside the sqlite file
  const legacyJsonPath = join(dirname(dbPath), 'db.json');
  migrateFromJson(db, legacyJsonPath);

  const app = express();
  app.use(express.json({ limit: '10mb' }));

  if (existsSync(DIST_PATH)) {
    app.use(express.static(DIST_PATH));
  }

  // --- Products (full replace — geridos por admins, sem concorrência crítica) ---

  app.get('/api/products', (_req, res) => {
    const rows = db.prepare('SELECT * FROM products').all();
    res.json(rows.map(rowToProduct));
  });

  app.post('/api/products', (req, res) => {
    if (!Array.isArray(req.body)) return res.status(400).json({ error: 'O body deve ser um array' });

    const replace = db.transaction((products) => {
      db.prepare('DELETE FROM products').run();
      const stmt = db.prepare(`
        INSERT INTO products (id, name, emoji, price, initial_stock, stock, min_stock)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of products) {
        stmt.run(p.id, p.name, p.emoji ?? '', p.price, p.initialStock ?? 0, p.stock ?? 0, p.minStock ?? 0);
      }
    });

    replace(req.body);
    res.json({ ok: true });
  });

  // --- Events (full replace — geridos por admins, sem concorrência crítica) ---

  app.get('/api/events', (_req, res) => {
    const rows = db.prepare('SELECT * FROM events').all();
    res.json(rows.map(rowToEvent));
  });

  app.post('/api/events', (req, res) => {
    if (!Array.isArray(req.body)) return res.status(400).json({ error: 'O body deve ser um array' });

    const replace = db.transaction((events) => {
      db.prepare('DELETE FROM events').run();
      const stmt = db.prepare(`
        INSERT INTO events (id, name, date, description, status, closed_at, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const e of events) {
        stmt.run(e.id, e.name, e.date, e.description ?? null, e.status ?? 'open', e.closedAt ?? null, e.deletedAt ?? null);
      }
    });

    replace(req.body);
    res.json({ ok: true });
  });

  // --- Sales (operações individuais — ponto crítico de concorrência entre caixas) ---

  const getAllSales = () => {
    const saleRows = db.prepare('SELECT * FROM sales ORDER BY date DESC').all();
    const getItems = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?');
    return saleRows.map((row) => rowsToSale(row, getItems.all(row.id)));
  };

  app.get('/api/sales', (_req, res) => {
    res.json(getAllSales());
  });

  // Adiciona UMA venda (transação atómica — seguro com múltiplas caixas em simultâneo)
  app.post('/api/sales', (req, res) => {
    const s = req.body;
    if (!s || typeof s !== 'object' || Array.isArray(s)) {
      return res.status(400).json({ error: 'O body deve ser um objecto de venda' });
    }

    const insert = db.transaction((sale) => {
      db.prepare(`
        INSERT INTO sales (id, date, event_id, event_name, event_date, cash_register_name, total, payment_method, status, cancelled_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        sale.id,
        sale.date,
        sale.eventId ?? null,
        sale.eventName,
        sale.eventDate ?? null,
        sale.cashRegisterName ?? null,
        sale.total,
        sale.paymentMethod,
        sale.status ?? 'completed',
        sale.cancelledAt ?? null,
      );

      const itemStmt = db.prepare(`
        INSERT INTO sale_items (id, sale_id, product_id, name, price, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const decrementStmt = db.prepare(
        'UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?'
      );
      for (const item of sale.items ?? []) {
        itemStmt.run(crypto.randomUUID(), sale.id, item.productId ?? null, item.name, item.price, item.quantity);
        if (item.productId) decrementStmt.run(item.quantity, item.productId);
      }
    });

    insert(s);
    res.json({ ok: true });
  });

  // Anula uma venda (atualização atómica — seguro em simultâneo)
  app.patch('/api/sales/:id/cancel', (req, res) => {
    const { id } = req.params;
    const cancelledAt = new Date().toISOString();

    const cancel = db.transaction(() => {
      const result = db.prepare(`
        UPDATE sales SET status = 'cancelled', cancelled_at = ?
        WHERE id = ? AND status != 'cancelled'
      `).run(cancelledAt, id);

      if (result.changes === 0) return null;

      const itemRows = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(id);
      const incrementStmt = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
      for (const item of itemRows) {
        if (item.product_id) incrementStmt.run(item.quantity, item.product_id);
      }

      const saleRow = db.prepare('SELECT * FROM sales WHERE id = ?').get(id);
      return rowsToSale(saleRow, itemRows);
    });

    const updated = cancel();
    if (!updated) {
      return res.status(404).json({ error: 'Venda não encontrada ou já anulada' });
    }
    res.json(updated);
  });

  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'Recurso não encontrado' });
  });

  if (existsSync(DIST_PATH)) {
    app.get('*', (_req, res) => {
      res.sendFile(join(DIST_PATH, 'index.html'));
    });
  }

  return app;
};

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const app = createApp();
  const PORT = process.env.PORT ?? 3001;
  app.listen(PORT, '0.0.0.0', () => {
    const ips = getLocalIPs();
    console.log('\nServidor a correr:');
    console.log(`  Local:   http://localhost:${PORT}`);
    for (const ip of ips) {
      console.log(`  Rede:    http://${ip}:${PORT}`);
    }
    console.log('');
  });
}
