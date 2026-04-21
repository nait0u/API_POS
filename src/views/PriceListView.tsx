import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImportPriceDialog } from '@/components/precios/ImportPriceDialog';
import { CreatePriceDialog } from '@/components/precios/CreatePriceDialog';
import { EditPriceDialog } from '@/components/precios/EditPriceDialog';
import { ExpirePriceAlert } from '@/components/precios/ExpirePriceAlert';
import {
  ImportErrorBandeja,
  type ImportErrorItem,
} from '@/components/precios/ImportErrorBandeja';
import { uploadPreciosNativo, ApiError } from '@/services/apiClient';
import { usePrecios } from '@/hooks/usePrecios';
import type { FiltroPrecios, SDTPrecios } from '@/types/precios';
import {
  Search,
  Upload,
  Plus,
  Edit,
  Ban,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

// ── Formatting helpers ──────────────────────────────────────────────────────

function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '—' : `$${num.toFixed(2)}`;
}

function formatDateTime(isoDateTime: string): string {
  if (!isoDateTime) return '—';
  // "2022-12-11T17:08:42" → "2022-12-11 17:08"
  return isoDateTime.slice(0, 10) + ' ' + isoDateTime.slice(11, 16);
}

// ── Local filter form state ─────────────────────────────────────────────────

interface LocalFilters {
  CodIntValor: string;
  ProductoDescripcion: string;
  FechaFiltro: string;
  Ubicacion: string;
  CategoriaPrecioIdl: string;
  PrecioCantidad: string;
}

function buildLocalFilters(f: FiltroPrecios): LocalFilters {
  return {
    CodIntValor: f.CodIntValor ?? '',
    ProductoDescripcion: f.ProductoDescripcion ?? '',
    FechaFiltro: f.FechaFiltro ?? '',
    Ubicacion: f.Ubicacion ?? '',
    CategoriaPrecioIdl: f.CategoriaPrecioIdl ?? '',
    PrecioCantidad: f.PrecioCantidad !== undefined ? String(f.PrecioCantidad) : '',
  };
}

// ── Component ───────────────────────────────────────────────────────────────

export function PriceListView() {
  const {
    displayItems,
    loading,
    error,
    setSearchText,
    filters,
    setFilters,
    fetchPrecios,
    clearFilters,
    ubicaciones,
    importOpen,
    importFormatOptions,
    importFormatLoading,
    closeImport,
    openImport,
    drawerOpen,
    isNewMode,
    selectedProduct,
    openNew,
    closeDrawer,
    selectProductForNew,
    clearSelectedProduct,
    createNewPrecio,
    openEdit,
    editingPrecio,
    editingBC,
    editLoading,
    saving,
    savePrecio,
    openExpire,
    expireTarget,
    closeExpire,
    confirmExpire,
    pagination,
    totalPages,
    filteredItems,
    setPage,
    setPageSize,
  } = usePrecios();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<LocalFilters>(() =>
    buildLocalFilters(filters)
  );

  // Import error bandeja
  const [importErrors, setImportErrors] = useState<ImportErrorItem[]>([]);
  const [importSaving, setImportSaving] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  // Filter out ubicaciones with empty UbiCod (Radix SelectItem crashes on empty value)
  const validUbicaciones = ubicaciones.filter((u) => u.UbiCod);

  // ── Filter helpers ────────────────────────────────────────────────────────

  const activeFilterCount = [
    localFilters.CodIntValor,
    localFilters.ProductoDescripcion,
    localFilters.Ubicacion,
    localFilters.CategoriaPrecioIdl,
    localFilters.PrecioCantidad,
  ].filter(Boolean).length;

  const handleApplyFilters = () => {
    const newFilters: FiltroPrecios = {
      ...filters,
      CodIntValor: localFilters.CodIntValor,
      ProductoDescripcion: localFilters.ProductoDescripcion,
      FechaFiltro: localFilters.FechaFiltro,
      Ubicacion: localFilters.Ubicacion,
      CategoriaPrecioIdl: localFilters.CategoriaPrecioIdl,
      PrecioCantidad: localFilters.PrecioCantidad
        ? parseFloat(localFilters.PrecioCantidad)
        : undefined,
    };
    setFilters(newFilters);
    fetchPrecios(newFilters);
  };

  const handleClearFilters = () => {
    const reset: LocalFilters = {
      CodIntValor: '',
      ProductoDescripcion: '',
      FechaFiltro: new Date().toISOString().slice(0, 10),
      Ubicacion: '',
      CategoriaPrecioIdl: '',
      PrecioCantidad: '',
    };
    setLocalFilters(reset);
    clearFilters();
  };

  const setField = <K extends keyof LocalFilters>(key: K, value: LocalFilters[K]) =>
    setLocalFilters((prev) => ({ ...prev, [key]: value }));

  // ── Import handler (bypasses hook to capture structured errors) ───────────

  const handleImport = async (format: string, _fileName: string, file: File) => {
    setImportSaving(true);
    try {
      const result = await uploadPreciosNativo(filters.EmpKey, format, file);
      setImportSaving(false);
      const ok = result.Mensaje?.toLowerCase().includes('ok');
      closeImport();
      if (ok) fetchPrecios();
    } catch (err) {
      setImportSaving(false);
      closeImport();
      if (err instanceof ApiError && Array.isArray(err.messages) && err.messages.length > 0) {
        setImportErrors(
          err.messages.map((m: Record<string, string>) => ({
            Id: m.Id || m.Code || 'N/A',
            Description: m.Description || m.Text || String(m),
          }))
        );
      } else {
        // Single-message fallback: show it as one row in the bandeja
        const msg = err instanceof Error ? err.message : 'Error desconocido al importar.';
        setImportErrors([{ Id: 'ERROR', Description: msg }]);
      }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Quick text search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            ref={searchRef}
            type="search"
            className="pl-10 text-base"
            placeholder="Buscar por código o descripción..."
            aria-label="Buscar precios por código o descripción"
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* Filters toggle */}
        <Button
          variant="outline"
          aria-expanded={filtersOpen}
          aria-controls="filter-panel"
          onClick={() => setFiltersOpen((o) => !o)}
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
          {filtersOpen
            ? <ChevronUp className="w-4 h-4" aria-hidden="true" />
            : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
        </Button>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={openImport}>
            <Upload className="w-4 h-4" aria-hidden="true" />
            Importar
          </Button>
          <Button variant="default" onClick={openNew}>
            <Plus className="w-4 h-4" aria-hidden="true" />
            Nuevo Precio
          </Button>
        </div>
      </div>

      {/* ── Filter Panel ─────────────────────────────────────────────────── */}
      {filtersOpen && (
        <Card id="filter-panel" role="region" aria-label="Panel de filtros avanzados">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">

              {/* Código interno */}
              <div className="space-y-1.5">
                <label htmlFor="filter-cod" className="text-sm font-medium text-foreground">
                  Código
                </label>
                <Input
                  id="filter-cod"
                  placeholder="Ej. 00123456"
                  className="font-mono"
                  value={localFilters.CodIntValor}
                  onChange={(e) => setField('CodIntValor', e.target.value)}
                />
              </div>

              {/* Descripción */}
              <div className="space-y-1.5">
                <label htmlFor="filter-desc" className="text-sm font-medium text-foreground">
                  Descripción
                </label>
                <Input
                  id="filter-desc"
                  placeholder="Nombre del producto..."
                  value={localFilters.ProductoDescripcion}
                  onChange={(e) => setField('ProductoDescripcion', e.target.value)}
                />
              </div>

              {/* Fecha de vigencia */}
              <div className="space-y-1.5">
                <label htmlFor="filter-fecha" className="text-sm font-medium text-foreground">
                  Fecha vigencia
                </label>
                <Input
                  id="filter-fecha"
                  type="date"
                  className="font-mono"
                  value={localFilters.FechaFiltro}
                  onChange={(e) => setField('FechaFiltro', e.target.value)}
                />
              </div>

              {/* Ubicación (combobox from API) */}
              <div className="space-y-1.5">
                <label htmlFor="filter-ubicacion" className="text-sm font-medium text-foreground">
                  Ubicación (UbiCod)
                </label>
                <Select
                  value={localFilters.Ubicacion || '__all__'}
                  onValueChange={(v) =>
                    setField('Ubicacion', v === '__all__' ? '' : v)
                  }
                >
                  <SelectTrigger id="filter-ubicacion" className="w-full">
                    <SelectValue placeholder="Todas las ubicaciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas las ubicaciones</SelectItem>
                    {validUbicaciones.map((u) => (
                      <SelectItem key={u.UbiCod} value={u.UbiCod}>
                        {u.UbiNom} ({u.UbiCod})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Categoría precio */}
              <div className="space-y-1.5">
                <label htmlFor="filter-categoria" className="text-sm font-medium text-foreground">
                  Categoría precio
                </label>
                <Input
                  id="filter-categoria"
                  placeholder="Ej. LISTA01"
                  className="font-mono"
                  value={localFilters.CategoriaPrecioIdl}
                  onChange={(e) => setField('CategoriaPrecioIdl', e.target.value)}
                />
              </div>

              {/* Cantidad */}
              <div className="space-y-1.5">
                <label htmlFor="filter-cantidad" className="text-sm font-medium text-foreground">
                  Cantidad
                </label>
                <Input
                  id="filter-cantidad"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Ej. 1"
                  className="font-mono"
                  value={localFilters.PrecioCantidad}
                  onChange={(e) => setField('PrecioCantidad', e.target.value)}
                />
              </div>
            </div>

            {/* Filter actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                disabled={loading}
              >
                <X className="w-4 h-4" aria-hidden="true" />
                Limpiar
              </Button>
              <Button
                size="sm"
                onClick={handleApplyFilters}
                disabled={loading}
              >
                {loading ? (
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

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="px-4 py-3 bg-danger-50 border border-destructive rounded-lg">
          <p className="text-destructive font-medium text-base">{error}</p>
        </div>
      )}

      {/* ── Main Table ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle className="text-foreground font-semibold text-lg">
            Lista de Precios
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-foreground px-4">CÓDIGO</TableHead>
                <TableHead className="font-semibold text-foreground px-4">DESCRIPCIÓN</TableHead>
                <TableHead className="font-semibold text-foreground px-4">INICIO</TableHead>
                <TableHead className="font-semibold text-foreground px-4">FIN</TableHead>
                <TableHead className="font-semibold text-foreground px-4">HORA INICIO</TableHead>
                <TableHead className="font-semibold text-foreground px-4">HORA FIN</TableHead>
                <TableHead className="font-semibold text-foreground px-4">UBICACIÓN</TableHead>
                <TableHead className="font-semibold text-foreground px-4">CATEGORÍA</TableHead>
                <TableHead className="font-semibold text-foreground px-4 text-right">CANT.</TableHead>
                <TableHead className="font-semibold text-foreground px-4 text-right">PRECIO</TableHead>
                <TableHead className="font-semibold text-foreground px-4 text-right">DESCUENTO</TableHead>
                <TableHead className="font-semibold text-foreground px-4 text-right">DESC. MÁX.</TableHead>
                <TableHead className="font-semibold text-foreground px-4 text-center">ACCIONES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={13} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                      <span className="text-base">Cargando precios...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : displayItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={13}
                    className="h-32 text-center text-muted-foreground text-base"
                  >
                    No se encontraron precios.
                  </TableCell>
                </TableRow>
              ) : (
                displayItems.map((item: SDTPrecios) => (
                  <TableRow
                    key={`${item.Empkey}-${item.ProductoKey}-${item.PrecioTimeInicio}-${item.PrecioUbiCod}-${item.CategoriaPrecioIdl}-${item.PrecioCantidad}`}
                  >
                    <TableCell className="px-4 font-mono text-sm text-foreground">
                      {item.CodIntValor}
                    </TableCell>
                    <TableCell className="px-4 text-sm text-foreground max-w-xs truncate">
                      {item.ProductoDescripcion}
                    </TableCell>
                    <TableCell className="px-4 font-mono text-sm text-foreground whitespace-nowrap">
                      {formatDateTime(item.PrecioTimeInicio)}
                    </TableCell>
                    <TableCell className="px-4 font-mono text-sm text-foreground whitespace-nowrap">
                      {formatDateTime(item.PrecioTimeFin)}
                    </TableCell>
                    <TableCell className="px-4 font-mono text-sm text-foreground">
                      {item.PrecioHoraInicio}
                    </TableCell>
                    <TableCell className="px-4 font-mono text-sm text-foreground">
                      {item.PrecioHoraFin}
                    </TableCell>
                    <TableCell className="px-4 text-sm text-foreground">
                      {item.PrecioUbiCod || '—'}
                    </TableCell>
                    <TableCell className="px-4 text-sm text-foreground">
                      {item.CategoriaPrecioIdl || '—'}
                    </TableCell>
                    <TableCell className="px-4 font-mono text-sm text-foreground text-right">
                      {item.PrecioCantidad}
                    </TableCell>
                    <TableCell className="px-4 font-mono text-sm text-foreground text-right font-medium">
                      {formatCurrency(item.PrecioItem)}
                    </TableCell>
                    <TableCell className="px-4 font-mono text-sm text-foreground text-right">
                      {item.PrecioDescuentoPorcentaje}
                    </TableCell>
                    <TableCell className="px-4 font-mono text-sm text-foreground text-right">
                      {item.PrecioDescuentoMax}
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar precio de ${item.ProductoDescripcion}`}
                          className="hover:text-primary transition-colors"
                          onClick={() => openEdit(item)}
                        >
                          <Edit className="w-4 h-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Caducar precio de ${item.ProductoDescripcion}`}
                          className="hover:text-destructive transition-colors"
                          onClick={() => openExpire(item)}
                        >
                          <Ban className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* ── Pagination ───────────────────────────────────────────────── */}
        {!loading && filteredItems.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {(() => {
                const start = (pagination.page - 1) * pagination.pageSize + 1;
                const end = Math.min(pagination.page * pagination.pageSize, filteredItems.length);
                return `Mostrando ${start}–${end} de ${filteredItems.length} precios`;
              })()}
            </p>
            <div className="flex items-center gap-2">
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(v) => setPageSize(Number(v))}
              >
                <SelectTrigger className="w-[100px] h-8 text-xs" aria-label="Precios por página">
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
                disabled={pagination.page <= 1}
                onClick={() => setPage(pagination.page - 1)}
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                Anterior
              </Button>
              <span className="text-sm font-medium text-foreground tabular-nums">
                {pagination.page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= totalPages}
                onClick={() => setPage(pagination.page + 1)}
                aria-label="Página siguiente"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <ImportPriceDialog
        open={importOpen}
        onClose={closeImport}
        formatOptions={importFormatOptions}
        formatLoading={importFormatLoading}
        saving={importSaving}
        onImport={handleImport}
      />

      <CreatePriceDialog
        open={drawerOpen && isNewMode}
        onClose={closeDrawer}
        empKey={filters.EmpKey}
        ubicaciones={validUbicaciones}
        selectedProduct={selectedProduct}
        saving={false}
        onSelectProduct={selectProductForNew}
        onClearProduct={clearSelectedProduct}
        onCreatePrecio={createNewPrecio}
      />

      <EditPriceDialog
        open={drawerOpen && !isNewMode && editingPrecio !== null}
        item={editingPrecio}
        precioChar={editingBC}
        loading={editLoading}
        saving={saving}
        onSave={savePrecio}
        onClose={closeDrawer}
      />

      <ExpirePriceAlert
        open={expireTarget !== null}
        item={expireTarget}
        saving={saving}
        onConfirm={confirmExpire}
        onClose={closeExpire}
      />

      <ImportErrorBandeja
        open={importErrors.length > 0}
        errors={importErrors}
        onClose={() => setImportErrors([])}
      />
    </div>
  );
}
