import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './components/AppSidebar';
import { ProductFormModal } from './components/ProductFormModal';
import { initialProducts } from './data/initialProducts';
import type { Product } from './models/product.types';
import type { Sale } from './models/sale.types';
import { useCashRegister } from './pages/cash-register/useCashRegister';
import { type EventState, buildEventState, useEvents } from './pages/events/useEvents';
import { useProducts } from './pages/products/useProducts';
import { saveEvents } from './storages/events.storage';
import { getProducts, saveProducts } from './storages/products.storage';
import { addSale, cancelSale, getSales } from './storages/sales.storage';
import { getEvents } from './storages/events.storage';

const ACTIVE_EVENT_ID_STORAGE_KEY = 'activeEventId';
const CASH_REGISTER_NAME_STORAGE_KEY = 'cashRegisterName';

export type AppContext = {
  products: Product[];
  sales: Sale[];
  eventState: EventState;
  cashRegister: ReturnType<typeof useCashRegister>;
  productActions: ReturnType<typeof useProducts>;
  eventActions: ReturnType<typeof useEvents>;
  onRefreshSales: () => void;
  onAddSale: (sale: Sale) => Promise<void>;
  onCancelSale: (saleId: string) => Promise<void>;
};

export const App = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [eventState, setEventState] = useState<EventState>({ events: [], activeEventId: undefined });
  const [cashRegisterName, setCashRegisterName] = useState<string>(
    () => localStorage.getItem(CASH_REGISTER_NAME_STORAGE_KEY) ?? ''
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const skipSave = useRef({ products: false, events: false });

  useEffect(() => {
    Promise.all([getProducts(), getSales(), getEvents()]).then(
      ([savedProducts, savedSales, savedEvents]) => {
        setProducts(savedProducts.length ? savedProducts : initialProducts);
        setSales(savedSales);
        setEventState(buildEventState(savedEvents, localStorage.getItem(ACTIVE_EVENT_ID_STORAGE_KEY)));
        setIsLoaded(true);
      }
    );
  }, []);

  const handleCashRegisterNameChange = (name: string) => {
    setCashRegisterName(name);
    localStorage.setItem(CASH_REGISTER_NAME_STORAGE_KEY, name);
  };

  const handleRefreshSales = async () => {
    const freshSales = await getSales();
    setSales(freshSales);
  };

  const handleAddSale = async (sale: Sale) => {
    await addSale(sale);
    setSales((current) => [sale, ...current]);
    const freshProducts = await getProducts();
    skipSave.current.products = true;
    setProducts(freshProducts);
  };

  const handleCancelSale = async (saleId: string) => {
    const updated = await cancelSale(saleId);
    setSales((current) => current.map((s) => (s.id === saleId ? updated : s)));
    const freshProducts = await getProducts();
    skipSave.current.products = true;
    setProducts(freshProducts);
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (skipSave.current.products) { skipSave.current.products = false; return; }
    saveProducts(products);
  }, [products, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (skipSave.current.events) { skipSave.current.events = false; return; }
    saveEvents(eventState.events);
    if (eventState.activeEventId) {
      localStorage.setItem(ACTIVE_EVENT_ID_STORAGE_KEY, eventState.activeEventId);
    } else {
      localStorage.removeItem(ACTIVE_EVENT_ID_STORAGE_KEY);
    }
  }, [eventState, isLoaded]);

  const cashRegister = useCashRegister({
    products,
    onAddSale: handleAddSale,
    cashRegisterName,
    activeEvent: eventState.events.find((e) => e.id === eventState.activeEventId),
  });

  const productActions = useProducts({
    setProducts,
    clearProductFromCart: cashRegister.clearProductFromCart,
  });

  const eventActions = useEvents({
    eventState,
    setEventState,
    onClearCart: cashRegister.handleClearCart,
  });

  if (!isLoaded) {
    return (
      <main className="app-page">
        <div className="app-loading">A carregar dados...</div>
      </main>
    );
  }

  const context: AppContext = {
    products,
    sales,
    eventState,
    cashRegister,
    productActions,
    eventActions,
    onRefreshSales: handleRefreshSales,
    onAddSale: handleAddSale,
    onCancelSale: handleCancelSale,
  };

  return (
    <main className="app-page">
      <div className="app-shell">
        <AppSidebar
          activeEvent={eventActions.activeEvent}
          cashRegisterName={cashRegisterName}
          onActiveEventChange={eventActions.handleUpdateActiveEvent}
          onCloseActiveEvent={eventActions.handleCloseActiveEvent}
          onCashRegisterNameChange={handleCashRegisterNameChange}
        />
        <section className="app-content">
          <Outlet context={context} />
        </section>
      </div>

      <ProductFormModal
        product={productActions.productBeingEdited}
        isOpen={productActions.isModalOpen}
        onClose={productActions.handleCloseModal}
        onSubmit={productActions.handleSaveProduct}
      />
    </main>
  );
};
