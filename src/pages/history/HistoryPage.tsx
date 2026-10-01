import type { Event } from "../../models/event.types";
import type { Sale } from "../../models/sale.types";
import { formatCurrency } from "../../utils/currency";
import {
  getCompletedEventSales,
  getEventSalesSummary,
  getSaleUnits,
} from "../../utils/sales";

type HistoryPageProps = {
  sales: Sale[];
  activeEvent?: Event;
  onCancelSale: (saleId: string) => Promise<void>;
  onRefresh: () => void;
};

const downloadFile = (content: string, type: string, filename: string) => {
  const file = new Blob([content], { type });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const escapeCsvValue = (value: string | number) => {
  return `"${String(value).replaceAll('"', '""')}"`;
};

const getSalesCsv = (sales: Sale[]) => {
  const rows: Array<Array<string | number>> = [
    [
      "Estado",
      "Data/Hora",
      "Evento",
      "Data Evento",
      "Caixa",
      "Pagamento",
      "Produto",
      "Quantidade",
      "Preço",
      "Total Item",
      "Total Venda",
    ],
  ];

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      rows.push([
        sale.status === "cancelled" ? "Anulada" : "Concluída",
        sale.date,
        sale.eventName,
        sale.eventDate ?? "",
        sale.cashRegisterName ?? "",
        sale.paymentMethod === "cash" ? "Dinheiro" : "MB WAY",
        item.name,
        item.quantity,
        item.price,
        item.price * item.quantity,
        sale.total,
      ]);
    });
  });

  return rows
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");
};

export const HistoryPage = ({
  sales,
  activeEvent,
  onCancelSale,
  onRefresh,
}: HistoryPageProps) => {
  const activeCompletedEventSales = activeEvent
    ? getCompletedEventSales(sales, activeEvent)
    : [];
  const activeEventSummary = getEventSalesSummary(activeCompletedEventSales);

  const handleExportCsv = () => {
    downloadFile(
      getSalesCsv(sales),
      "text/csv;charset=utf-8",
      "historico-vendas.csv",
    );
  };

  return (
    <section className="screen-content history-screen">
      <div className="history-topbar">
        <h2>Histórico de vendas</h2>

        <div className="history-actions">
          <button>
            📅{" "}
            {activeEvent
              ? `Evento ativo: ${activeEvent.date}`
              : "Sem evento ativo"}
          </button>
          <button onClick={onRefresh}>↻ Atualizar</button>
          <button onClick={handleExportCsv}>⬇ Exportar (CSV)</button>
        </div>
      </div>

      <div className="metrics-grid history-metrics">
        <div className="metric-card">
          <div className="metric-icon metric-icon-teal">€</div>
          <div>
            <span>Total do evento</span>
            <strong>{formatCurrency(activeEventSummary.total)}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon metric-icon-green">#</div>
          <div>
            <span>Vendas concluídas</span>
            <strong>{activeEventSummary.saleCount}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon metric-icon-yellow">D</div>
          <div>
            <span>Dinheiro</span>
            <strong>{formatCurrency(activeEventSummary.cashTotal)}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon metric-icon-orange">M</div>
          <div>
            <span>MB WAY</span>
            <strong>{formatCurrency(activeEventSummary.mbwayTotal)}</strong>
          </div>
        </div>
      </div>

      <div className="history-grid">
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Evento</th>
                <th>Caixa</th>
                <th>Itens</th>
                <th>Total</th>
                <th>Pagamento</th>
                <th>Estado</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.date}</td>
                  <td>
                    <strong>{sale.eventName}</strong>
                    {sale.eventDate && <small>{sale.eventDate}</small>}
                  </td>
                  <td>{sale.cashRegisterName ?? <span style={{ color: 'var(--color-text-muted, #888)' }}>—</span>}</td>
                  <td>{getSaleUnits(sale)} unidades</td>
                  <td>{formatCurrency(sale.total)}</td>
                  <td>
                    <span
                      className={`payment-pill ${
                        sale.paymentMethod === "cash"
                          ? "payment-pill-cash"
                          : "payment-pill-mbway"
                      }`}
                    >
                      {sale.paymentMethod === "cash" ? "Dinheiro" : "MB WAY"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${
                        sale.status === "cancelled"
                          ? "status-pill-closed"
                          : "status-pill-open"
                      }`}
                    >
                      {sale.status === "cancelled" ? "Anulada" : "Concluída"}
                    </span>
                    {sale.cancelledAt && <small>{sale.cancelledAt}</small>}
                  </td>
                  <td>
                    <button
                      className="secondary-button"
                      disabled={sale.status === "cancelled"}
                      onClick={() => onCancelSale(sale.id)}
                    >
                      Anular
                    </button>
                  </td>
                </tr>
              ))}

              {!sales.length && (
                <tr>
                  <td colSpan={7} className="empty-history">
                    Ainda não há vendas guardadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
