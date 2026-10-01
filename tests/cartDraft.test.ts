import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Product } from '../src/models/product.types.ts';
import type { CartItem, Sale } from '../src/models/sale.types.ts';
import {
  applySaleDraftToLocalProducts,
  canSubmitSaleDraft,
  getCartPreviewTotal,
  getReceivedAmountPreview,
  getSafeDraftQuantity,
  getUnavailableDraftItems,
  restoreLocalProductsFromCancelledSale,
} from '../src/utils/cartDraft.ts';

const products: Product[] = [
  {
    id: 'water',
    name: 'Água',
    emoji: '💧',
    price: 1,
    initialStock: 10,
    stock: 4,
    minStock: 2,
  },
  {
    id: 'cake',
    name: 'Bolo',
    emoji: '🍰',
    price: 2.5,
    initialStock: 5,
    stock: 1,
    minStock: 1,
  },
];

const cartItems: CartItem[] = [
  {
    productId: 'water',
    name: 'Água',
    price: 1,
    quantity: 2,
  },
  {
    productId: 'cake',
    name: 'Bolo',
    price: 2.5,
    quantity: 1,
  },
];

describe('cart draft utils', () => {
  it('calculates the cart preview total', () => {
    assert.equal(getCartPreviewTotal(cartItems), 4.5);
  });

  it('normalizes invalid received amount previews to zero', () => {
    assert.equal(getReceivedAmountPreview('abc'), 0);
    assert.equal(getReceivedAmountPreview(undefined), 0);
    assert.equal(getReceivedAmountPreview('5.5'), 5.5);
  });

  it('keeps draft quantities inside stock bounds', () => {
    assert.equal(getSafeDraftQuantity(3.8, 10), 3);
    assert.equal(getSafeDraftQuantity(99, 4), 4);
    assert.equal(getSafeDraftQuantity(-1, 4), 1);
    assert.equal(getSafeDraftQuantity(Number.NaN, 4), 1);
  });

  it('detects removed products and draft quantities above stock', () => {
    const unavailableItems = getUnavailableDraftItems(
      [
        ...cartItems,
        {
          productId: 'missing',
          name: 'Produto removido',
          price: 1,
          quantity: 1,
        },
        {
          productId: 'cake',
          name: 'Bolo',
          price: 2.5,
          quantity: 2,
        },
      ],
      products
    );

    assert.deepEqual(
      unavailableItems.map((item) => item.productId),
      ['missing', 'cake']
    );
  });

  it('blocks draft submission when there is no open event', () => {
    assert.equal(
      canSubmitSaleDraft({
        cartItems,
        products,
        paymentMethod: 'mbway',
        isEventOpen: false,
      }),
      false
    );
  });

  it('blocks cash draft submission when received amount is below total', () => {
    assert.equal(
      canSubmitSaleDraft({
        cartItems,
        products,
        paymentMethod: 'cash',
        receivedAmount: '4',
        isEventOpen: true,
      }),
      false
    );
  });

  it('allows valid cash and mbway draft submissions', () => {
    assert.equal(
      canSubmitSaleDraft({
        cartItems,
        products,
        paymentMethod: 'cash',
        receivedAmount: '5',
        isEventOpen: true,
      }),
      true
    );

    assert.equal(
      canSubmitSaleDraft({
        cartItems,
        products,
        paymentMethod: 'mbway',
        isEventOpen: true,
      }),
      true
    );
  });

  it('blocks draft submission when cart quantities exceed current stock', () => {
    assert.equal(
      canSubmitSaleDraft({
        cartItems: [
          {
            productId: 'cake',
            name: 'Bolo',
            price: 2.5,
            quantity: 2,
          },
        ],
        products,
        paymentMethod: 'mbway',
        isEventOpen: true,
      }),
      false
    );
  });

  it('applies and restores local stock for a sale draft', () => {
    const sale: Sale = {
      id: 'sale-1',
      date: '11/05/2026, 14:00:00',
      eventId: 'event-1',
      eventName: 'Festa',
      eventDate: '2026-05-11',
      items: cartItems,
      total: 4.5,
      paymentMethod: 'cash',
      status: 'completed',
    };

    const afterSale = applySaleDraftToLocalProducts(products, cartItems);
    assert.equal(afterSale.find((product) => product.id === 'water')?.stock, 2);
    assert.equal(afterSale.find((product) => product.id === 'cake')?.stock, 0);

    const afterCancel = restoreLocalProductsFromCancelledSale(afterSale, sale);
    assert.deepEqual(afterCancel, products);
  });
});
