import { NavLink } from 'react-router-dom';
import logo from './../assets/logo.png';
import type { Event } from '../models/event.types';

const menuItems = [
  { path: '/products', label: 'Produtos', icon: '📦' },
  { path: '/cash-register', label: 'Caixa', icon: '💳' },
  { path: '/events', label: 'Eventos', icon: '📅' },
  { path: '/history', label: 'Histórico', icon: '🧾' },
] as const;

type AppSidebarProps = {
  activeEvent?: Event;
  cashRegisterName: string;
  onActiveEventChange: (event: Event) => void;
  onCloseActiveEvent: () => void;
  onCashRegisterNameChange: (name: string) => void;
};

export const AppSidebar = ({
  activeEvent,
  cashRegisterName,
  onActiveEventChange,
  onCloseActiveEvent,
  onCashRegisterNameChange,
}: AppSidebarProps) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={logo} width="50%" />
        <span>Paróquia de N. Sra. da Boa Nova</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : ''}`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="event-card">
        <span>Esta caixa</span>
        <input
          value={cashRegisterName}
          onChange={(e) => onCashRegisterNameChange(e.target.value)}
          placeholder="Ex: Caixa 1, Caixa Bar..."
        />
        <small>O nome identifica esta caixa no histórico de vendas.</small>
      </div>

      <div className="event-card">
        <span>Evento ativo</span>

        {activeEvent ? (
          <>
            <input
              value={activeEvent.name}
              onChange={(e) => onActiveEventChange({ ...activeEvent, name: e.target.value })}
              placeholder="Nome do evento"
              disabled={activeEvent.status !== 'open'}
            />

            <input
              value={activeEvent.date}
              onChange={(e) => onActiveEventChange({ ...activeEvent, date: e.target.value })}
              type="date"
              disabled={activeEvent.status !== 'open'}
            />

            <small>
              {activeEvent.status === 'open'
                ? 'As vendas ficam guardadas neste evento.'
                : 'Evento indisponível para novas vendas.'}
            </small>

            <button onClick={onCloseActiveEvent} disabled={activeEvent.status !== 'open'}>
              Fechar evento
            </button>
          </>
        ) : (
          <small>Sem evento ativo. Cria ou ativa um evento para vender.</small>
        )}
      </div>
    </aside>
  );
};
