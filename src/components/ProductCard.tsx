import type { Product } from '../models/product.types';
import { formatCurrency } from '../utils/currency';

type ProductCardProps = {
  product: Product;
  onClick: (product: Product) => void;
};

export const ProductCard = ({ product, onClick }: ProductCardProps) => {
  return (
    <button
      className="product-card"
      disabled={product.stock <= 0}
      onClick={() => onClick(product)}
    >
      <div className="product-card-image">{product.emoji}</div>
      <strong>{product.name}</strong>
      <span>{formatCurrency(product.price)}</span>
    </button>
  );
};