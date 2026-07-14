import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  SlidersHorizontal,
  Loader2,
  X,
  Home,
} from 'lucide-react';
import { useVentas } from '@/hooks/useVentas';
import { usePosState } from '@/hooks/usePosState';
import type { FiltroVentas, NotaVentaEstado } from '@/types/ventas';

const TODAY = new Date().toISOString().slice(0, 10);

function estadoBadge(rawEstado: string) {
  const estado = (rawEstado ?? '').trim() as NotaVentaEstado;
  if (estado === 'EDITANDO') {
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
        EDITANDO
      </Badge>
    );
  }
  if (estado === 'AFIRME') {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
        AFIRME
      </Badge>
    );
  }
  return null;
}

function formatFecha(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatChipDate(dateStr: string): string {
  if (dateStr === TODAY) return 'Hoy';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function SalesHistoryView() {
  const navigate = useNavigate();
  const { status: posStatus, estado: posEstado, resolveNuevaVentaTarget } = usePosState();
  const [searchCustomer, setSearchCustomer] = useState('');

  // Panel state — edited locally, applied only on "Buscar"
  const [localDate, setLocalDate] = useState(TODAY);
  const [localStatus, setLocalStatus] = useState<NotaVentaEstado | 'all'>('all');

  // Applied state — triggers actual fetches
  const [appliedDate, setAppliedDate] = useState<string | undefined>(TODAY);
  const [appliedStatus, setAppliedStatus] = useState<NotaVentaEstado | 'all'>('all');

  const [showFilters, setShowFilters] = useState(false);
  const [confirmAnularKey, setConfirmAnularKey] = useState<number | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Sort — OPERACIÓN # desc by default
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { ventas, isLoading, isCreating, isAnulando, fetchVentas, crearVenta, anularVenta, resetSync } =
    useVentas();

  const buildFiltro = useCallback((): FiltroVentas => {
    return {
      fechaFiltro: appliedDate,
      estado: appliedStatus === 'all' ? undefined : appliedStatus,
    };
  }, [appliedDate, appliedStatus]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleBuscar = () => {
    resetSync();
    setPage(1);
    setAppliedDate(localDate || undefined);
    setAppliedStatus(localStatus);
  };

  const handleDateChipRemove = () => {
    resetSync();
    setPage(1);
    setAppliedDate(undefined);
    setLocalDate(TODAY);
  };

  const handleClearFilters = () => {
    resetSync();
    setPage(1);
    setLocalDate(TODAY);
    setLocalStatus('all');
    setAppliedDate(TODAY);
    setAppliedStatus('all');
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  // ── Active filter badge (counts applied filters, date chip is separate) ────
  const activeFilterCount = [appliedStatus !== 'all'].filter(Boolean).length;

  // ── Fetch on applied state change ────────────────────────────────────────
  const recargarVentas = useCallback(async () => {
    try {
      await fetchVentas(buildFiltro());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar las ventas');
    }
  }, [fetchVentas, buildFiltro]);

  useEffect(() => {
    void recargarVentas();
  }, [appliedDate, appliedStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset to page 1 when search text changes
  useEffect(() => {
    setPage(1);
  }, [searchCustomer]);

  // ── CRUD handlers ────────────────────────────────────────────────────────

  const handleNuevaVenta = async () => {
    console.log('[handleNuevaVenta] posStatus:', posStatus, '| posEstado:', JSON.stringify(posEstado));
    if (posStatus !== 'ready') {
      toast.error('Estado de caja no disponible todavía');
      return;
    }
    const target = resolveNuevaVentaTarget();
    console.log('[handleNuevaVenta] target resuelto:', target);
    if (target === null) {
      // accionRequerida (p.ej. ABRIR_CAJA) ya está siendo manejada por PosStateGate.
      toast.error(
        posEstado?.accionRequerida === 'ABRIR_CAJA'
          ? 'Debes abrir la caja antes de crear una venta'
          : 'No se puede crear una venta en este momento',
      );
      return;
    }
    if (target === 'customer-selection') {
      navigate('/ventas/nueva/cliente');
      return;
    }
    // target === 'nota-de-venta': flujo directo, sin selección de cliente.
    try {
      const notaVentaKey = await crearVenta(0);
      toast.success(`Venta creada con éxito (Folio: ${notaVentaKey})`);
      navigate(`/ventas/${notaVentaKey}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la venta');
    }
  };

  const handleConfirmAnular = async () => {
    if (confirmAnularKey === null) return;
    const key = confirmAnularKey;
    setConfirmAnularKey(null);
    try {
      await anularVenta(key);
      toast.success('Venta anulada correctamente');
      void recargarVentas();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al anular la venta');
    }
  };

  // ── Client-side search filter + pagination ───────────────────────────────

  const filteredVentas = useMemo(
    () =>
      ventas.filter(
        (v) =>
          searchCustomer === '' ||
          v.clienteNombreCompleto.toLowerCase().includes(searchCustomer.toLowerCase()) ||
          String(v.notaVentaKey).includes(searchCustomer) ||
          (v.notaVentaNumero?.toLowerCase().includes(searchCustomer.toLowerCase()) ?? false),
      ),
    [ventas, searchCustomer],
  );

  const sortedVentas = useMemo(
    () =>
      [...filteredVentas].sort((a, b) =>
        sortOrder === 'desc' ? b.notaVentaKey - a.notaVentaKey : a.notaVentaKey - b.notaVentaKey,
      ),
    [filteredVentas, sortOrder],
  );

  const totalPages = Math.max(1, Math.ceil(sortedVentas.length / pageSize));
  const displayVentas = useMemo(
    () => sortedVentas.slice((page - 1) * pageSize, page * pageSize),
    [sortedVentas, page, pageSize],
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="flex-1 overflow-y-auto">

        {/* PAGE HEADER */}
        <div className="px-6 pt-8 pb-6 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-foreground text-3xl tracking-tight">Ventas</h1>
            <p className="text-muted-foreground text-base">
              Visualiza, edita y administra las transacciones del sistema
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4">

          {/* TOP BAR */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                aria-label="Buscar por cliente o número de operación"
                placeholder="Buscar por cliente o número de operación..."
                value={searchCustomer}
                onChange={(e) => setSearchCustomer(e.target.value)}
                className="pl-10 text-base"
              />
            </div>

            {/* DATE CHIP — visible without opening filters */}
            {appliedDate !== undefined && (
              <div className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md border border-brand-200 bg-brand-50 text-sm text-primary font-medium shrink-0">
                <span>Fecha:{formatChipDate(appliedDate)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 -mr-0.5 hover:bg-transparent hover:text-destructive"
                  onClick={handleDateChipRemove}
                  aria-label="Eliminar filtro de fecha"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              aria-expanded={showFilters}
              aria-controls="filters-panel"
              onClick={() => setShowFilters((o) => !o)}
            >
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
              Filtros
              {activeFilterCount > 0 && (
                <span
                  aria-label={`${activeFilterCount} filtros activos`}
                  className="ml-1 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold w-4 h-4 leading-none"
                >
                  {activeFilterCount}
                </span>
              )}
              {showFilters
                ? <ChevronUp className="w-4 h-4" aria-hidden="true" />
                : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
            </Button>

            <Button
              size="default"
              className="gap-2 shadow-md shadow-primary/20"
              onClick={handleNuevaVenta}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="w-4 h-4" aria-hidden="true" />
              )}
              Nueva Venta
            </Button>
          </div>

          {/* BREADCRUMB */}
          <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Home className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Inicio</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="font-medium text-foreground" aria-current="page">Ventas</span>
          </nav>

          {/* FILTER PANEL */}
          {showFilters && (
            <Card id="filters-panel" role="region" aria-label="Panel de filtros avanzados">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                  <div className="space-y-1.5">
                    <label htmlFor="filter-fecha" className="text-sm font-medium text-foreground">
                      Fecha
                    </label>
                    <Input
                      id="filter-fecha"
                      type="date"
                      value={localDate}
                      max={TODAY}
                      onChange={(e) => setLocalDate(e.target.value)}
                      aria-label="Fecha de filtro"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="filter-estado" className="text-sm font-medium text-foreground">
                      Estado de la Operación
                    </label>
                    <Select
                      value={localStatus}
                      onValueChange={(v) => setLocalStatus(v as NotaVentaEstado | 'all')}
                    >
                      <SelectTrigger id="filter-estado" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="EDITANDO">EDITANDO</SelectItem>
                        <SelectItem value="AFIRME">AFIRME</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    disabled={isLoading}
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                    Limpiar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBuscar}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" aria-hidden="true" />
                        Buscar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* DATA TABLE */}
          <Card>
            <CardContent className="p-0">
              <Table containerClassName="overflow-auto max-h-[calc(100vh-22rem)]">
                <TableHeader className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
                  <TableRow>
                    <TableHead
                      className="font-semibold text-foreground px-4 cursor-pointer select-none hover:text-primary transition-colors"
                      onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
                      aria-sort={sortOrder === 'desc' ? 'descending' : 'ascending'}
                    >
                      <div className="flex items-center gap-1">
                        OPERACIÓN #
                        {sortOrder === 'desc'
                          ? <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                          : <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />}
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-foreground px-4">FECHA</TableHead>
                    <TableHead className="font-semibold text-foreground px-4">NOMBRE COMPLETO</TableHead>
                    <TableHead className="font-semibold text-foreground px-4">ESTADO</TableHead>
                    <TableHead className="font-semibold text-foreground px-4">FOLIO</TableHead>
                    <TableHead className="font-semibold text-foreground px-4">GLOSA</TableHead>
                    <TableHead className="font-semibold text-foreground px-4 text-center">ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                          <span className="text-base">Cargando ventas...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : displayVentas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-base">
                        No hay ventas registradas para los filtros seleccionados
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayVentas.map((venta) => (
                      <TableRow key={venta.notaVentaKey}>
                        <TableCell className="px-4 font-mono text-sm text-foreground">
                          {venta.notaVentaKey}
                        </TableCell>
                        <TableCell className="px-4 text-sm text-foreground whitespace-nowrap">
                          {formatFecha(venta.notaVentaFecha)}
                        </TableCell>
                        <TableCell className="px-4 text-sm text-foreground">
                          {venta.clienteNombreCompleto}
                        </TableCell>
                        <TableCell className="px-4">
                          {estadoBadge(venta.notaVentaEstado)}
                        </TableCell>
                        <TableCell className="px-4 font-mono text-sm text-foreground">
                          {venta.notaVentaFolioTri ?? '—'}
                        </TableCell>
                        <TableCell className="px-4 text-sm text-foreground">
                          {venta.notaVentaGlosa ?? '—'}
                        </TableCell>
                        <TableCell className="px-4">
                          <div className="flex items-center justify-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-primary hover:bg-brand-50 hover:text-primary"
                                  aria-label={`Continuar venta ${venta.notaVentaNumero}`}
                                  onClick={() => navigate(`/ventas/${venta.notaVentaKey}`)}
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Continuar Venta</p>
                              </TooltipContent>
                            </Tooltip>

                            {venta.notaVentaEstado !== 'AFIRME' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setConfirmAnularKey(venta.notaVentaKey)}
                                    disabled={isAnulando}
                                    className="text-muted-foreground hover:text-destructive hover:bg-danger-100"
                                    aria-label={`Anular venta ${venta.notaVentaNumero}`}
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Anular Venta</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>

            {/* PAGINATION */}
            {!isLoading && sortedVentas.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const start = (page - 1) * pageSize + 1;
                    const end = Math.min(page * pageSize, sortedVentas.length);
                    return `Mostrando ${start}–${end} de ${sortedVentas.length} ventas`;
                  })()}
                </p>
                <div className="flex items-center gap-2">
                  <Select
                    value={String(pageSize)}
                    onValueChange={(v) => handlePageSizeChange(Number(v))}
                  >
                    <SelectTrigger className="w-[100px] h-8 text-xs" aria-label="Ventas por página">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[20, 50, 100].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} / pág.
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    Anterior
                  </Button>
                  <span className="text-sm font-medium text-foreground tabular-nums">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    aria-label="Página siguiente"
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            )}
          </Card>

        </div>
      </div>

      {/* CONFIRMACIÓN ANULACIÓN */}
      <AlertDialog
        open={confirmAnularKey !== null}
        onOpenChange={(open) => { if (!open) setConfirmAnularKey(null); }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular esta venta?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea anular esta nota de venta? Esta acción validará el estado del documento tributario y es irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAnulando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmAnular}
              disabled={isAnulando}
            >
              {isAnulando && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Anular Venta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </TooltipProvider>
  );
}
