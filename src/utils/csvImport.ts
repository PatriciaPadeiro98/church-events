import type { Product } from '../models/product.types';

export type CsvImportResult =
  | { ok: true; products: Omit<Product, 'id'>[] }
  | { ok: false; error: string };

const COLUMN_ALIASES: Record<string, string> = {
  nome: 'name',
  name: 'name',
  emoji: 'emoji',
  'preço': 'price',
  preco: 'price',
  price: 'price',
  stock: 'stock',
  'stock inicial': 'stock',
  initialstock: 'stock',
  'stock mínimo': 'minStock',
  'stock minimo': 'minStock',
  minstock: 'minStock',
  minimo: 'minStock',
};

const parseRow = (raw: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"') {
      if (inQuotes && raw[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
};

export const parseProductsCsv = (text: string): CsvImportResult => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length < 2) return { ok: false, error: 'O ficheiro precisa de ter pelo menos uma linha de cabeçalho e um produto.' };

  const headers = parseRow(lines[0]).map((h) =>
    COLUMN_ALIASES[h.toLowerCase().trim()] ?? h.toLowerCase().trim()
  );

  if (!headers.includes('name')) return { ok: false, error: 'Coluna "nome" não encontrada. Verifica o cabeçalho do CSV.' };
  if (!headers.includes('price')) return { ok: false, error: 'Coluna "preço" não encontrada. Verifica o cabeçalho do CSV.' };
  if (!headers.includes('stock')) return { ok: false, error: 'Coluna "stock" não encontrada. Verifica o cabeçalho do CSV.' };

  const products: Omit<Product, 'id'>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });

    const name = row['name']?.trim();
    if (!name) continue;

    const price = parseFloat(row['price']?.replace(',', '.') ?? '');
    if (isNaN(price) || price < 0) return { ok: false, error: `Linha ${i + 1}: preço inválido ("${row['price']}")` };

    const initialStock = parseInt(row['stock'] ?? '', 10);
    if (isNaN(initialStock) || initialStock < 0) return { ok: false, error: `Linha ${i + 1}: stock inválido ("${row['stock']}")` };

    const minStockRaw = row['minStock']?.trim();
    const minStock = minStockRaw ? parseInt(minStockRaw, 10) : Math.round(initialStock * 0.2);

    products.push({
      name,
      emoji: row['emoji']?.trim() || '📦',
      price,
      initialStock,
      stock: initialStock,
      minStock: isNaN(minStock) ? Math.round(initialStock * 0.2) : minStock,
    });
  }

  if (products.length === 0) return { ok: false, error: 'Nenhum produto válido encontrado no ficheiro.' };

  return { ok: true, products };
};

export const PRODUCTS_CSV_TEMPLATE = `nome,emoji,preço,stock,stock mínimo
Água,💧,1.00,100,20
Pão,🍞,0.50,50,10
Sumo,🍊,1.50,60,12`;
