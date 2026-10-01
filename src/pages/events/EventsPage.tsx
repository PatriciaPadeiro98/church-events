import { useState, type FormEvent } from 'react';
import type { Event } from '../../models/event.types';
import type { Sale } from '../../models/sale.types';
import { formatCurrency } from '../../utils/currency';
import {
  getCompletedEventSales,
  getEventSalesSummary,
  getTopProducts,
} from '../../utils/sales';

type EventsPageProps = {
  events: Event[];
  activeEvent?: Event;
  sales: Sale[];
  onCreateEvent: (name: string, date: string) => void;
  onSelectEvent: (eventId: string) => void;
  onCloseActiveEvent: () => void;
  onDeleteEvent: (eventId: string) => void;
};

const getToday = () => {
  return new Date().toISOString().split('T')[0];
};

export const EventsPage = ({
  events,
  activeEvent,
  sales,
  onCreateEvent,
  onSelectEvent,
  onCloseActiveEvent,
  onDeleteEvent,
}: EventsPageProps) => {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(getToday);
  const [expandedEventId, setExpandedEventId] = useState(activeEvent?.id ?? '');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!eventName.trim() || !eventDate) {
      return;
    }

    onCreateEvent(eventName.trim(), eventDate);
    setEventName('');
    setEventDate(getToday());
  };

  const handleDeleteEvent = (event: Event) => {
    if (event.status === 'deleted') {
      return;
    }

    const shouldDelete = window.confirm(
      `Marcar "${event.name}" como eliminado? O evento continua visível no arquivo.`
    );

    if (shouldDelete) {
      onDeleteEvent(event.id);
    }
  };

  return (
    <section className="screen-content events-screen">
      <div className="screen-header">
        <h2>Eventos</h2>

        <div className="screen-actions">
          <button
            className="secondary-button"
            onClick={onCloseActiveEvent}
            disabled={!activeEvent || activeEvent.status !== 'open'}
          >
            Fechar evento ativo
          </button>
        </div>
      </div>

      <form className="event-create-card" onSubmit={handleSubmit}>
        <label>
          <span>Novo evento</span>
          <input
            value={eventName}
            onChange={(event) => setEventName(event.target.value)}
            placeholder="Nome do evento"
          />
        </label>

        <label>
          <span>Data</span>
          <input
            value={eventDate}
            onChange={(event) => setEventDate(event.target.value)}
            type="date"
          />
        </label>

        <button className="primary-button">Criar e ativar</button>
      </form>

      <div className="event-cards-list">
        {events.map((event) => {
          const eventSales = getCompletedEventSales(sales, event);
          const summary = getEventSalesSummary(eventSales);
          const topProducts = getTopProducts(eventSales).slice(0, 3);
          const isActive = activeEvent?.id === event.id;
          const isExpanded = expandedEventId === event.id;
          const isDeleted = event.status === 'deleted';
          const eventStatusLabel =
            event.status === 'open'
              ? 'Aberto'
              : event.status === 'closed'
                ? 'Fechado'
                : 'Eliminado';
          const eventStatusClass =
            event.status === 'open'
              ? 'status-pill-open'
              : event.status === 'closed'
                ? 'status-pill-closed'
                : 'status-pill-deleted';

          return (
            <article
              key={event.id}
              className={`event-summary-card ${
                isActive ? 'event-summary-card-active' : ''
              } ${isDeleted ? 'event-summary-card-deleted' : ''}`}
            >
              <div className="event-summary-main">
                <div>
                  <div className="event-title-row">
                    <h3>{event.name}</h3>
                    <span className={`status-pill ${eventStatusClass}`}>
                      {eventStatusLabel}
                    </span>
                  </div>
                  <p>
                    {event.date}
                    {event.closedAt ? ` · Fechado em ${event.closedAt}` : ''}
                    {event.deletedAt ? ` · Eliminado em ${event.deletedAt}` : ''}
                  </p>
                </div>

                <div className="event-summary-total">
                  <span>Total</span>
                  <strong>{formatCurrency(summary.total)}</strong>
                </div>
              </div>

              <div className="event-summary-strip">
                <div>
                  <span>Vendas</span>
                  <strong>{summary.saleCount}</strong>
                </div>
                <div>
                  <span>Unidades</span>
                  <strong>{summary.units}</strong>
                </div>
                <div>
                  <span>Dinheiro</span>
                  <strong>{formatCurrency(summary.cashTotal)}</strong>
                </div>
                <div>
                  <span>MB WAY</span>
                  <strong>{formatCurrency(summary.mbwayTotal)}</strong>
                </div>
              </div>

              {isExpanded && (
                <div className="event-expanded-panel">
                  <div>
                    <span>Top produtos</span>
                    {topProducts.length ? (
                      <ol>
                        {topProducts.map((product) => (
                          <li key={product.productId}>
                            <strong>{product.name}</strong>
                            <span>{product.quantity} unidades</span>
                            <b>{formatCurrency(product.total)}</b>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p>Ainda não há produtos vendidos neste evento.</p>
                    )}
                  </div>
                </div>
              )}

              <div className="event-card-actions">
                <button
                  className="secondary-button"
                  onClick={() =>
                    setExpandedEventId(isExpanded ? '' : event.id)
                  }
                >
                  {isExpanded ? 'Esconder valores' : 'Ver valores'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() => onSelectEvent(event.id)}
                  disabled={isActive || isDeleted}
                >
                  {isActive ? 'Evento ativo' : 'Ativar evento'}
                </button>

                <button
                  className="secondary-button danger-button"
                  onClick={() => handleDeleteEvent(event)}
                  disabled={isDeleted}
                >
                  {isDeleted ? 'Eliminado' : 'Eliminar'}
                </button>
              </div>
            </article>
          );
        })}

        {!events.length && (
          <div className="empty-history">Ainda não há eventos guardados.</div>
        )}
      </div>
    </section>
  );
};
