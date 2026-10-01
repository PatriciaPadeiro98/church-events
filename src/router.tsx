import { createBrowserRouter, Navigate, useOutletContext } from 'react-router-dom';
import { App, type AppContext } from './App';
import { CashRegisterPage } from './pages/cash-register/CashRegisterPage';
import { EventsPage } from './pages/events/EventsPage';
import { HistoryPage } from './pages/history/HistoryPage';
import { ProductsPage } from './pages/products/ProductsPage';

export const useAppContext = () => useOutletContext<AppContext>();

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/products" replace /> },
      {
        path: 'products',
        element: <ProductsRoute />,
      },
      {
        path: 'cash-register',
        element: <CashRegisterRoute />,
      },
      {
        path: 'events',
        element: <EventsRoute />,
      },
      {
        path: 'history',
        element: <HistoryRoute />,
      },
    ],
  },
]);

function ProductsRoute() {
  const { products, productActions } = useAppContext();
  return (
    <ProductsPage
      products={products}
      onAddProduct={productActions.handleOpenAddProduct}
      onEditProduct={productActions.handleEditProduct}
      onDeleteProduct={productActions.handleDeleteProduct}
      onImportProducts={productActions.handleImportProducts}
    />
  );
}

function CashRegisterRoute() {
  const { products, cashRegister } = useAppContext();
  return (
    <CashRegisterPage
      products={products}
      cartItems={cashRegister.cartItems}
      paymentMethod={cashRegister.paymentMethod}
      receivedAmount={cashRegister.receivedAmount}
      isEventClosed={!cashRegister.isEventOpen}
      canFinishSale={cashRegister.canFinishSale}
      received={cashRegister.received}
      onPaymentMethodChange={cashRegister.setPaymentMethod}
      onReceivedAmountChange={cashRegister.setReceivedAmount}
      onAddToCart={cashRegister.handleAddToCart}
      onRemoveFromCart={cashRegister.handleRemoveFromCart}
      onQuantityChange={cashRegister.handleQuantityChange}
      onClearCart={cashRegister.handleClearCart}
      onFinishSale={cashRegister.handleFinishSale}
    />
  );
}

function EventsRoute() {
  const { sales, eventState, eventActions } = useAppContext();
  return (
    <EventsPage
      events={eventState.events}
      activeEvent={eventActions.activeEvent}
      sales={sales}
      onCreateEvent={eventActions.handleCreateEvent}
      onSelectEvent={eventActions.handleSelectEvent}
      onCloseActiveEvent={eventActions.handleCloseActiveEvent}
      onDeleteEvent={eventActions.handleDeleteEvent}
    />
  );
}

function HistoryRoute() {
  const { sales, eventActions, onRefreshSales, onCancelSale } = useAppContext();
  return (
    <HistoryPage
      sales={sales}
      activeEvent={eventActions.activeEvent}
      onCancelSale={onCancelSale}
      onRefresh={onRefreshSales}
    />
  );
}
