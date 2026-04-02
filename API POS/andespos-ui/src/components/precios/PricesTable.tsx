import { ArrowDown, ArrowUp, ArrowUpDown, Edit3, XCircle, PackageOpen, Plus, Upload, ChevronLeft, ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';
import type { SDTPrecios, SortState, PaginationState } from '../../types/precios';
import clsx from 'clsx';

// ─── Column definitions ───
interface Column {
  key: keyof SDTPrecios | '_actions';
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  minW?: string;
  format?: (val: unknown, row: SDTPrecios) => React.ReactNode;
  sticky?: boolean;
}

const fmtCurrency = (v: unknown) => {
  const n = Number(v);
  return isNaN(n) ? '-' : n.toLocaleString('es', { style: 'currency', currency: 'CLP', minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const fmtPct = (v: unknown) => {
  const n = Number(v);
  return isNaN(n) ? '-' : `${n.toFixed(1)}%`;
};
const fmtDate = (v: unknown) => {
  if (!v) return '-';
  try { return new Date(String(v)).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return String(v); }
};
const fmtTime = (v: unknown) => {
  if (!v) return '-';
  const s = String(v);
  return s.length >= 5 ? s.slice(0, 5) : s;
};

const COLUMNS: Column[] = [
  { key: 'CodIntValor', label: 'Código', sortable: true, minW: 'min-w-[100px]' },
  { key: 'ProductoDescripcion', label: 'Descripción', sortable: true, minW: 'min-w-[200px]' },
  { key: 'PrecioTimeInicio', label: 'Inicio', sortable: true, format: v => fmtDate(v), minW: 'min-w-[105px]' },
  { key: 'PrecioTimeFin', label: 'Fin', format: v => fmtDate(v), minW: 'min-w-[105px]' },
  { key: 'PrecioHoraInicio', label: 'Hora Ini.', format: v => fmtTime(v), minW: 'min-w-[80px]', align: 'center' },
  { key: 'PrecioHoraFin', label: 'Hora Fin', format: v => fmtTime(v), minW: 'min-w-[80px]', align: 'center' },
  { key: 'PrecioUbiCod', label: 'Ubicación', minW: 'min-w-[90px]' },
  { key: 'CategoriaPrecioIdl', label: 'Categoría', minW: 'min-w-[105px]' },
  { key: 'PrecioCantidad', label: 'Cant.', align: 'right', minW: 'min-w-[70px]' },
  { key: 'PrecioItem', label: 'Precio', sortable: true, align: 'right', format: v => fmtCurrency(v), minW: 'min-w-[115px]' },
  { key: 'PrecioDescuentoPorcentaje', label: 'Desc. %', align: 'right', format: v => fmtPct(v), minW: 'min-w-[80px]' },
  { key: 'PrecioDescuentoMax', label: 'Desc. Máx', align: 'right', format: v => fmtPct(v), minW: 'min-w-[85px]' },
  { key: '_actions', label: '', sticky: true, align: 'center', minW: 'min-w-[96px]' },
];

// ─── Props ───
interface PricesTableProps {
  items: SDTPrecios[];
  loading: boolean;
  error: string | null;
  errorStatus: number | null;
  sort: SortState;
  pagination: PaginationState;
  totalPages: number;
  totalCount: number;
  onSort: (column: keyof SDTPrecios) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (row: SDTPrecios) => void;
  onExpire: (row: SDTPrecios) => void;
  onRetry: () => void;
  onNewPrecio: () => void;
  onImport: () => void;
}

// ─── Component ───
export function PricesTable({
  items, loading, error, errorStatus, sort, pagination, totalPages, totalCount,
  onSort, onPageChange, onPageSizeChange, onEdit, onExpire, onRetry, onNewPrecio, onImport,
}: PricesTableProps) {

  // ── Error state ──
  if (error && !loading) {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-14 shadow-sm text-center animate-fade-up">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50">
          <AlertTriangle className="h-7 w-7 text-danger-500" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-800 mb-2">Error al cargar precios</h3>
        <p className="text-sm text-neutral-500 mb-1">{error}</p>
        {errorStatus && <p className="text-xs text-neutral-400 mb-6">Código: {errorStatus}</p>}
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-900 px-5 h-10 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reintentar
        </button>
      </div>
    );
  }

  // ── Empty state ──
  if (!loading && items.length === 0 && !error) {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-14 shadow-sm text-center animate-fade-up">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
          <PackageOpen className="h-7 w-7 text-brand-600" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-800 mb-2">No se encontraron precios</h3>
        <p className="text-sm text-neutral-500 mb-6">Ajuste los filtros o cree un nuevo precio.</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onNewPrecio}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-900 px-5 h-10 text-sm font-semibold text-white shadow-sm hover:bg-brand-800 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo precio
          </button>
          <button
            onClick={onImport}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 h-10 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all"
          >
            <Upload className="h-3.5 w-3.5" />
            Importar
          </button>
        </div>
      </div>
    );
  }

  const SortIcon = ({ col }: { col: keyof SDTPrecios }) => {
    if (sort.column !== col) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sort.direction === 'asc'
      ? <ArrowUp className="h-3 w-3 text-brand-600" />
      : <ArrowDown className="h-3 w-3 text-brand-600" />;
  };

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '0.1s' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="grid">
          {/* ── Header — improved spacing ── */}
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-neutral-200 bg-neutral-50/80 backdrop-blur-sm">
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  className={clsx(
                    'text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap text-brand-900/60',
                    col.minW,
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.sticky && 'sticky right-0 bg-neutral-50/95 backdrop-blur-sm shadow-[-4px_0_8px_rgba(0,0,0,0.04)]',
                    col.sortable && 'cursor-pointer select-none hover:text-brand-900 transition-colors',
                  )}
                  style={{ padding: '14px 24px' }}
                  onClick={() => col.sortable && col.key !== '_actions' && onSort(col.key as keyof SDTPrecios)}
                  role={col.sortable ? 'columnheader button' : 'columnheader'}
                  aria-sort={sort.column === col.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && col.key !== '_actions' && <SortIcon col={col.key as keyof SDTPrecios} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Body — improved row spacing ── */}
          <tbody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                <tr key={`sk-${i}`} className="animate-pulse border-b border-neutral-100">
                  {COLUMNS.map(col => (
                    <td key={col.key} className={clsx(col.sticky && 'sticky right-0 bg-white')} style={{ padding: '14px 24px' }}>
                      <div className="h-4 rounded-md bg-neutral-200/60" style={{ width: `${50 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))
              : items.map((row, idx) => (
                <tr
                  key={`${row.Empkey}-${row.ProductoKey}-${idx}`}
                  className={clsx(
                    'border-b border-neutral-100 transition-colors duration-150',
                    'hover:bg-brand-300/10',
                    idx % 2 === 1 && 'bg-neutral-50/50',
                  )}
                >
                  {COLUMNS.map(col => {
                    if (col.key === '_actions') {
                      return (
                        <td
                          key="_actions"
                          className="sticky right-0 bg-white shadow-[-4px_0_8px_rgba(0,0,0,0.04)]"
                          style={{ padding: '8px 24px' }}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onEdit(row)}
                              className="rounded-lg p-2 text-neutral-400 hover:text-brand-900 hover:bg-brand-300/20 transition-all duration-200"
                              aria-label={`Editar ${row.ProductoDescripcion}`}
                              title="Editar precio"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onExpire(row)}
                              className="rounded-lg p-2 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 transition-all duration-200"
                              aria-label={`Caducar ${row.ProductoDescripcion}`}
                              title="Caducar precio"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      );
                    }

                    const value = row[col.key as keyof SDTPrecios];
                    const display = col.format ? col.format(value, row) : String(value ?? '-');

                    return (
                      <td
                        key={col.key}
                        className={clsx(
                          'whitespace-nowrap text-[13px]',
                          col.align === 'right' ? 'text-right tabular-nums font-medium text-neutral-800' : col.align === 'center' ? 'text-center text-neutral-600' : 'text-neutral-700',
                        )}
                        style={{ padding: '12px 24px' }}
                      >
                        {col.key === 'PrecioUbiCod' ? (
                          <span title={row.Ubinom || row.PrecioUbiCod} className="text-brand-900 font-medium">
                            {row.PrecioUbiCod}
                          </span>
                        ) : col.key === 'ProductoDescripcion' ? (
                          <span className="block max-w-[220px] truncate font-medium text-neutral-800" title={row.ProductoDescripcion}>
                            {row.ProductoDescripcion}
                          </span>
                        ) : col.key === 'CodIntValor' ? (
                          <span className="font-semibold text-brand-900">{display}</span>
                        ) : (
                          display
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      {!loading && items.length > 0 && (
        <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3.5 bg-neutral-50/50">
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span className="tabular-nums">
              {(pagination.page - 1) * pagination.pageSize + 1}–{Math.min(pagination.page * pagination.pageSize, totalCount)}{' '}
              <span className="text-neutral-400">de</span> {totalCount}
            </span>
            <label htmlFor="page-size-select" className="sr-only">Filas por página</label>
            <select
              id="page-size-select"
              value={pagination.pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-xs text-neutral-600 focus:ring-2 focus:ring-brand-300/30 focus:border-brand-600 focus:outline-none transition-all"
              aria-label="Cantidad de filas por página"
            >
              {[10, 20, 50, 100].map(n => (
                <option key={n} value={n}>{n} filas</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-lg p-1.5 text-neutral-500 hover:bg-brand-50 hover:text-brand-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-neutral-600 px-2 tabular-nums font-medium">
              {pagination.page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="rounded-lg p-1.5 text-neutral-500 hover:bg-brand-50 hover:text-brand-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
