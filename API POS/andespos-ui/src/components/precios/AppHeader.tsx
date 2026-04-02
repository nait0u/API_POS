import { Building2, MapPin, User, Shield } from 'lucide-react';

interface AppHeaderProps {
  empresaNombre?: string;
  sucursal?: string;
  userName?: string;
  userRole?: string;
}

export function AppHeader({
  empresaNombre = 'Andes Comercial S.A.',
  sucursal = 'Sucursal Centro',
  userName = 'Juan Pérez',
  userRole = 'Administrador',
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-brand-900 shadow-lg shadow-brand-900/20">
      <div style={{ padding: '0 40px' }} className="flex h-full items-center justify-between">
        {/* ── Left: Logo + brand ── */}
        <div className="flex items-center gap-3">
          {/* Logo placeholder */}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
            <span className="text-lg font-bold text-white tracking-tight">A</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-[15px] font-semibold text-white leading-tight tracking-tight">
              Andes<span className="font-light opacity-80">POS</span>
            </h1>
            <p className="text-[11px] font-medium text-brand-300 leading-none">Precios</p>
          </div>
        </div>

        {/* ── Right: Company / user info (compact chips) ── */}
        <div className="flex items-center gap-4">
          {/* Info chips - hidden on very small screens */}
          <div className="hidden md:flex items-center gap-3">
            <InfoChip icon={<Building2 className="h-3 w-3" />} label={empresaNombre} />
            <div className="h-4 w-px bg-white/20" />
            <InfoChip icon={<MapPin className="h-3 w-3" />} label={sucursal} />
          </div>
          <div className="hidden lg:flex items-center gap-3">
            <div className="h-4 w-px bg-white/20" />
            <InfoChip icon={<User className="h-3 w-3" />} label={userName} />
            <InfoChip icon={<Shield className="h-3 w-3" />} label={userRole} subtle />
          </div>

          {/* Avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white ring-2 ring-white/20">
            {userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        </div>
      </div>
    </header>
  );
}

function InfoChip({ icon, label, subtle }: { icon: React.ReactNode; label: string; subtle?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[12px] leading-none ${
        subtle ? 'text-brand-300/70' : 'text-brand-200'
      }`}
    >
      <span className="opacity-60">{icon}</span>
      <span className="max-w-[140px] truncate">{label}</span>
    </span>
  );
}
