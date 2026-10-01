import { useState, type FormEvent } from 'react';
import type { Event } from '../models/event.types';

type EventFormData = Omit<Event, 'id' | 'status' | 'closedAt' | 'deletedAt'>;

type EventFormModalProps = {
  event?: Event;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: EventFormData) => void;
};

export const EventFormModal = ({
  event,
  isOpen,
  onClose,
  onSubmit,
}: EventFormModalProps) => {
  const [formData, setFormData] = useState({
    name: event?.name || '',
    date: event?.date || new Date().toISOString().split('T')[0],
    description: event?.description || '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    onSubmit({
      name: formData.name,
      date: formData.date,
      description: formData.description,
    });

    setFormData({
      name: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{event ? 'Editar Evento' : 'Novo Evento'}</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label>Nome do Evento</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ex: Festa da Comunidade"
              required
            />
          </div>

          <div className="form-group">
            <label>Data</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Descrição (opcional)</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descrição do evento..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontFamily: 'inherit',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              {event ? 'Atualizar' : 'Criar'} Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
