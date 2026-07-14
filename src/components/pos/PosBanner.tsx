import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { usePosVentaStore, selectBannerTransaccion } from '@/store/posVentaStore';
import { useProfileContext } from '@/context/useProfileContext';

function formatFecha(raw: string | null): string {
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return raw;
  }
}

/** Chip de dato individual — etiqueta visible + valor */
function BannerChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5 min-w-0">
      <dt className="shrink-0 text-brand-200 text-[0.62rem] font-bold uppercase tracking-[0.07em] leading-none">
        {label}
      </dt>
      <dd className="text-primary-foreground text-[0.78rem] font-medium leading-none truncate">
        {value}
      </dd>
    </div>
  );
}

/**
 * Banner transaccional y de sesión del POS.
 *
 * Consume el estado global directamente (sin prop-drilling desde PantallaVentaView):
 *  - Datos de sesión: ProfileContext → headers x-pos-punto-acceso-desc / x-pos-estacion-turno-idl
 *  - Datos de transacción: usePosVentaStore → selectBannerTransaccion + useParams para el folio
 *
 * React.memo aísla este componente de los re-renders originados por actualizaciones del carrito.
 */
export const PosBanner = React.memo(function PosBanner() {
  const { notaVentaKey } = useParams<{ notaVentaKey: string }>();

  const { tipoDocumento, cliente, vendedor, ventaFecha } =
    usePosVentaStore(useShallow(selectBannerTransaccion));

  const { getHeaders } = useProfileContext();

  const { puntoAccesoDesc, estacionIdl } = useMemo(() => {
    const h = getHeaders();
    return {
      puntoAccesoDesc: (h['x-pos-punto-acceso-desc'] ?? '').toUpperCase(),
      estacionIdl:     (h['x-pos-estacion-turno-idl'] ?? '').toUpperCase(),
    };
  }, [getHeaders]);

  const sessionLabel =
    puntoAccesoDesc && estacionIdl
      ? `${puntoAccesoDesc} — ${estacionIdl}`
      : puntoAccesoDesc || estacionIdl || '—';

  return (
    <header
      aria-label="Contexto de sesión y transacción activa"
      className="shrink-0 bg-primary border-b border-white/10 px-4 py-0 h-10 flex items-center justify-between gap-6"
    >
      {/* ── Sector izquierdo: datos de la transacción ──────────────── */}
      <dl className="flex items-center gap-5 flex-1 min-w-0 overflow-hidden">
        {/* Número de operación — siempre visible, sin label (es el identificador principal) */}
        <div className="flex items-baseline gap-1 shrink-0">
          <dt className="sr-only">Número de operación</dt>
          <dd className="text-primary-foreground font-bold text-[0.82rem] tracking-wide leading-none whitespace-nowrap">
            Operación&nbsp;
            <span className="font-mono text-brand-200">#{notaVentaKey}</span>
          </dd>
        </div>

        {/* Separador visual */}
        <div className="h-4 w-px bg-white/20 shrink-0" aria-hidden="true" />

        {ventaFecha && <BannerChip label="Fecha" value={formatFecha(ventaFecha)} />}
        {tipoDocumento && <BannerChip label="Doc." value={tipoDocumento} />}
        {cliente && <BannerChip label="Cliente" value={cliente} />}
        {vendedor && <BannerChip label="Vendedor" value={vendedor} />}
      </dl>

      {/* ── Sector derecho: sesión (punto de acceso + estación) ──────── */}
      <div
        role="status"
        aria-label={`Sesión activa: ${sessionLabel}`}
        className="shrink-0 flex items-center gap-2 bg-white/10 border border-white/20 rounded-md px-3 h-6"
      >
        <span className="text-primary-foreground text-[0.7rem] font-semibold tracking-wide whitespace-nowrap leading-none">
          {sessionLabel}
        </span>
      </div>
    </header>
  );
});
