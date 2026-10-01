import type { Sale } from '../models/sale.types';

export const getSales = async (): Promise<Sale[]> => {
  const res = await fetch('/api/sales');
  return res.json();
};

export const addSale = async (sale: Sale): Promise<void> => {
  await fetch('/api/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sale),
  });
};

export const cancelSale = async (saleId: string): Promise<Sale> => {
  const res = await fetch(`/api/sales/${saleId}/cancel`, { method: 'PATCH' });
  return res.json();
};
