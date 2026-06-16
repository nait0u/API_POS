import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60,      // 1 hora — catálogos POS son estables
      gcTime: 1000 * 60 * 60 * 2,     // 2 horas — retención en RAM (sin disco)
      refetchOnWindowFocus: false,     // crítico: el POS no debe recargar al alt-tab
      refetchOnMount: false,
      retry: 1,
    },
  },
});
import { Toaster } from 'sonner';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { PriceListView } from '@/views/PriceListView';
import { SalesHistoryView } from '@/views/SalesHistoryView';
import { CustomerSelectionView } from '@/views/CustomerSelectionView';
import { PantallaVentaView } from '@/views/PantallaVentaView';
import { AppProvider } from '@/context/AppContext';
import { useAppContext } from '@/context/useAppContext';
import { ProfileProvider } from '@/context/ProfileContext';
import { PosStateProvider } from '@/context/PosStateContext';
import { PosStateGate } from '@/components/pos/PosStateGate';
import { BootScreen } from '@/components/system/BootScreen';
import { UnauthorizedScreen } from '@/components/system/UnauthorizedScreen';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        <AppProvider>
          <AppShell />
          <Toaster richColors position="top-right" />
        </AppProvider>
      </ProfileProvider>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// AppShell — decide qué renderizar en función del status del bootstrap.
// Se mantiene dentro del <AppProvider> para poder consumir useAppContext().
// ---------------------------------------------------------------------------
function AppShell() {
  const { status, deviceInfo, error, reload } = useAppContext();

  if (status === 'loading') {
    return <BootScreen />;
  }

  if (status === 'unauthorized') {
    return (
      <UnauthorizedScreen
        variant="unauthorized"
        deviceInfo={deviceInfo}
        errorMessage={null}
        onRetry={() => void reload()}
      />
    );
  }

  if (status === 'error') {
    return (
      <UnauthorizedScreen
        variant="error"
        deviceInfo={deviceInfo}
        errorMessage={error}
        onRetry={() => void reload()}
      />
    );
  }

  // PosStateProvider depende del bootstrap (necesita /bff/ventas/estado-caja),
  // por eso se monta recién acá.
  return (
    <PosStateProvider>
      <MainLayout />
      <PosStateGate />
    </PosStateProvider>
  );
}

// ---------------------------------------------------------------------------
// MainLayout — shell original del POS, se monta sólo cuando status === 'ready'.
// A partir de aquí cualquier descendiente puede usar useDeviceInfo() /
// useAppParameters() sin manejar null.
// ---------------------------------------------------------------------------
function MainLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('prices');
  const [pendingNotaVentaKey, setPendingNotaVentaKey] = useState<number | null>(null);

  const handleSaleCreated = (notaVentaKey: number) => {
    setPendingNotaVentaKey(notaVentaKey);
    setCurrentView('nota-de-venta');
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden font-sans">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <main className="flex-1 overflow-y-auto bg-background">
          {currentView === 'prices' && <PriceListView />}
          {currentView === 'sales' && (
            <SalesHistoryView
              onViewChange={setCurrentView}
              onSaleCreated={handleSaleCreated}
            />
          )}
          {currentView === 'customer-selection' && (
            <CustomerSelectionView
              onBack={() => setCurrentView('sales')}
              onSaleCreated={handleSaleCreated}
            />
          )}
          {currentView === 'nota-de-venta' && (
            <PantallaVentaView notaVentaKey={pendingNotaVentaKey} />
          )}
        </main>
      </div>
    </div>
  );
}
