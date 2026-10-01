import type { Product } from '../models/product.types';
import type { CartItem, PaymentMethod, Sale } from '../models/sale.types';

export type SaleDraftInput = {
  cartItems: CartItem[];
  products: Product[];
  paymentMethod: PaymentMethod;
  receivedAmount?: string;
  isEventOpen: boolean;
};

export const getCartPreviewTotal = (cartItems: CartItem[]) => {
  return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

export const getReceivedAmountPreview = (receivedAmount?: string) => {
  const received = Number(receivedAmount || 0);
  return Number.isFinite(received) ? received : 0;
};

export const getSafeDraftQuantity = (quantity: number, stock: number) => {
  if (!Number.isFinite(quantity) || quantity < 1) {
    return 1;
  }

  return Math.min(Math.floor(quantity), Math.max(0, stock));
};

export const getUnavailableDraftItems = (
  cartItems: CartItem[],
  products: Product[]
) => {
  return cartItems.filter((item) => {
    const product = products.find((currentProduct) => {
      return currentProduct.id === item.productId;
    });

    return !product || item.quantity < 1 || item.quantity > product.stock;
  });
};

export const canSubmitSaleDraft = ({
  cartItems,
  products,
  paymentMethod,
  receivedAmount,
  isEventOpen,
}: SaleDraftInput) => {
  if (!isEventOpen || !cartItems.length) {
    return false;
  }

  if (getUnavailableDraftItems(cartItems, products).length) {
    return false;
  }

  if (paymentMethod === 'mbway') {
    return true;
  }

  return getReceivedAmountPreview(receivedAmount) >= getCartPreviewTotal(cartItems);
};

export const applySaleDraftToLocalProducts = (
  products: Product[],
  cartItems: CartItem[]
) => {
  return products.map((product) => {
    const soldItem = cartItems.find((item) => {
      return item.productId === product.id;
    });

    if (!soldItem) {
      return product;
    }

    return {
      ...product,
      stock: product.stock - soldItem.quantity,
    };
  });
};

export const restoreLocalProductsFromCancelledSale = (
  products: Product[],
  sale: Sale
) => {
  return products.map((product) => {
    const soldItem = sale.items.find((item) => {
      return item.productId === product.id;
    });

    if (!soldItem) {
      return product;
    }

    return {
      ...product,
      stock: product.stock + soldItem.quantity,
    };
  });
};
