import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart,
  RefreshCw,
  Search,
  List,
  Filter,
  Banknote,
  CreditCard,
  Printer,
  ClipboardList,
  User,
  UserCheck,
  FileText,
  Truck,
  PackagePlus,
  Link2,
  AlertCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getCategoriasMenu, getCartaTouch } from '@/services/apiClient';
import type { GetCategoriasMenuPaginadoOutput, GetCartaTouchOutput } from '@/types/ventas';
import { CategoriaCard } from '@/components/pos/CategoriaCard';
import { ProductoCard } from '@/components/pos/ProductoCard';

// ---------------------------------------------------------------------------
// Kbd badge — fondo claro
// ---------------------------------------------------------------------------
function KbdKey({ label }: { label: string }) {
  return (
    <span className="ml-1.5 inline-flex items-center px-1 py-px rounded text-[10px] font-bold font-mono tracking-wider leading-none select-none bg-brand-50 border border-brand-200 text-primary shadow-[inset_0_-1.5px_0_0] shadow-border">
      {label}
    </span>
  );
}

function KbdKeyLight({ label }: { label: string }) {
  return (
    <span className="ml-1.5 inline-flex items-center px-1 py-px rounded text-[10px] font-bold font-mono tracking-wider leading-none select-none bg-white/20 border border-white/40 text-white shadow-[inset_0_-1.5px_0_0] shadow-white/20">
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// ActionBtn — variante compacta para grid de acciones
// ---------------------------------------------------------------------------
function ActionBtn({
  icon,
  label,
  kbd,
  primary = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  kbd: string;
  primary?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant={primary ? 'default' : 'outline'}
      className={cn(
        'w-full inline-flex items-center justify-center gap-1.5',
        'min-h-[44px] px-2 rounded-xl text-[0.72rem] font-semibold tracking-wide',
        primary
          ? 'hover:bg-primary/90 shadow-md shadow-primary/25'
          : 'bg-card text-foreground border-border/60 hover:bg-muted hover:border-ring/50 shadow-sm',
      )}
    >
      <span className={cn('flex shrink-0', primary ? 'text-primary-foreground' : 'text-primary')}>
        {icon}
      </span>
      <span className="truncate">{label}</span>
      {primary ? <KbdKeyLight label={kbd} /> : <KbdKey label={kbd} />}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Skeleton grid para el estado de carga de categorías
// ---------------------------------------------------------------------------
function CategoriasSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-11 rounded-lg" />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PantallaVentaView
// ---------------------------------------------------------------------------
interface PantallaVentaViewProps {
  notaVentaKey: number | null;
}

export function PantallaVentaView({ notaVentaKey: _notaVentaKey }: PantallaVentaViewProps) {
  // Tarea 3: nuevo estado para modo catálogo
  const [modoCatalogo, setModoCatalogo] = useState<'filtrar' | 'carta'>('filtrar');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<string | undefined>(undefined);

  // ── Network ───────────────────────────────────────────────────────────────
  const {
    data,
    isLoading: isLoadingCategorias,
    isError: isErrorCategorias,
    error: errorCategorias,
    refetch: refetchCategorias,
  } = useQuery<GetCategoriasMenuPaginadoOutput>({
    queryKey: ['categoriasMenu'] as const,
    queryFn: () => getCategoriasMenu(),
  });

  const {
    data: dataCarta,
    isLoading: isLoadingCarta,
    isError: isErrorCarta,
    error: errorCarta,
    refetch: refetchCarta,
  } = useQuery({
    queryKey: ['cartaTouch', categoriaActiva] as const,
    queryFn: () => getCartaTouch(categoriaActiva),
    enabled: !!categoriaActiva,
  });

  const gruposProductos = dataCarta?.SDTCartaVenta?.CartaGrupos ?? [];
  const categorias = data?.ColClasificadoras ?? [];

  return (
    <div
      className="h-[calc(100vh-4rem)] flex overflow-hidden"
      style={{ background: 'var(--muted)' }}
    >

      {/* ══════════════════════════════════════════════════════════════════
          COLUMNA IZQUIERDA — 60% — Totales + Carrito
          Tarea 1: Totales anclado arriba, tabla absorbe el espacio restante
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex-[60] flex flex-col h-full overflow-hidden min-w-0 border-r border-border/40">

        {/* ── CARD: TOTALES (shrink-0) ──────────────────────────────────── */}
        <div className="shrink-0 p-3 pb-2">
          <div className="bg-card rounded-[14px] border border-border/40 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary to-brand-200" />
            <div className="px-4 py-3.5">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-muted-foreground text-[0.65rem] font-bold uppercase tracking-[0.1em]">
                  Total a Cobrar
                </span>
                <span
                  className="text-foreground font-extrabold leading-none tracking-tight font-mono"
                  style={{ fontSize: '2.6rem' }}
                >
                  $0
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-border/25">
                <div className="bg-muted/60 rounded-lg px-3 py-2 border border-border/25">
                  <p className="text-muted-foreground text-[0.62rem] font-bold uppercase tracking-[0.08em] mb-1">
                    Pagos
                  </p>
                  <p
                    className="text-foreground font-bold leading-none font-mono"
                    style={{ fontSize: '1.4rem' }}
                  >
                    $0
                  </p>
                </div>
                <div className="bg-[hsl(var(--pos-success-bg))] rounded-lg px-3 py-2 border border-[hsl(var(--pos-success-border))]">
                  <p className="text-[hsl(var(--pos-success-text))] text-[0.62rem] font-bold uppercase tracking-[0.08em] mb-1">
                    Vuelto
                  </p>
                  <p
                    className="text-[hsl(var(--pos-success-text))] font-bold leading-none font-mono"
                    style={{ fontSize: '1.4rem' }}
                  >
                    $0
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Encabezado del carrito (shrink-0) ─────────────────────────── */}
        <div className="shrink-0 bg-card border-b border-border/25 border-t border-t-border/15 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingCart size={18} className="text-primary" />
            <span className="text-foreground font-bold text-[0.8rem] tracking-widest uppercase">
              Carro de Compra
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-primary text-[0.7rem] font-bold">
              0 ítems
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            className="inline-flex items-center gap-1.5 min-h-[34px] px-3 rounded-lg border-border/60 bg-transparent text-primary text-[0.75rem] font-medium hover:bg-muted"
          >
            <RefreshCw size={13} />
            Refrescar
          </Button>
        </div>

        {/* ── Tabla del carrito — HTML crudo (excepción rendimiento POS) ── */}
        {/* flex-1 overflow-y-auto: absorbe espacio sobrante, scroll interno */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-card">
          <table className="w-full border-collapse text-[0.82rem]">
            <thead>
              <tr className="bg-primary sticky top-0 z-10">
                {[
                  { label: 'Código',      align: 'left',   w: 80      },
                  { label: 'Descripción', align: 'left',   w: undefined },
                  { label: 'U.M',         align: 'center', w: 52      },
                  { label: 'Cantidad',    align: 'center', w: 120     },
                  { label: 'Precio',      align: 'right',  w: 100     },
                  { label: 'Dcto',        align: 'right',  w: 76      },
                  { label: 'Total',       align: 'right',  w: 104     },
                  { label: '',            align: 'center', w: 72      },
                ].map((col, i) => (
                  <th
                    key={i}
                    style={{ width: col.w, textAlign: col.align as 'left' | 'right' | 'center' }}
                    className="px-2.5 py-2.5 text-[0.68rem] font-bold uppercase tracking-[0.07em] text-primary-foreground whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody />
          </table>

          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center">
              <ShoppingCart size={26} className="text-brand-200" />
            </div>
            <p className="text-muted-foreground font-medium text-[0.9rem]">Carrito vacío</p>
            <p className="text-muted-foreground/70 text-[0.8rem] text-center max-w-[220px]">
              Busca y agrega productos para iniciar la venta
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          COLUMNA DERECHA — 40% — Acciones + Buscador + Catálogo
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex-[40] flex flex-col h-full overflow-hidden min-w-0">

        {/* ── Tarea 2: Acciones consolidadas (shrink-0) ─────────────────── */}
        <div className="shrink-0 bg-card border-b border-border/40 p-3 flex flex-col gap-2">

          {/* Botonera táctil: grid de 3 columnas para los 6 botones */}
          <div className="grid grid-cols-3 gap-1.5">
            <ActionBtn icon={<User size={15} />}        label="CLIENTE"       kbd="F3"  primary />
            <ActionBtn icon={<UserCheck size={15} />}   label="VENDEDOR"      kbd="F8"  />
            <ActionBtn icon={<FileText size={15} />}    label="GLOSA"         kbd="F2"  />
            <ActionBtn icon={<Truck size={15} />}       label="TRANSPORTISTA" kbd="F5"  />
            <ActionBtn icon={<PackagePlus size={15} />} label="PROD. LIBRE"   kbd="F6"  />
            <ActionBtn icon={<Link2 size={15} />}       label="REFERENCIA"    kbd="F10" />
          </div>

          {/* Separador visual */}
          <div className="border-t border-border/30" />

          {/* PAGAR y EMITIR: grid-cols-2, tamaño touch-first */}
          <div className="grid grid-cols-2 gap-2">

            {/* PAGAR */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="default"
                  className="w-full h-14 text-base font-bold tracking-wide rounded-xl shadow-md shadow-primary/25 hover:bg-primary/90 flex items-center justify-center gap-2"
                >
                  <Banknote size={19} />
                  PAGAR
                  <ChevronDown size={15} className="opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Banknote size={15} className="text-[hsl(var(--pos-success-text))]" />
                  Efectivo
                  <KbdKey label="F7" />
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <CreditCard size={15} className="text-primary" />
                  Tarjeta
                  <KbdKey label="F9" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* EMITIR */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-14 text-base font-bold tracking-wide rounded-xl bg-card border-border/60 hover:bg-muted hover:border-ring/50 shadow-sm flex items-center justify-center gap-2"
                >
                  <Printer size={19} className="text-primary" />
                  <span className="text-foreground">EMITIR</span>
                  <ChevronDown size={15} className="text-muted-foreground opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <Printer size={15} className="text-primary" />
                  Emitir Boleta / Factura
                  <KbdKeyLight label="↵" />
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer">
                  <ClipboardList size={15} className="text-primary" />
                  Guía de Despacho
                  <KbdKey label="F11" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>

        {/* ── Tarea 3+4: Buscador + Catálogo (flex-1) ──────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 mx-3 mb-3 mt-2.5 bg-card rounded-[14px] border border-border/40 shadow-sm">

          {/* Barra buscador: Input + Buscar + toggle Filtrar/Carta (shrink-0) */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-border/28">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-border pointer-events-none"
                aria-hidden="true"
              />
              <Input
                type="text"
                placeholder="Código o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar producto por código o descripción"
                className="w-full pl-8 pr-3 h-9 rounded-[9px] border border-border/60 bg-card text-foreground text-[0.82rem] placeholder:text-muted-foreground"
              />
            </div>
            <Button
              type="button"
              variant="default"
              className="shrink-0 flex items-center gap-1.5 h-9 px-3 rounded-[9px] text-[0.78rem] font-semibold hover:bg-primary/90"
            >
              <Search size={13} />
              Buscar
              <KbdKeyLight label="↵" />
            </Button>
            {/* Toggle Filtrar / Carta */}
            <div className="shrink-0 flex rounded-[9px] overflow-hidden border border-border/60">
              <Button
                type="button"
                onClick={() => setModoCatalogo('filtrar')}
                variant={modoCatalogo === 'filtrar' ? 'default' : 'ghost'}
                className={cn(
                  'rounded-none border-r border-border/60 h-9 px-3 text-[0.75rem] font-semibold gap-1.5',
                  modoCatalogo !== 'filtrar' && 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Filter size={12} />
                Filtrar
              </Button>
              <Button
                type="button"
                onClick={() => setModoCatalogo('carta')}
                variant={modoCatalogo === 'carta' ? 'default' : 'ghost'}
                className={cn(
                  'rounded-none h-9 px-3 text-[0.75rem] font-semibold gap-1.5',
                  modoCatalogo !== 'carta' && 'text-muted-foreground hover:text-foreground',
                )}
              >
                <List size={12} />
                Carta
              </Button>
            </div>
          </div>

          {/* ── Tarea 4: Renderizado condicional del catálogo ───────────── */}
          <div className="flex-1 overflow-y-auto min-h-0 p-1">

            {/* MODO: FILTRAR — grilla de categorías + productos */}
            {modoCatalogo === 'filtrar' && (
              <div>
                <div className="px-3.5 py-2 bg-muted/40 border-b border-border/20">
                  <p className="text-foreground text-[0.72rem] font-bold uppercase tracking-[0.05em]">
                    Categorías
                  </p>
                </div>

                {/* Error categorías */}
                {isErrorCategorias && (
                  <div className="m-3 flex items-start gap-3 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30">
                    <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-destructive text-[0.8rem] font-semibold">
                        Error al cargar categorías
                      </p>
                      <p className="text-destructive/80 text-[0.72rem] mt-0.5 break-words">
                        {errorCategorias instanceof Error
                          ? errorCategorias.message
                          : 'No se pudo conectar con el servidor.'}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => void refetchCategorias()}
                        className="mt-2 h-auto px-0 py-0 text-[0.72rem] font-semibold text-destructive hover:text-destructive hover:bg-transparent gap-1.5"
                      >
                        <Loader2 size={12} />
                        Reintentar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Loading categorías */}
                {isLoadingCategorias && <CategoriasSkeleton />}

                {/* Sin categorías */}
                {!isLoadingCategorias && !isErrorCategorias && categorias.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <List size={24} className="text-muted-foreground/40" />
                    <p className="text-muted-foreground text-[0.8rem]">Sin categorías disponibles</p>
                  </div>
                )}

                {/* Grilla de categorías */}
                {!isLoadingCategorias && !isErrorCategorias && categorias.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 p-3">
                    {categorias.map((cat) => (
                      <CategoriaCard
                        key={cat.CatCod}
                        categoria={cat}
                        isActive={categoriaActiva === cat.CatCod}
                        onClick={setCategoriaActiva}
                      />
                    ))}
                  </div>
                )}

                {/* Productos de la categoría seleccionada */}
                {categoriaActiva && (
                  <div className="border-t border-border/20">
                    <div className="px-3.5 py-2 bg-muted/40 border-b border-border/20">
                      <p className="text-foreground text-[0.72rem] font-bold uppercase tracking-[0.05em]">
                        Productos
                      </p>
                    </div>

                    {/* Error carta */}
                    {isErrorCarta && (
                      <div className="m-3 flex items-start gap-3 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30">
                        <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-destructive text-[0.8rem] font-semibold">
                            Error al cargar productos
                          </p>
                          <p className="text-destructive/80 text-[0.72rem] mt-0.5 break-words">
                            {errorCarta instanceof Error
                              ? errorCarta.message
                              : 'No se pudo conectar con el servidor.'}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => void refetchCarta()}
                            className="mt-2 h-auto px-0 py-0 text-[0.72rem] font-semibold text-destructive hover:text-destructive hover:bg-transparent gap-1.5"
                          >
                            <Loader2 size={12} />
                            Reintentar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Loading carta */}
                    {isLoadingCarta && (
                      <div className="flex flex-col gap-1 p-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Skeleton key={i} className="h-[60px] rounded-lg" />
                        ))}
                      </div>
                    )}

                    {/* Sin productos */}
                    {!isLoadingCarta && !isErrorCarta && gruposProductos.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <List size={20} className="text-muted-foreground/40" />
                        <p className="text-muted-foreground text-[0.8rem]">
                          Sin productos en esta categoría
                        </p>
                      </div>
                    )}

                    {!isLoadingCarta && !isErrorCarta && gruposProductos.map((grupo) =>
                      grupo.Productos.map((producto) => (
                        <ProductoCard
                          key={producto.ProductoKey}
                          producto={producto}
                          onAdd={() => {}}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MODO: CARTA — placeholder hasta que la API esté disponible */}
            {modoCatalogo === 'carta' && (
              <div className="flex h-full items-center justify-center text-muted-foreground text-[0.85rem]">
                Vista de Carta Especial (Pendiente de API)
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
