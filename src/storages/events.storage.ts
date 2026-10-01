import type { Event } from '../models/event.types';

export const getEvents = async (): Promise<Event[]> => {
  const res = await fetch('/api/events');
  return res.json();
};

export const saveEvents = async (events: Event[]): Promise<void> => {
  await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(events),
  });
};
