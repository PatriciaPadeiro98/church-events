import { useMemo, useState } from 'react';
import { ProductCard } from '../../components/ProductCard';
import type { Product } from '../../models/product.types';
import type { CartItem, PaymentMethod } from '../../models/sale.types';
import { formatCurrency } from '../../utils/currency';

type CashRegisterPageProps = {
  products: Product[];
  cartItems: CartItem[];
  paymentMethod: PaymentMethod;
  receivedAmount?: string;
  isEventClosed: boolean;
  canFinishSale: boolean;
  received: number;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onReceivedAmountChange: (value: string) => void;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: string) => void;
  onQuantityChange: (productId: string, quantity: number) => void;
  onClearCart: () => void;
  onFinishSale: () => void;
};

export const CashRegisterPage = ({
  products,
  cartItems,
  paymentMethod,
  receivedAmount,
  isEventClosed,
  canFinishSale,
  received,
  onPaymentMethodChange,
  onReceivedAmountChange,
  onAddToCart,
  onRemoveFromCart,
  onQuantityChange,
  onClearCart,
  onFinishSale,
}: CashRegisterPageProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const normalizeSearchValue = (value: string) => {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  };

  const filteredProducts = useMemo(() => {
    const normalizedSearchTerm = normalizeSearchValue(searchTerm);

    if (!normalizedSearchTerm) {
      return products;
    }

    return products.filter((product) => {
      return normalizeSearchValue(product.name).includes(normalizedSearchTerm);
    });
  }, [products, searchTerm]);

  const total = cartItems.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  const change = received - total;

  return (
    <section className="cash-screen">
      <div className="products-picker">
        <h3>Selecione o produto</h3>

        {isEventClosed && (
          <div className="closed-event-warning">
            Não há um evento aberto ativo. Cria ou ativa um evento aberto para
            registar vendas.
          </div>
        )}

        <div className="search-input">
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Pesquisar produto..."
          />
          <span>🔍</span>
        </div>

        <div className="products-grid">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={isEventClosed ? () => undefined : onAddToCart}
            />
          ))}
        </div>

        {!filteredProducts.length && (
          <div className="empty-products">
            Nenhum produto encontrado para esta pesquisa.
          </div>
        )}
      </div>

      <aside className="cart-card">
        <div className="cart-header">
          <h3>Carrinho</h3>

          <button onClick={onClearCart} className="clear-button">
            🗑 Limpar
          </button>
        </div>

        <div className="cart-list">
          {cartItems.map((item) => (
            <div key={item.productId} className="cart-row">
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(event) => {
                  onQuantityChange(item.productId, Number(event.target.value));
                }}
              />

              <span>{item.name}</span>
              <strong>{formatCurrency(item.price * item.quantity)}</strong>

              <button onClick={() => onRemoveFromCart(item.productId)}>
                ×
              </button>
            </div>
          ))}

          {!cartItems.length && (
            <div className="empty-cart">Ainda não há produtos no carrinho.</div>
          )}
        </div>

        <div className="cart-total-row">
          <span>Subtotal</span>
          <strong>{formatCurrency(total)}</strong>
        </div>

        <div className="cart-total-main">
          <span>Total</span>
          <strong>{formatCurrency(total)}</strong>
        </div>

        <div className="payment-section">
          <span>Método de pagamento</span>

          <div className="payment-buttons">
            <button
              onClick={() => onPaymentMethodChange('cash')}
              className={paymentMethod === 'cash' ? 'payment-active' : ''}
            >
              💶 Dinheiro
            </button>

            <button
              onClick={() => onPaymentMethodChange('mbway')}
              className={paymentMethod === 'mbway' ? 'payment-active' : ''}
            >
              MB WAY
            </button>
          </div>
        </div>

        <div className="money-grid">
          <label>
            <span>Valor recebido</span>
            <div className="money-input">
              <span>💶</span>
              <input
                value={receivedAmount}
                onChange={(event) => onReceivedAmountChange(event.target.value)}
                type="number"
                placeholder="0,00"
              />
              <span>€</span>
            </div>
          </label>

          <div className="change-box">
            <span>Troco</span>
            <strong>{formatCurrency(Math.max(0, change))}</strong>
          </div>
        </div>

        <button
          disabled={!canFinishSale}
          onClick={onFinishSale}
          className="finish-button"
        >
          ✓ Concluir venda
        </button>
      </aside>
    </section>
  );
};
