export type PaymentMethod = 'cash' | 'mbway';

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type Sale = {
  id: string;
  date: string;
  eventId?: string;
  eventName: string;
  eventDate?: string;
  cashRegisterName?: string;
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  status?: 'completed' | 'cancelled';
  cancelledAt?: string;
};
