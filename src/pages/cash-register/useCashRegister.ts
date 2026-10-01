import { useEffect, useState } from 'react';
import type { Event } from '../../models/event.types';
import type { Product } from '../../models/product.types';
import type { CartItem, PaymentMethod, Sale } from '../../models/sale.types';
import {
  canSubmitSaleDraft,
  getCartPreviewTotal,
  getReceivedAmountPreview,
  getSafeDraftQuantity,
} from '../../utils/cartDraft';

type UseCashRegisterParams = {
  products: Product[];
  onAddSale: (sale: Sale) => Promise<void>;
  cashRegisterName: string;
  activeEvent?: Event;
};

export const useCashRegister = ({
  products,
  onAddSale,
  cashRegisterName,
  activeEvent,
}: UseCashRegisterParams) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('cartItems') ?? '[]'); } catch { return []; }
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    const saved = localStorage.getItem('cartPaymentMethod');
    return saved === 'mbway' ? 'mbway' : 'cash';
  });
  const [receivedAmount, setReceivedAmount] = useState('');

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('cartPaymentMethod', paymentMethod);
  }, [paymentMethod]);

  const isEventOpen = Boolean(activeEvent && activeEvent.status === 'open');

  const canFinishSale = canSubmitSaleDraft({
    cartItems,
    products,
    paymentMethod,
    receivedAmount,
    isEventOpen,
  });

  const received = getReceivedAmountPreview(receivedAmount);

  const handleAddToCart = (product: Product) => {
    if (!isEventOpen) return;

    const currentQuantity =
      cartItems.find((item) => item.productId === product.id)?.quantity ?? 0;

    if (currentQuantity >= product.stock) return;

    setCartItems((current) => {
      const existing = current.find((item) => item.productId === product.id);

      if (!existing) {
        return [
          ...current,
          { productId: product.id, name: product.name, price: product.price, quantity: 1 },
        ];
      }

      return current.map((item) =>
        item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((current) => current.filter((item) => item.productId !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;

    const safeQuantity = getSafeDraftQuantity(quantity, product.stock);

    setCartItems((current) => {
      if (safeQuantity < 1) {
        return current.filter((item) => item.productId !== productId);
      }
      return current.map((item) =>
        item.productId === productId ? { ...item, quantity: safeQuantity } : item
      );
    });
  };

  const handleClearCart = () => setCartItems([]);

  const clearProductFromCart = (productId: string) => {
    setCartItems((current) => current.filter((item) => item.productId !== productId));
  };

  const handleFinishSale = async () => {
    if (!canFinishSale || !activeEvent) return;

    const total = getCartPreviewTotal(cartItems);
    const saleItems = cartItems.map((item) => ({ ...item }));

    const nextSale: Sale = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      eventId: activeEvent.id,
      eventName: activeEvent.name,
      eventDate: activeEvent.date,
      cashRegisterName: cashRegisterName || undefined,
      items: saleItems,
      total,
      paymentMethod,
      status: 'completed',
    };

    setCartItems([]);
    setReceivedAmount('');
    await onAddSale(nextSale);
  };

  return {
    cartItems,
    paymentMethod,
    receivedAmount,
    isEventOpen,
    canFinishSale,
    received,
    setPaymentMethod,
    setReceivedAmount,
    handleAddToCart,
    handleRemoveFromCart,
    handleQuantityChange,
    handleClearCart,
    clearProductFromCart,
    handleFinishSale,
  };
};
