import { useState } from 'react';
import type { Product } from '../models/product.types';
import { EmojiPicker } from './EmojiPicker';

type ProductFormModalProps = {
  product?: Product;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Omit<Product, 'id'>) => void;
};

export const ProductFormModal = ({
  product,
  isOpen,
  onClose,
  onSubmit,
}: ProductFormModalProps) => {
  if (!isOpen) return null;

  return (
    <ProductFormModalContent
      key={product?.id ?? 'new'}
      product={product}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
};

const ProductFormModalContent = ({
  product,
  onClose,
  onSubmit,
}: Omit<ProductFormModalProps, 'isOpen'>) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    emoji: product?.emoji || '📦',
    price: product?.price ? String(product.price) : '',
    initialStock: product?.initialStock ? String(product.initialStock) : '',
  });
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const handleSelectEmoji = (selectedEmoji: string) => {
    setFormData({ ...formData, emoji: selectedEmoji });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const price = formData.price ? Number(formData.price) : 0;
    const initialStockNum = formData.initialStock ? Number(formData.initialStock) : 0;

    onSubmit({
      name: formData.name,
      emoji: formData.emoji,
      price,
      initialStock: initialStockNum,
      stock: product ? product.stock : initialStockNum,
      minStock: Math.ceil(initialStockNum * 0.2), // 20% do stock inicial
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{product ? 'Editar Produto' : 'Novo Produto'}</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label>Emoji</label>
            <div className="emoji-input-wrapper">
              <input
                type="text"
                maxLength={2}
                value={formData.emoji}
                readOnly
                placeholder="📦"
                className="emoji-input"
              />
              <button
                type="button"
                className="emoji-picker-button"
                onClick={() => setIsEmojiPickerOpen(true)}
              >
                Seleciona Emoji
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Nome do Produto</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ex: Água 50cl"
              required
            />
          </div>

          <div className="form-group">
            <label>Preço (€)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              placeholder="1,00"
              required
            />
          </div>

          <div className="form-group">
            <label>Stock Inicial</label>
            <input
              type="number"
              min="0"
              value={formData.initialStock}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  initialStock: e.target.value,
                })
              }
              placeholder="100"
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              {product ? 'Atualizar' : 'Criar'} Produto
            </button>
          </div>
        </form>

        <EmojiPicker
          isOpen={isEmojiPickerOpen}
          onClose={() => setIsEmojiPickerOpen(false)}
          onSelectEmoji={handleSelectEmoji}
        />
      </div>
    </div>
  );
};
