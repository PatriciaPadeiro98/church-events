export type Event = {
  id: string;
  name: string;
  date: string;
  description?: string;
  status: 'open' | 'closed' | 'deleted';
  closedAt?: string;
  deletedAt?: string;
};
