import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Event } from '../src/models/event.types.ts';
import type { Sale } from '../src/models/sale.types.ts';
import {
  getCompletedEventSales,
  getEventSalesSummary,
  getSaleUnits,
  getTopProducts,
  saleBelongsToEvent,
} from '../src/utils/sales.ts';

const event: Event = {
  id: 'event-1',
  name: 'Festa',
  date: '2026-05-11',
  status: 'open',
};

const sales: Sale[] = [
  {
    id: 'sale-1',
    date: '11/05/2026, 14:00:00',
    eventId: 'event-1',
    eventName: 'Festa',
    eventDate: '2026-05-11',
    paymentMethod: 'cash',
    status: 'completed',
    total: 5,
    items: [
      {
        productId: 'water',
        name: 'Água',
        price: 1,
        quantity: 2,
      },
      {
        productId: 'cake',
        name: 'Bolo',
        price: 3,
        quantity: 1,
      },
    ],
  },
  {
    id: 'sale-2',
    date: '11/05/2026, 14:05:00',
    eventId: 'event-1',
    eventName: 'Festa',
    eventDate: '2026-05-11',
    paymentMethod: 'mbway',
    status: 'cancelled',
    total: 2,
    items: [
      {
        productId: 'water',
        name: 'Água',
        price: 1,
        quantity: 2,
      },
    ],
  },
  {
    id: 'sale-3',
    date: '11/05/2026, 14:10:00',
    eventId: 'event-2',
    eventName: 'Outro',
    eventDate: '2026-05-11',
    paymentMethod: 'mbway',
    status: 'completed',
    total: 9,
    items: [
      {
        productId: 'juice',
        name: 'Sumo',
        price: 3,
        quantity: 3,
      },
    ],
  },
];

describe('sales utils', () => {
  it('counts sale units', () => {
    assert.equal(getSaleUnits(sales[0]), 3);
  });

  it('matches sales to events by id first', () => {
    assert.equal(saleBelongsToEvent(sales[0], event), true);
    assert.equal(saleBelongsToEvent(sales[2], event), false);
  });

  it('keeps cancelled sales out of completed event totals', () => {
    const completedSales = getCompletedEventSales(sales, event);
    const summary = getEventSalesSummary(completedSales);

    assert.equal(completedSales.length, 1);
    assert.deepEqual(summary, {
      saleCount: 1,
      total: 5,
      cashTotal: 5,
      mbwayTotal: 0,
      units: 3,
    });
  });

  it('sorts top products by quantity and then total', () => {
    const topProducts = getTopProducts([
      sales[0],
      {
        ...sales[0],
        id: 'sale-4',
        items: [
          {
            productId: 'cake',
            name: 'Bolo',
            price: 3,
            quantity: 2,
          },
        ],
        total: 6,
      },
    ]);

    assert.deepEqual(
      topProducts.map((product) => product.productId),
      ['cake', 'water']
    );
  });
});
