import type { Product } from '../models/product.types';

export const getProducts = async (): Promise<Product[]> => {
  const res = await fetch('/api/products');
  return res.json();
};

export const saveProducts = async (products: Product[]): Promise<void> => {
  await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(products),
  });
};
