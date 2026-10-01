import type { Event } from '../models/event.types';
import type { Sale } from '../models/sale.types';

export type ProductSalesSummary = {
  productId: string;
  name: string;
  quantity: number;
  total: number;
};

export type EventSalesSummary = {
  saleCount: number;
  total: number;
  cashTotal: number;
  mbwayTotal: number;
  units: number;
};

export const isCompletedSale = (sale: Sale) => {
  return sale.status !== 'cancelled';
};

export const getSaleUnits = (sale: Sale) => {
  return sale.items.reduce((sum, item) => sum + item.quantity, 0);
};

export const saleBelongsToEvent = (sale: Sale, event: Event) => {
  if (sale.eventId) {
    return sale.eventId === event.id;
  }

  return (
    sale.eventName === event.name &&
    (!sale.eventDate || sale.eventDate === event.date)
  );
};

export const getEventSales = (sales: Sale[], event: Event) => {
  return sales.filter((sale) => saleBelongsToEvent(sale, event));
};

export const getCompletedEventSales = (sales: Sale[], event: Event) => {
  return getEventSales(sales, event).filter(isCompletedSale);
};

export const getEventSalesSummary = (sales: Sale[]): EventSalesSummary => {
  return sales.reduce(
    (summary, sale) => {
      summary.saleCount += 1;
      summary.total += sale.total;
      summary.units += getSaleUnits(sale);

      if (sale.paymentMethod === 'cash') {
        summary.cashTotal += sale.total;
      } else {
        summary.mbwayTotal += sale.total;
      }

      return summary;
    },
    {
      saleCount: 0,
      total: 0,
      cashTotal: 0,
      mbwayTotal: 0,
      units: 0,
    }
  );
};

export const getTopProducts = (sales: Sale[]) => {
  return Array.from(
    sales
      .reduce((productsMap, sale) => {
        sale.items.forEach((item) => {
          const currentProduct = productsMap.get(item.productId);
          const itemTotal = item.price * item.quantity;

          if (!currentProduct) {
            productsMap.set(item.productId, {
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              total: itemTotal,
            });
            return;
          }

          productsMap.set(item.productId, {
            ...currentProduct,
            quantity: currentProduct.quantity + item.quantity,
            total: currentProduct.total + itemTotal,
          });
        });

        return productsMap;
      }, new Map<string, ProductSalesSummary>())
      .values()
  ).sort((firstProduct, secondProduct) => {
    return (
      secondProduct.quantity - firstProduct.quantity ||
      secondProduct.total - firstProduct.total
    );
  });
};
