import { useNavigate } from 'react-router-dom';
import type { Event } from '../../models/event.types';

export type EventState = {
  events: Event[];
  activeEventId?: string;
};

type UseEventsParams = {
  eventState: EventState;
  setEventState: React.Dispatch<React.SetStateAction<EventState>>;
  onClearCart: () => void;
};

const canUseEvent = (event: Event) => event.status !== 'deleted';

const createEvent = (name: string, date: string): Event => ({
  id: crypto.randomUUID(),
  name,
  date,
  status: 'open',
});

export const buildEventState = (events: Event[], savedActiveEventId?: string | null): EventState => {
  const activeEvent =
    events.find((e) => e.id === savedActiveEventId && canUseEvent(e)) ??
    events.find((e) => e.status === 'open') ??
    events.find(canUseEvent);

  return { events, activeEventId: activeEvent?.id };
};

export const useEvents = ({ eventState, setEventState, onClearCart }: UseEventsParams) => {
  const navigate = useNavigate();
  const { events, activeEventId } = eventState;
  const activeEvent = events.find((event) => event.id === activeEventId);

  const handleCreateEvent = (name: string, date: string) => {
    const nextEvent = createEvent(name, date);
    onClearCart();
    setEventState((current) => ({
      events: [nextEvent, ...current.events],
      activeEventId: nextEvent.id,
    }));
    navigate('/cash-register');
  };

  const handleSelectEvent = (eventId: string) => {
    const eventToSelect = events.find((event) => event.id === eventId);
    if (!eventToSelect || !canUseEvent(eventToSelect)) return;

    onClearCart();
    setEventState((current) => ({ ...current, activeEventId: eventId }));
  };

  const handleUpdateActiveEvent = (eventData: Event) => {
    setEventState((current) => ({
      ...current,
      events: current.events.map((event) =>
        event.id === eventData.id ? eventData : event
      ),
    }));
  };

  const handleCloseActiveEvent = () => {
    if (!activeEvent || activeEvent.status !== 'open') return;

    onClearCart();
    setEventState((current) => ({
      ...current,
      events: current.events.map((event) =>
        event.id === current.activeEventId
          ? { ...event, status: 'closed', closedAt: new Date().toLocaleString('pt-PT') }
          : event
      ),
    }));
    navigate('/events');
  };

  const handleDeleteEvent = (eventId: string) => {
    const eventToDelete = events.find((event) => event.id === eventId);
    if (!eventToDelete || eventToDelete.status === 'deleted') return;

    onClearCart();
    setEventState((current) => {
      const deletedAt = new Date().toLocaleString('pt-PT');
      const nextEvents: Event[] = current.events.map((event) =>
        event.id === eventId ? { ...event, status: 'deleted', deletedAt } : event
      );

      const nextActiveEventId =
        current.activeEventId !== eventId
          ? current.activeEventId
          : (
              nextEvents.find((e) => e.id !== eventId && e.status === 'open') ??
              nextEvents.find((e) => e.id !== eventId && canUseEvent(e))
            )?.id;

      return { events: nextEvents, activeEventId: nextActiveEventId };
    });
  };

  return {
    activeEvent,
    handleCreateEvent,
    handleSelectEvent,
    handleUpdateActiveEvent,
    handleCloseActiveEvent,
    handleDeleteEvent,
  };
};
