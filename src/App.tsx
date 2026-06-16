import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60,
      gcTime: 1000 * 60 * 60 * 2,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ProfileProvider>
          <AppProvider>
            <AppShell />
            <Toaster richColors position="top-right" />
          </AppProvider>
        </ProfileProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

// ---------------------------------------------------------------------------
// AppShell — decide qué renderizar en función del status del bootstrap.
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

  return (
    <PosStateProvider>
      <Routes>
        <Route element={<PosLayout />}>
          {/* Dominio Ventas — protegido por estado de caja */}
          <Route element={<PosStateGate><Outlet /></PosStateGate>}>
            <Route path="/ventas" element={<SalesHistoryView />} />
            <Route path="/ventas/nueva/cliente" element={<CustomerSelectionView />} />
            <Route path="/ventas/:notaVentaKey" element={<PantallaVentaView />} />
          </Route>

          {/* Dominio Mantenedores — sin gate de caja */}
          <Route path="/precios" element={<PriceListView />} />
        </Route>
        <Route path="*" element={<Navigate to="/ventas" replace />} />
      </Routes>
    </PosStateProvider>
  );
}

// ---------------------------------------------------------------------------
// PosLayout — shell visual: sidebar + header + outlet.
// ---------------------------------------------------------------------------
function PosLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex bg-background overflow-hidden font-sans">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
