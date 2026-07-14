import { Bell, HelpCircle, Menu, Calendar, User, Briefcase } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { PROFILES, type ProfileId } from '@/context/ProfileContext';
import { useProfileContext } from '@/context/useProfileContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { activeProfile, setActiveProfile } = useProfileContext();

  // Fecha formateada para el estilo RetailPro
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <header className="h-20 bg-primary flex items-center justify-between px-8 shadow-md z-10">
      {/* Lado Izquierdo: Logo y Fecha */}
      <div className="flex items-center gap-6">
        <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center border border-white/20 flex-shrink-0">
          <span className="text-white font-bold text-xl">R</span>
        </div>

        <div className="text-white">
          <h2 className="font-bold text-lg capitalize flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-200" />
            {today}
          </h2>
          <p className="text-brand-100 text-sm opacity-80">
            Terminal 01 • Sucursal Centro
          </p>
        </div>
      </div>

      {/* Lado Derecho: Perfil + Acciones Rápidas */}
      <div className="flex items-center gap-4">
        {/* Profile Switcher */}
        <div className="flex items-center gap-1 bg-white/10 rounded-xl p-1 border border-white/5">
          {(Object.keys(PROFILES) as ProfileId[]).map((id) => {
            const profile = PROFILES[id];
            const isActive = activeProfile.id === id;
            const Icon = profile.esCaja ? User : Briefcase;
            return (
              <button
                key={id}
                onClick={() => setActiveProfile(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {profile.shortLabel}
              </button>
            );
          })}
        </div>

        <div className="h-8 w-[1px] bg-white/20 hidden sm:block" />

        {/* Botón de Notificaciones con Badge Rojo como en la maqueta */}
        <Button className="relative bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all border border-white/5">
          <Bell className="w-5 h-5" />
          <span className="hidden md:inline font-medium text-sm">Notificaciones</span>
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-primary">
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