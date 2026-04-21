import { Bell, HelpCircle, Menu, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  // Fecha formateada para el estilo RetailPro
  const today = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  return (
    <header className="h-20 bg-[#1E40AF] flex items-center justify-between px-8 shadow-md z-10">
      {/* Lado Izquierdo: Toggle y Fecha */}
      <div className="flex items-center gap-6">
        <Button
          variant="ghost"
          onClick={onToggleSidebar}
          className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground p-2 rounded-lg transition-colors"
        >
          <Menu className="w-7 h-7" />
        </Button>
        
        <div className="text-white">
          <h2 className="font-bold text-lg capitalize flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-200" />
            {today}
          </h2>
          <p className="text-blue-100 text-sm opacity-80">
            Terminal 01 • Sucursal Centro
          </p>
        </div>
      </div>

      {/* Lado Derecho: Acciones Rápidas */}
      <div className="flex items-center gap-4">
        {/* Botón de Notificaciones con Badge Rojo como en la maqueta */}
        <Button className="relative bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all border border-white/5">
          <Bell className="w-5 h-5" />
          <span className="hidden md:inline font-medium text-sm">Notificaciones</span>
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#1E40AF]">
            3
          </span>
        </Button>

        {/* Botón de Ayuda */}
        <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all border border-white/5">
          <HelpCircle className="w-5 h-5" />
          <span className="hidden md:inline font-medium text-sm">Ayuda</span>
        </button>

        {/* Separador Visual */}
        <div className="h-8 w-[1px] bg-white/20 mx-2 hidden sm:block" />

        {/* Avatar Rápido (Opcional, refuerza la identidad) */}
        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20 cursor-pointer hover:bg-white/20 transition-colors">
          <span className="text-white font-bold text-xs">CP</span>
        </div>
      </div>
    </header>
  );
}