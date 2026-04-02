import { Plus, Upload, Package, Clock } from 'lucide-react';

interface HeroSummaryProps {
  vigentesCount: number;
  lastUpdated: string | null;
  onNewPrecio: () => void;
  onImport: () => void;
}

export function HeroSummary({ vigentesCount, lastUpdated, onNewPrecio, onImport }: HeroSummaryProps) {
  const lastSync = lastUpdated
    ? new Date(lastUpdated).toLocaleString('es', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : new Date().toLocaleString('es', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });

  return (
    <section className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-600 relative overflow-hidden">
      {/* Subtle decorative circles */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/[0.03]" />
      <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-white/[0.04]" />
      <div className="absolute left-1/3 -bottom-16 h-48 w-48 rounded-full bg-white/[0.02]" />

      <div style={{ padding: '28px 40px' }} className="relative">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* ── Left: Title + sync ── */}
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Lista de Precios</h2>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-brand-200/80">
              <Clock className="h-3.5 w-3.5 opacity-60" />
              Última sincronización: {lastSync}
            </p>
          </div>

          {/* ── Right: Metrics + actions ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Metric cards */}
            <div className="flex gap-3">
              <MetricCard
                icon={<Package className="h-4 w-4 text-brand-300" />}
                label="Vigentes"
                value={vigentesCount.toLocaleString('es')}
              />
              <MetricCard
                icon={<Clock className="h-4 w-4 text-brand-300" />}
                label="Últ. actualización"
                value={lastSync.split(',')[0] || lastSync}
                small
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onImport}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 h-10 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20 active:bg-white/25 transition-all duration-200"
                aria-label="Importar precios desde archivo"
              >
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Importar</span>
              </button>
              <button
                onClick={onNewPrecio}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 h-10 text-sm font-semibold text-brand-900 shadow-lg shadow-black/10 hover:bg-brand-50 active:bg-brand-100 transition-all duration-200"
                aria-label="Crear nuevo precio"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo precio</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  icon,
  label,
  value,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-sm min-w-[130px]">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-medium text-brand-200/70 uppercase tracking-wider leading-none mb-0.5">{label}</p>
        <p className={`font-bold text-white leading-tight ${small ? 'text-sm' : 'text-xl'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
