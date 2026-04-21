import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { PriceListView } from '@/views/PriceListView';

export default function App() {
  const [currentView, setCurrentView] = useState('prices');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    // Contenedor principal: ocupa toda la pantalla y evita el scroll global
    <div className="h-screen flex bg-slate-50 overflow-hidden font-sans">
      
      {/* Barra lateral de navegación */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView}
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      {/* Área de contenido derecha */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Encabezado azul institucional */}
        <Header 
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />

        {/* Vista activa: Aquí es donde vive la lógica de Precios */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          <PriceListView />
        </main>
        
      </div>
    </div>
  );
}