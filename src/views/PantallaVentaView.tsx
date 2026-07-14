import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  FileText,
  Truck,
  AlertCircle,
  Loader2,
  ChevronDown,
  X,
  ArrowLeftRight,
  FileCheck,
  Handshake,
  Wallet,
  Receipt,
  Ticket,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getPantallaVentaInit, getPantallaVentaTotales, getPantallaVentaCarrito, getVentas, getFiltroCategoriasVenta, getSelectorGeneral, interpretPosError } from '@/services/apiClient';
import { PosStateContext } from '@/context/PosStateContext';
import { toast } from 'sonner';
import type { GxFiltroCategoriaProductoItem, GxSelectorProductoGeneralItem, GxProductoTouch } from '@/types/ventas';
import type { LoteRequeridoErrorBody } from '@/types/carrito';
import { CategoriaCard } from '@/components/pos/CategoriaCard';
import { ProductoCard } from '@/components/pos/ProductoCard';
import { PosBanner } from '@/components/pos/PosBanner';
import { LoteSelectorDialog } from '@/components/pos/LoteSelectorDialog';
import { ClienteXVentaDialog } from '@/components/pos/ClienteXVentaDialog';
import { GlosaCabeceraDialog } from '@/components/pos/GlosaCabeceraDialog';
import { TransportistaDialog } from '@/components/pos/TransportistaDialog';
import { DescuentoGlobalDialog } from '@/components/pos/DescuentoGlobalDialog';
import { VendedorDialog } from '@/components/pos/VendedorDialog';
import { ProductoResultadosTable } from '@/components/pos/ProductoResultadosTable';
import { ProductoDetalleDialog } from '@/components/pos/ProductoDetalleDialog';
import { useCarrito } from '@/hooks/useCarrito';
import { useProductosOmnibox } from '@/hooks/useProductosOmnibox';
import { useHotkeys, type HotkeyMap } from '@/hooks/useHotkeys';
import { NumericDisplay } from '@/components/ui/NumericDisplay';
import { useShallow } from 'zustand/react/shallow';
import { usePosCatalogStore } from '@/store/posCatalogStore';
import {
  usePosVentaStore,
  selectPermiteAgregarReferencia,
  selectMuestraDescuentoGlobal,
  selectMuestraTotalBruto,
  selectMuestraTotalPagos,
  selectMuestraCatBuscadora,
  selectEditaGlosa,
  selectVendedorEditable,
  selectUsaProductoLibre,
  selectPermiteDatosTransportista,
  selectUsaLectorQR,
  selectRecibePagos,
  selectMostrarBtnPagos,
  selectMetodosDePago,
  selectEmisionConfig,
} from '@/store/posVentaStore';

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

// GxFiltroCategoriaProductoItem.precioItem llega numérico (a diferencia de
// precioPicture/productoPrecios, que GeneXus ya formatea) — se formatea aquí
// una sola vez para alimentar la grilla unificada de resultados.
const precioItemFormatter = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2 });
function formatPrecioItem(value: number): string {
  return `$${precioItemFormatter.format(value)}`;
}

// ---------------------------------------------------------------------------
// ActionBtn — variante compacta para grid de acciones (sin ícono, alta
// densidad). El hotkey siempre queda anclado a la derecha del label.
// ---------------------------------------------------------------------------
function ActionBtn({
  label,
  kbd,
  primary = false,
  onClick,
}: {
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
        'w-full inline-flex items-center justify-between gap-1.5',
        'min-h-[36px] h-auto px-2.5 py-1.5 rounded-lg text-[0.68rem] font-semibold leading-tight',
        primary
          ? 'hover:bg-primary/90 shadow-md shadow-primary/25'
          : 'bg-card text-foreground border-border/60 hover:bg-muted hover:border-ring/50 shadow-sm',
      )}
    >
      <span className="flex-1 min-w-0 text-left whitespace-normal break-words">{label}</span>
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
// PagarSection — botones directos EFECTIVO/TARJETA + dropdown PAGOS
// ---------------------------------------------------------------------------
function PagarSection({ pagarActivo }: { pagarActivo: boolean }) {
  const metodosDePago = usePosVentaStore(selectMetodosDePago);

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Métodos de pago">
      <Button
        type="button"
        variant="default"
        disabled={!pagarActivo || !metodosDePago?.efectivoOk}
        aria-disabled={!pagarActivo || !metodosDePago?.efectivoOk}
        className="flex-1 min-w-[110px] h-12 text-[0.72rem] font-bold tracking-wide rounded-xl shadow-md shadow-primary/25 hover:bg-primary/90 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        <Banknote size={16} />
        EFECTIVO
        <KbdKeyLight label="F7" />
      </Button>
      <Button
        type="button"
        variant="default"
        disabled={!pagarActivo || !metodosDePago?.tarjetaOk}
        aria-disabled={!pagarActivo || !metodosDePago?.tarjetaOk}
        className="flex-1 min-w-[110px] h-12 text-[0.72rem] font-bold tracking-wide rounded-xl shadow-md shadow-primary/25 hover:bg-primary/90 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        <CreditCard size={16} />
        T. DÉBITO
        <KbdKeyLight label="F9" />
      </Button>
      <Button
        type="button"
        variant="default"
        disabled={!pagarActivo || !metodosDePago?.creditoOk}
        aria-disabled={!pagarActivo || !metodosDePago?.creditoOk}
        className="flex-1 min-w-[110px] h-12 text-[0.72rem] font-bold tracking-wide rounded-xl shadow-md shadow-primary/25 hover:bg-primary/90 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        <CreditCard size={16} />
        T. CRÉDITO
        <KbdKeyLight label="F11" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={!pagarActivo}
            aria-disabled={!pagarActivo}
            aria-haspopup="menu"
            className="flex-1 min-w-[110px] h-12 text-[0.72rem] font-bold tracking-wide rounded-xl bg-card border-border/60 hover:bg-muted hover:border-ring/50 shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Wallet size={15} className="text-primary" />
            <span className="text-foreground">PAGOS</span>
            <ChevronDown size={13} className="text-muted-foreground opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem disabled={!metodosDePago?.transferenciaOk} className="gap-2 cursor-pointer">
            <ArrowLeftRight size={15} className="text-primary" />
            Transferencia
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!metodosDePago?.chequeOk} className="gap-2 cursor-pointer">
            <FileCheck size={15} className="text-primary" />
            Cheque
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!metodosDePago?.convenioOk} className="gap-2 cursor-pointer">
            <Handshake size={15} className="text-primary" />
            Convenio
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EmitirSection — botones directos FACTURA/BOLETA + dropdown EMITIR
//
// Cuando permiteEditarTipoDocTri es false muestra solo el documento por
// defecto como botón deshabilitado. Cuando es true expone los documentos
// prioritarios (factura, boleta) como acciones directas y los restantes
// (guiaVenta, guiaTraslado, ticketNoTri) dentro del dropdown EMITIR.
// ---------------------------------------------------------------------------
function EmitirSection() {
  const {
    permiteEditarTipoDocTri,
    tipoDocumentoDefecto,
    guiaVenta,
    factura,
    boleta,
    guiaTraslado,
    ticketNoTri,
  } = usePosVentaStore(useShallow(selectEmisionConfig));

  if (!permiteEditarTipoDocTri) {
    return (
      <Button
        type="button"
        variant="outline"
        disabled
        aria-disabled
        className="w-full h-12 text-[0.74rem] font-bold tracking-wide rounded-xl bg-card border-border/60 shadow-sm flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
      >
        <Printer size={16} className="text-primary" />
        <span className="text-foreground truncate">{tipoDocumentoDefecto || 'EMITIR'}</span>
      </Button>
    );
  }

  const hasOtros = guiaVenta || guiaTraslado || ticketNoTri;
  const hasAny = factura || boleta || hasOtros;

  if (!hasAny) {
    return (
      <Button
        type="button"
        variant="outline"
        disabled
        className="w-full h-12 text-[0.74rem] font-bold tracking-wide rounded-xl bg-card border-border/60 shadow-sm flex items-center justify-center gap-2 opacity-60"
      >
        <Printer size={16} className="text-primary" />
        <span className="text-foreground">EMITIR</span>
      </Button>
    );
  }

  return (
    <div className="flex gap-2" role="group" aria-label="Tipos de documento">
      {factura && (
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12 text-[0.71rem] font-bold tracking-wide rounded-xl bg-card border-border/60 hover:bg-muted hover:border-ring/50 shadow-sm flex items-center justify-center gap-1.5 min-w-0"
        >
          <FileText size={15} className="text-primary shrink-0" />
          <span className="truncate">EMITIR FACTURA</span>
        </Button>
      )}
      {boleta && (
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12 text-[0.71rem] font-bold tracking-wide rounded-xl bg-card border-border/60 hover:bg-muted hover:border-ring/50 shadow-sm flex items-center justify-center gap-1.5 min-w-0"
        >
          <Receipt size={15} className="text-primary shrink-0" />
          <span className="truncate">EMITIR BOLETA</span>
          <KbdKey label="↵" />
        </Button>
      )}
      {hasOtros && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              aria-haspopup="menu"
              className="flex-1 h-12 text-[0.74rem] font-bold tracking-wide rounded-xl bg-card border-border/60 hover:bg-muted hover:border-ring/50 shadow-sm flex items-center justify-center gap-1.5"
            >
              <Printer size={15} className="text-primary" />
              <span className="text-foreground">EMITIR</span>
              <ChevronDown size={13} className="text-muted-foreground opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {guiaVenta && (
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <ClipboardList size={15} className="text-primary" />
                Emitir Guía Venta
              </DropdownMenuItem>
            )}
            {guiaTraslado && (
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <Truck size={15} className="text-primary" />
                Emitir Guía Traslado
              </DropdownMenuItem>
            )}
            {ticketNoTri && (
              <DropdownMenuItem className="gap-2 cursor-pointer">
                <Ticket size={15} className="text-primary" />
                Emitir Ticket
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PantallaVentaView
// ---------------------------------------------------------------------------
export function PantallaVentaView() {
  const { notaVentaKey: notaVentaKeyParam } = useParams<{ notaVentaKey: string }>();
  const navigate = useNavigate();
  const keyAsNumber = Number(notaVentaKeyParam);

  const posState = useContext(PosStateContext);

  const [isLoadingPOS, setIsLoadingPOS] = useState(true);
  const [errorPOS, setErrorPOS] = useState<string | null>(null);

  // ── Store: acciones ───────────────────────────────────────────────────────
  const storeSetInitData = usePosVentaStore((s) => s.setInitData);
  const storeSetTotalesData = usePosVentaStore((s) => s.setTotalesData);
  const storeSetVentaFecha = usePosVentaStore((s) => s.setVentaFecha);
  const storeSetVentaGlosa = usePosVentaStore((s) => s.setVentaGlosa);
  const storeMergeCarrito = usePosVentaStore((s) => s.mergeCarrito);
  const storeResetVenta = usePosVentaStore((s) => s.resetVenta);
  const storePatchActores = usePosVentaStore((s) => s.patchActores);

  // ── Store: datos derivados (fine-grained selectors) ───────────────────────
  const ventaGlosa = usePosVentaStore((s) => s.ventaGlosa);
  const montos = usePosVentaStore((s) => s.totalesData?.montos);
  const flags = usePosVentaStore((s) => s.totalesData?.flags);
  const items = usePosVentaStore((s) => s.carrito);
  // El descuento global debe listarse al final del carrito, no en su posición
  // de línea original (backend la intercala según cuándo se aplicó).
  const itemsOrdenados = useMemo(
    () => [...items].sort((a, b) => Number(a.esDescuentoOk) - Number(b.esDescuentoOk)),
    [items],
  );
  const actores = usePosVentaStore((s) => s.initData?.actores);
  const exigeVendedorOk = usePosVentaStore((s) => s.initData?.reglaDeNegocio.exigeVendedorOk ?? false);

  // UIFlags — un selector por flag para evitar re-renders en cadena
  const permiteAgregarReferencia = usePosVentaStore(selectPermiteAgregarReferencia);
  const muestraDescuento = usePosVentaStore(selectMuestraDescuentoGlobal);
  const muestraTotalBruto = usePosVentaStore(selectMuestraTotalBruto);
  const muestraTotalPagos = usePosVentaStore(selectMuestraTotalPagos);
  const muestraCatBuscadora = usePosVentaStore(selectMuestraCatBuscadora);
  const editaGlosa = usePosVentaStore(selectEditaGlosa);
  const vendedorEditable = usePosVentaStore(selectVendedorEditable);
  const usaProductoLibre = usePosVentaStore(selectUsaProductoLibre);
  const permiteDatosTransportista = usePosVentaStore(selectPermiteDatosTransportista);
  const usaLectorQR = usePosVentaStore(selectUsaLectorQR);
  const recibePagos = usePosVentaStore(selectRecibePagos);
  //const mostrarBtnPagos = usePosVentaStore(selectMostrarBtnPagos);

  // PAGAR activo solo si el BFF lo permite, el usuario tiene permiso y hay ítems
  const pagarActivo =  recibePagos && items.length > 0;

  // ── Vista activa del panel inferior — controlador único y mutuamente
  // excluyente (Etapa 12): 'empty' (placeholder), 'search' (grilla unificada
  // de resultados, alimentada por el buscador general o por el filtro de
  // categorías), 'carta' o 'filter' (acordeón de categorías). Solo una de
  // estas se monta en el DOM a la vez — nunca coexisten.
  type ActiveView = 'empty' | 'search' | 'carta' | 'filter';
  const [activeView, setActiveView] = useState<ActiveView>('filter');
  // Origen de los resultados mostrados en la vista 'search': el buscador
  // general (selector-general) o el acordeón de filtro por categorías.
  const [searchSource, setSearchSource] = useState<'general' | 'filtro'>('general');
  const [searchTerm, setSearchTerm] = useState('');

  // ── Zustand: store del catálogo POS ──────────────────────────────────────
  const {
    colBuscadoras,
    colClasificadoras: categorias,
    isLoadingCategorias,
    errorCategorias,
    filtrosBuscadoras,
    categoriaActiva,
    gruposPorCategoria,
    isLoadingCarta,
    errorCarta,
    fetchCategorias,
    forceFetchCategorias,
    fetchCarta,
    setCategoriaActiva,
    setFiltroBuscadora,
    resetFiltros,
  } = usePosCatalogStore();

  useEffect(() => {
    if (!keyAsNumber || isNaN(keyAsNumber)) {
      setErrorPOS('Folio de venta inválido');
      setIsLoadingPOS(false);
      return;
    }

    // Esperar que GET /ventas/estado-caja complete antes de continuar
    if (!posState || posState.status === 'loading') {
      setIsLoadingPOS(true);
      return;
    }
    if (posState.status === 'error') {
      setErrorPOS('No se pudo obtener el estado de caja.');
      setIsLoadingPOS(false);
      return;
    }

    async function loadPOS() {
      setIsLoadingPOS(true);
      setErrorPOS(null);
      storeResetVenta();
      try {
        // Paso 2 — POST /ventas/lista con x-pos-turno-caja-key ya inyectado en headers
        const ventasData = await getVentas();
        const ventaActual = ventasData.ventas.find((v) => v.notaVentaKey === keyAsNumber);
        if (ventaActual) {
          storeSetVentaFecha(ventaActual.notaVentaFecha);
          storeSetVentaGlosa(ventaActual.notaVentaGlosa ?? '');
        }

        // Datos específicos de la nota de venta (paralelos entre sí)
        const [initRes, totalesRes, carritoRes] = await Promise.all([
          getPantallaVentaInit(keyAsNumber, 'NotaVenta'),
          getPantallaVentaTotales(keyAsNumber),
          getPantallaVentaCarrito(keyAsNumber),
        ]);
        storeSetInitData(initRes);
        storeSetTotalesData(totalesRes);
        storeMergeCarrito(carritoRes);

        // Vista inicial resuelta una sola vez con auth headers ya disponibles.
        // UIFlags.VistaInicial === 'FiltroProducto' (legacy GeneXus) manda a
        // 'empty': ni el acordeón de categorías ni la carta se montan hasta
        // que el usuario elige explícitamente "Filtrar", "Carta" o busca.
        if (initRes?.uiFlags?.vistaInicial === 'FiltroProducto') {
          setActiveView('empty');
        } else {
          setActiveView(initRes?.uiFlags?.muestraCatBuscadoraOk ? 'filter' : 'carta');
        }
        await Promise.all([fetchCategorias(), fetchCarta()]);

        const estadoVenta = initRes?.estado?.notaVentaEstado;
        if (estadoVenta === 'AFIRME') {
          toast.info('Esta venta está cerrada (AFIRME) y es de solo lectura.');
        }
      } catch (err) {
        console.error('Error cargando el POS:', err);
        setErrorPOS('Ocurrió un error al cargar los datos de la venta.');
      } finally {
        setIsLoadingPOS(false);
      }
    }

    void loadPOS();
    // posState.status captura cambios de perfil: al cambiar perfil, PosStateContext
    // vuelve a 'loading' → 'ready' con nuevo turnoCajaKey, re-disparando este efecto.
  }, [keyAsNumber, posState?.status, storeResetVenta, storeSetInitData, storeSetTotalesData, storeSetVentaFecha, storeSetVentaGlosa, storeMergeCarrito, fetchCategorias, fetchCarta]);

  // Carga carta al seleccionar categoría en modo filtrar (acción explícita del usuario)
  useEffect(() => {
    if (categoriaActiva) void fetchCarta(categoriaActiva);
  }, [categoriaActiva, fetchCarta]);

  const gruposProductos = (categoriaActiva ? gruposPorCategoria[categoriaActiva] : undefined) ?? [];
  const gruposCarta = gruposPorCategoria['__full__'] ?? [];

  // ── Estado del filtro-categorias ──────────────────────────────────────────
  const [filtrosOpen, setFiltrosOpen] = useState(true);
  const [resultadosFiltro, setResultadosFiltro] = useState<GxFiltroCategoriaProductoItem[]>([]);
  const [isLoadingFiltro, setIsLoadingFiltro] = useState(false);
  const [errorFiltro, setErrorFiltro] = useState<string | null>(null);

  const handleBuscarFiltro = useCallback(async () => {
    const entries = colBuscadoras
      .filter((b) => filtrosBuscadoras[b.CatCod]?.trim())
      .map((b) => filtrosBuscadoras[b.CatCod].trim());
    if (!entries.length) return;
    // Etapa 12.1: transiciona a 'search' de inmediato — desmonta el acordeón
    // y muestra los resultados en la grilla unificada.
    setSearchSource('filtro');
    setActiveView('search');
    setIsLoadingFiltro(true);
    setErrorFiltro(null);
    try {
      const res = await getFiltroCategoriasVenta({ colCatBuscadoras: entries });
      setResultadosFiltro(res.productos ?? []);
    } catch (err) {
      setErrorFiltro(err instanceof Error ? err.message : 'Error al buscar productos');
    } finally {
      setIsLoadingFiltro(false);
    }
  }, [colBuscadoras, filtrosBuscadoras]);

  // ── Búsqueda general: GET /ventas/pantalla/selector-general ──────────────
  // El usuario escribe texto o código parcial en el buscador principal → lista
  // de resultados. Al hacer clic en un resultado, el productoKey ya está
  // resuelto: se agrega directo al carrito (POST /carrito/producto), sin pasar
  // por omnibox/resolver ni por el flujo de escaneo (agregarProductoPorOmnibox
  // queda reservado para el popup del botón ESCÁNER, aún no implementado).
  const { agregarProducto } = useCarrito();
  const { getLotes } = useProductosOmnibox();
  const [resultadosBusqueda, setResultadosBusqueda] = useState<GxSelectorProductoGeneralItem[]>([]);
  const [isLoadingBusqueda, setIsLoadingBusqueda] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [loteModal, setLoteModal] = useState<{
    productoKey: number;
    lotes: LoteRequeridoErrorBody['lotes'];
    cantidadOriginal: string;
  } | null>(null);
  const [isSubmittingLote, setIsSubmittingLote] = useState(false);

  // Núcleo compartido para agregar un producto al carrito — usado tanto por
  // los resultados del buscador general como por las filas de la Carta
  // (Etapa 8). Ambos DTOs (GxSelectorProductoGeneralItem, GxProductoTouch)
  // comparten los campos productoKey/productoVendeLote/productoDescripcion.
  const agregarProductoAlCarrito = useCallback(
    async (item: { productoKey: number; productoVendeLote: boolean; productoDescripcion: string }) => {
      // Sin input dedicado de cantidad en esta pasada — se reenvía esta misma
      // variable (no un nuevo default) si el producto exige selección de lote.
      const cantidadOriginal = '1';
      try {
        if (item.productoVendeLote) {
          const lotes = await getLotes(item.productoKey);
          setLoteModal({ productoKey: item.productoKey, lotes, cantidadOriginal });
          return;
        }
        await agregarProducto({
          notaVentaKey: keyAsNumber,
          accion: 'Agregar',
          productoKey: item.productoKey,
          cantidad: cantidadOriginal,
        });
        toast.success(`${item.productoDescripcion} agregado`);
      } catch (err) {
        // Defensivo: si a pesar del flag productoVendeLote GeneXus rechaza por
        // lote obligatorio (condición de carrera), igual mostramos el selector.
        const info = interpretPosError(err);
        if (info.kind === 'lote-requerido') {
          const body = info.body as LoteRequeridoErrorBody;
          setLoteModal({ productoKey: body.productoKey, lotes: body.lotes, cantidadOriginal });
        } else {
          toast.error(info.message || 'Error al agregar el producto');
        }
      }
    },
    [keyAsNumber, agregarProducto, getLotes],
  );

  const handleAgregarResultadoBusqueda = useCallback(
    async (item: GxSelectorProductoGeneralItem) => {
      await agregarProductoAlCarrito(item);
      setSearchTerm('');
      setResultadosBusqueda([]);
      setActiveView('empty');
    },
    [agregarProductoAlCarrito],
  );

  const handleAgregarProductoCarta = useCallback(
    (item: GxProductoTouch) => agregarProductoAlCarrito(item),
    [agregarProductoAlCarrito],
  );

  const handleAgregarResultadoFiltro = useCallback(
    async (item: GxFiltroCategoriaProductoItem) => {
      await agregarProductoAlCarrito({
        productoKey: item.mItemKey,
        productoVendeLote: false,
        productoDescripcion: item.mItemNom,
      });
      setResultadosFiltro([]);
      setActiveView('empty');
    },
    [agregarProductoAlCarrito],
  );

  const handleBuscarProductos = useCallback(async () => {
    const texto = searchTerm.trim();
    if (!texto) {
      // Etapa 12: buscador vacío → limpia la pantalla y vuelve al empty state.
      setResultadosBusqueda([]);
      setActiveView('empty');
      return;
    }
    // Transiciona a 'search' de inmediato (Enter/Buscar) — la grilla unificada
    // muestra su propio estado de carga mientras se resuelve la consulta.
    setSearchSource('general');
    setActiveView('search');
    setIsLoadingBusqueda(true);
    setErrorBusqueda(null);
    try {
      const res = await getSelectorGeneral(texto);
      const productos = res.productos ?? [];
      // Búsqueda pensada para uso con teclado: si el término resuelve a un
      // único producto (ej. código exacto "1-748"), se agrega directo al
      // carrito sin exigir un clic adicional sobre el resultado.
      if (productos.length === 1) {
        setResultadosBusqueda([]);
        await handleAgregarResultadoBusqueda(productos[0]);
        return;
      }
      setResultadosBusqueda(productos);
    } catch (err) {
      setErrorBusqueda(err instanceof Error ? err.message : 'Error al buscar productos');
    } finally {
      setIsLoadingBusqueda(false);
    }
  }, [searchTerm, handleAgregarResultadoBusqueda]);

  const handleSelectLote = useCallback(
    async (loteKey: number) => {
      if (!loteModal) return;
      setIsSubmittingLote(true);
      try {
        await agregarProducto({
          notaVentaKey: keyAsNumber,
          accion: 'Agregar',
          productoKey: loteModal.productoKey,
          cantidad: loteModal.cantidadOriginal,
          loteKey,
        });
        setLoteModal(null);
        setSearchTerm('');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al agregar el producto');
      } finally {
        setIsSubmittingLote(false);
      }
    },
    [loteModal, keyAsNumber, agregarProducto],
  );

  // ── Diálogos de acciones: Cliente, Glosa, Transportista, Descuento, Vendedor ─
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);
  const [glosaDialogOpen, setGlosaDialogOpen] = useState(false);
  const [transportistaDialogOpen, setTransportistaDialogOpen] = useState(false);
  const [descuentoDialogOpen, setDescuentoDialogOpen] = useState(false);
  const [vendedorDialogOpen, setVendedorDialogOpen] = useState(false);
  // Etapa 9: modal de detalle extendido de producto — no altera el carro
  const [detalleProducto, setDetalleProducto] = useState<{ productoKey: number; descripcion: string } | null>(null);

  const handleClienteAsignado = useCallback(
    (clienteKey: number, nombre: string) => {
      storePatchActores({ clienteKey, clienteNombreCompleto: nombre });
    },
    [storePatchActores],
  );

  const handleVendedorAsignado = useCallback(
    (vendedorKey: number, apodo: string) => {
      storePatchActores({ vendedorKey, vendedorApodo: apodo });
    },
    [storePatchActores],
  );

  // ── Etapa 2: hotkeys globales F1–F12 — cada tecla abre su diálogo o, si la
  // lógica subyacente aún no existe, deja constancia con un console.warn ───
  const hotkeyMap = useMemo<HotkeyMap>(
    () => ({
      F2: () => { if (editaGlosa) setGlosaDialogOpen(true); },
      F3: () => setClienteDialogOpen(true),
      F4: () => { if (usaLectorQR) console.warn('No implementado: ESCÁNER (F4)'); },
      F5: () => { if (permiteDatosTransportista) setTransportistaDialogOpen(true); },
      F6: () => { if (usaProductoLibre) console.warn('No implementado: PROD. LIBRE (F6)'); },
      F7: () => console.warn('No implementado: EFECTIVO (F7)'),
      F8: () => { if (vendedorEditable) setVendedorDialogOpen(true); },
      F9: () => console.warn('No implementado: T. DÉBITO (F9)'),
      F10: () => { if (permiteAgregarReferencia) console.warn('No implementado: REFERENCIA (F10)'); },
      F11: () => console.warn('No implementado: T. CRÉDITO (F11)'),
      F12: () => { if (muestraDescuento) setDescuentoDialogOpen(true); },
    }),
    [editaGlosa, usaLectorQR, permiteDatosTransportista, usaProductoLibre, vendedorEditable, permiteAgregarReferencia, muestraDescuento],
  );
  useHotkeys(hotkeyMap, !isLoadingPOS && !errorPOS);

  if (isLoadingPOS) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-lg">Cargando datos de la venta...</p>
      </div>
    );
  }

  if (errorPOS) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <p className="text-destructive text-xl font-semibold">{errorPOS}</p>
        <button type="button" onClick={() => navigate(-1)} className="text-primary hover:underline">
          Volver atrás
        </button>
      </div>
    );
  }

  return (
    <div
      className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden"
      style={{ background: 'var(--muted)' }}
    >
      <PosBanner />

      {/* ── Cuerpo principal: dos columnas ─────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

      {/* ══════════════════════════════════════════════════════════════════
          COLUMNA IZQUIERDA — 40% — Totales + Carrito
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex-[40] flex flex-col h-full overflow-hidden min-w-0 border-r border-border/40">

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
                  className="text-foreground font-extrabold leading-none tracking-tight font-tabular"
                  style={{ fontSize: '2.6rem' }}
                >
                  {flags?.mostrarTotalOk !== false ? <NumericDisplay value={montos?.totalAMostrar ?? 0} /> : '—'}
                </span>
              </div>

              {/* Total Bruto + Pagos/Vuelto — solo si al menos uno es visible */}
              {(muestraTotalBruto || muestraTotalPagos) && (
                <div className="pt-2.5 border-t border-border/25 space-y-2">
                  {muestraTotalBruto && (
                    <div className="flex items-baseline justify-between">
                      <span className="text-muted-foreground text-[0.62rem] font-bold uppercase tracking-[0.08em]">
                        Total Bruto
                      </span>
                      <span
                        className="text-foreground font-semibold leading-none font-tabular"
                        style={{ fontSize: '1.15rem' }}
                      >
                        <NumericDisplay value={montos?.totalBruto ?? 0} />
                      </span>
                    </div>
                  )}

                  {muestraTotalPagos && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/60 rounded-lg px-3 py-2 border border-border/25">
                        <p className="text-muted-foreground text-[0.62rem] font-bold uppercase tracking-[0.08em] mb-1">
                          Pagos
                        </p>
                        <p
                          className="text-foreground font-bold leading-none font-tabular"
                          style={{ fontSize: '1.4rem' }}
                        >
                          {flags?.mostrarPagosOk !== false ? <NumericDisplay value={montos?.totalPagos ?? 0} /> : '—'}
                        </p>
                      </div>
                      <div className="bg-[hsl(var(--pos-success-bg))] rounded-lg px-3 py-2 border border-[hsl(var(--pos-success-border))]">
                        <p className="text-[hsl(var(--pos-success-text))] text-[0.62rem] font-bold uppercase tracking-[0.08em] mb-1">
                          Vuelto
                        </p>
                        <p
                          className="text-[hsl(var(--pos-success-text))] font-bold leading-none font-tabular"
                          style={{ fontSize: '1.4rem' }}
                        >
                          {flags?.mostrarVueltoOk !== false ? <NumericDisplay value={montos?.vuelto ?? 0} /> : '—'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
              {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
            </span>
            {actores?.clienteNombreCompleto && (
              <span className="text-muted-foreground text-[0.72rem] truncate max-w-[200px]">
                {actores.clienteNombreCompleto}
              </span>
            )}
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
            <tbody>
              {itemsOrdenados.map((item) => (
                <tr
                  key={item.linea}
                  className={cn(
                    'border-b border-border/20 hover:bg-muted/40 transition-colors',
                    item.esAnuladoOk && 'opacity-40 line-through',
                  )}
                >
                  <td className={cn('px-2.5 py-2 font-mono text-[0.78rem] text-muted-foreground', item.esDescuentoOk && 'text-destructive')}>{item.codigoInterno}</td>
                  <td className={cn('px-2.5 py-2 text-foreground', item.esDescuentoOk && 'text-destructive')}>{item.descripcion}</td>
                  <td className={cn('px-2.5 py-2 text-center text-muted-foreground text-[0.78rem]', item.esDescuentoOk && 'text-destructive')}>{item.unidadMedida}</td>
                  <td className={cn('px-2.5 py-2 text-center font-tabular', item.esDescuentoOk && 'text-destructive')}><NumericDisplay value={item.cantidad} currency="" /></td>
                  <td className={cn('px-2.5 py-2 text-right font-tabular', item.esDescuentoOk && 'text-destructive')}><NumericDisplay value={item.precio} /></td>
                  <td className="px-2.5 py-2 text-right font-tabular text-[hsl(var(--pos-success-text))]">
                    {Number(item.descuentoMonto) > 0 ? <NumericDisplay value={item.descuentoMonto} /> : '—'}
                  </td>
                  <td className={cn('px-2.5 py-2 text-right font-tabular font-semibold', item.esDescuentoOk && 'text-destructive')}><NumericDisplay value={item.totalItem} /></td>
                  <td className="px-2.5 py-2 text-center">
                    {item.editaGlosaOk && (
                      <button
                        type="button"
                        aria-label={`Editar glosa de ${item.descripcion}`}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-border/60 bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all focus:outline-none focus:ring-2 focus:ring-ring/20"
                      >
                        <FileText size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={cn('flex flex-col items-center justify-center h-48 gap-3', items.length > 0 && 'hidden')}>
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
          COLUMNA DERECHA — 60% — Acciones + Buscador + Catálogo
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex-[60] flex flex-col h-full overflow-hidden min-w-0">

        {/* ── Acciones consolidadas (shrink-0) ──────────────────────────── */}
        <div className="shrink-0 bg-card border-b border-border/40 p-3 flex flex-col gap-2">

          {/* Botonera táctil: objetivo de 5 columnas — el texto del botón
              nunca se trunca, se ajusta a 2 líneas si es necesario */}
          <div className="grid grid-cols-5 gap-1.5">
            <ActionBtn label="CLIENTE" kbd="F3" primary onClick={() => setClienteDialogOpen(true)} />
            {vendedorEditable && (
              <ActionBtn label="VENDEDOR" kbd="F8" onClick={() => setVendedorDialogOpen(true)} />
            )}
            {editaGlosa && (
              <ActionBtn label="GLOSA" kbd="F2" onClick={() => setGlosaDialogOpen(true)} />
            )}
            {permiteDatosTransportista && (
              <ActionBtn label="TRANSPORTISTA" kbd="F5" onClick={() => setTransportistaDialogOpen(true)} />
            )}
            {usaProductoLibre && (
              <ActionBtn label="PROD. LIBRE" kbd="F6" onClick={() => console.warn('No implementado: PROD. LIBRE (F6)')} />
            )}
            {permiteAgregarReferencia && (
              <ActionBtn label="REFERENCIA" kbd="F10" onClick={() => console.warn('No implementado: REFERENCIA (F10)')} />
            )}
            {muestraDescuento && (
              <ActionBtn label="DESCUENTO" kbd="F12" onClick={() => setDescuentoDialogOpen(true)} />
            )}
            {usaLectorQR && (
              <ActionBtn label="ESCÁNER" kbd="F4" onClick={() => console.warn('No implementado: ESCÁNER (F4)')} />
            )}
          </div>

          {/* Etapa 2: Pagar */}
          <div className="flex items-center gap-2" aria-hidden="true">
            <div className="flex-1 border-t border-border/30" />
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50 select-none">
              Pagar
            </span>
            <div className="flex-1 border-t border-border/30" />
          </div>
          <PagarSection pagarActivo={pagarActivo} />

          {/* Etapa 3: Emitir */}
          <div className="flex items-center gap-2" aria-hidden="true">
            <div className="flex-1 border-t border-border/30" />
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground/50 select-none">
              Emitir
            </span>
            <div className="flex-1 border-t border-border/30" />
          </div>
          <EmitirSection />
        </div>

        {/* ── Buscador + Catálogo (flex-1) ──────────────────────────────── */}
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
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  // Etapa 12: borrar la búsqueda limpia la pantalla al empty state.
                  if (value === '') {
                    setResultadosBusqueda([]);
                    setActiveView('empty');
                  }
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleBuscarProductos(); }}
                aria-label="Buscar producto por código o descripción"
                className="w-full pl-8 pr-3 h-9 rounded-[9px] border border-border/60 bg-card text-foreground text-[0.82rem] placeholder:text-muted-foreground"
              />
            </div>
            <Button
              type="button"
              variant="default"
              onClick={() => void handleBuscarProductos()}
              className="shrink-0 flex items-center gap-1.5 h-9 px-3 rounded-[9px] text-[0.78rem] font-semibold hover:bg-primary/90"
            >
              <Search size={13} />
              Buscar
              <KbdKeyLight label="↵" />
            </Button>

            {/* Toggle Filtrar / Carta — Filtrar solo si el flag lo habilita */}
            {muestraCatBuscadora ? (
              <div className="shrink-0 flex rounded-[9px] overflow-hidden border border-border/60" role="group" aria-label="Modo de catálogo">
                <Button
                  type="button"
                  onClick={() => setActiveView('filter')}
                  variant={activeView === 'filter' ? 'default' : 'ghost'}
                  aria-pressed={activeView === 'filter'}
                  className={cn(
                    'rounded-none border-r border-border/60 h-9 px-3 text-[0.75rem] font-semibold gap-1.5',
                    activeView !== 'filter' && 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Filter size={12} />
                  Filtrar
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveView('carta')}
                  variant={activeView === 'carta' ? 'default' : 'ghost'}
                  aria-pressed={activeView === 'carta'}
                  className={cn(
                    'rounded-none h-9 px-3 text-[0.75rem] font-semibold gap-1.5',
                    activeView !== 'carta' && 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <List size={12} />
                  Carta
                </Button>
              </div>
            ) : (
              <div className="shrink-0 flex items-center gap-1 px-3 h-9 rounded-[9px] bg-primary text-primary-foreground text-[0.75rem] font-semibold">
                <List size={12} />
                Carta
              </div>
            )}
          </div>

          {/* ── Panel inferior — vista única y mutuamente excluyente (Etapa 12) ── */}
          <div className="flex-1 flex flex-col overflow-y-auto min-h-0 p-1">

            {/* VISTA: FILTER — acordeón de filtro por categorías + navegación por categoría */}
            {activeView === 'filter' && (
              <div>

                {/* ── FILTRO POR CATEGORÍAS (colapsable) ───────────────────── */}
                {(isLoadingCategorias || colBuscadoras.length > 0) && (
                  <div className="border-b border-border/20">

                    {/* Encabezado colapsable */}
                    <button
                      type="button"
                      onClick={() => setFiltrosOpen((o) => !o)}
                      aria-expanded={filtrosOpen}
                      aria-controls="filtros-buscadoras-panel"
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <span className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-foreground">
                        Filtro por Categorías
                      </span>
                      <ChevronDown
                        size={14}
                        className={cn(
                          'text-muted-foreground transition-transform duration-200',
                          filtrosOpen && 'rotate-180',
                        )}
                        aria-hidden="true"
                      />
                    </button>

                    {/* Skeleton mientras cargan las categorías */}
                    {filtrosOpen && isLoadingCategorias && (
                      <div className="flex flex-col divide-y divide-border/20">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="grid grid-cols-[110px_1fr] items-center px-3.5 py-2.5 gap-3">
                            <Skeleton className="h-3 w-16 rounded" />
                            <Skeleton className="h-px w-full rounded" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Filas de filtro — una por ColBuscadoras */}
                    {filtrosOpen && !isLoadingCategorias && (
                      <div
                        id="filtros-buscadoras-panel"
                        className="flex flex-col divide-y divide-border/15"
                      >
                        {colBuscadoras.map((buscadora) => {
                          const inputId = `filtro-${buscadora.CatCod}`;
                          const valor = filtrosBuscadoras[buscadora.CatCod] ?? '';
                          return (
                            <div
                              key={buscadora.CatCod}
                              className="grid grid-cols-[110px_1fr] items-center px-3.5 py-2 gap-3"
                            >
                              <Label
                                htmlFor={inputId}
                                className="text-[0.72rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground truncate cursor-pointer"
                              >
                                {buscadora.CatNom}
                              </Label>
                              <div className="relative">
                                <Input
                                  id={inputId}
                                  type="text"
                                  placeholder="Ingrese descripción de categoría..."
                                  value={valor}
                                  onChange={(e) => setFiltroBuscadora(buscadora.CatCod, e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') void handleBuscarFiltro(); }}
                                  aria-label={`Filtrar por ${buscadora.CatNom}`}
                                  className="h-7 border-0 border-b border-border/50 rounded-none bg-transparent px-0 pr-5 text-[0.8rem] text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-primary/70 shadow-none"
                                />
                                {valor && (
                                  <button
                                    type="button"
                                    onClick={() => setFiltroBuscadora(buscadora.CatCod, '')}
                                    aria-label={`Limpiar ${buscadora.CatNom}`}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground focus-visible:outline-none"
                                  >
                                    <X size={11} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Footer: limpiar + buscar */}
                        <div className="flex items-center justify-between px-3.5 py-2 bg-muted/20">
                          {Object.values(filtrosBuscadoras).some(Boolean) ? (
                            <button
                              type="button"
                              onClick={resetFiltros}
                              className="text-[0.72rem] text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded px-1"
                            >
                              Limpiar
                            </button>
                          ) : (
                            <span />
                          )}
                          <Button
                            type="button"
                            variant="default"
                            onClick={() => void handleBuscarFiltro()}
                            disabled={!Object.values(filtrosBuscadoras).some(Boolean) || isLoadingFiltro}
                            className="h-7 px-3 text-[0.72rem] rounded-lg gap-1.5"
                          >
                            {isLoadingFiltro
                              ? <Loader2 size={11} className="animate-spin" />
                              : <Search size={11} />
                            }
                            Buscar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Grilla de categorías ─────────────────────────────────── */}
                <div>
                    {/* Error categorías */}
                    {errorCategorias && (
                      <div className="m-3 flex items-start gap-3 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30">
                        <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-destructive text-[0.8rem] font-semibold">Error al cargar categorías</p>
                          <p className="text-destructive/80 text-[0.72rem] mt-0.5 break-words">{errorCategorias}</p>
                          <Button
                            type="button" variant="ghost"
                            onClick={() => void forceFetchCategorias()}
                            className="mt-2 h-auto px-0 py-0 text-[0.72rem] font-semibold text-destructive hover:text-destructive hover:bg-transparent gap-1.5"
                          >
                            <Loader2 size={12} /> Reintentar
                          </Button>
                        </div>
                      </div>
                    )}

                    {isLoadingCategorias && <CategoriasSkeleton />}

                    {!isLoadingCategorias && !errorCategorias && categorias.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <List size={24} className="text-muted-foreground/40" />
                        <p className="text-muted-foreground text-[0.8rem]">Sin categorías disponibles</p>
                      </div>
                    )}

                    {!isLoadingCategorias && !errorCategorias && categorias.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 p-3" role="list" aria-label="Categorías disponibles">
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
                          <p className="text-foreground text-[0.72rem] font-bold uppercase tracking-[0.05em]">Productos</p>
                        </div>
                        {errorCarta && (
                          <div className="m-3 flex items-start gap-3 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30">
                            <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-destructive text-[0.8rem] font-semibold">Error al cargar productos</p>
                              <p className="text-destructive/80 text-[0.72rem] mt-0.5 break-words">{errorCarta}</p>
                              <Button type="button" variant="ghost" onClick={() => void fetchCarta(categoriaActiva)}
                                className="mt-2 h-auto px-0 py-0 text-[0.72rem] font-semibold text-destructive hover:text-destructive hover:bg-transparent gap-1.5">
                                <Loader2 size={12} /> Reintentar
                              </Button>
                            </div>
                          </div>
                        )}
                        {isLoadingCarta && (
                          <div className="flex flex-col gap-1 p-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Skeleton key={i} className="h-[60px] rounded-lg" />
                            ))}
                          </div>
                        )}
                        {!isLoadingCarta && !errorCarta && gruposProductos.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-8 gap-2">
                            <List size={20} className="text-muted-foreground/40" />
                            <p className="text-muted-foreground text-[0.8rem]">Sin productos en esta categoría</p>
                          </div>
                        )}
                        {!isLoadingCarta && !errorCarta && gruposProductos.map((grupo) =>
                          grupo.productos.map((producto) => (
                            <ProductoCard key={producto.productoKey} producto={producto} onAdd={() => {}} />
                          ))
                        )}
                      </div>
                    )}
                  </div>
              </div>
            )}

            {/* VISTA: CARTA — carta completa (getCartaTouch sin categoría) */}
            {activeView === 'carta' && (
              <div>
                {/* Error carta completa */}
                {errorCarta && (
                  <div className="m-3 flex items-start gap-3 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30">
                    <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-destructive text-[0.8rem] font-semibold">
                        Error al cargar la carta
                      </p>
                      <p className="text-destructive/80 text-[0.72rem] mt-0.5 break-words">
                        {errorCarta}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => void fetchCarta()}
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
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-[60px] rounded-lg" />
                    ))}
                  </div>
                )}

                {/* Estado vacío */}
                {!isLoadingCarta && !errorCarta && gruposCarta.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <List size={24} className="text-muted-foreground/40" />
                    <p className="text-muted-foreground text-[0.8rem]">Carta sin productos disponibles</p>
                  </div>
                )}

                {/* Grupos: tabla semántica independiente por grupo */}
                {!isLoadingCarta && !errorCarta && gruposCarta.map((grupo) => (
                  <section
                    key={grupo.grupoSelectorIdentificador}
                    aria-labelledby={`carta-grupo-${grupo.grupoSelectorIdentificador}`}
                    className="border-b border-border/20 last:border-0"
                  >
                    <h3
                      id={`carta-grupo-${grupo.grupoSelectorIdentificador}`}
                      className="px-3.5 py-2 bg-muted/40 border-b border-border/15 text-foreground text-[0.72rem] font-bold uppercase tracking-[0.05em]"
                    >
                      {grupo.grupoSelectorDescripcion}
                    </h3>
                    <ProductoResultadosTable
                      rows={grupo.productos.map((producto) => ({
                        key: producto.productoKey,
                        codigo: producto.productoCodigo,
                        descripcion: producto.productoDescripcion,
                        precio: producto.productoPrecios,
                        stock: producto.productoStock,
                        vendeLote: producto.productoVendeLote,
                      }))}
                      onAgregar={(row) => {
                        const producto = grupo.productos.find((p) => p.productoKey === row.key);
                        if (producto) void handleAgregarProductoCarta(producto);
                      }}
                      onVerDetalle={(row) => setDetalleProducto({ productoKey: Number(row.key), descripcion: row.descripcion })}
                    />
                  </section>
                ))}
              </div>
            )}

            {/* VISTA: SEARCH — grilla unificada de resultados, alimentada por el
                buscador general (selector-general) o por el filtro de categorías.
                Único bloque montado cuando activeView === 'search' (Etapa 12). */}
            {activeView === 'search' && (
              <div>
                {searchSource === 'general' ? (
                  <>
                    {errorBusqueda && (
                      <div className="m-3 flex items-start gap-3 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30">
                        <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
                        <p className="text-destructive text-[0.8rem] break-words">{errorBusqueda}</p>
                      </div>
                    )}
                    {isLoadingBusqueda && (
                      <div className="flex flex-col gap-1 p-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-[52px] rounded-lg" />
                        ))}
                      </div>
                    )}
                    {!isLoadingBusqueda && !errorBusqueda && resultadosBusqueda.length === 0 && (
                      <p className="text-sm text-muted-foreground px-4 py-3">Sin resultados para "{searchTerm}".</p>
                    )}
                    {!isLoadingBusqueda && !errorBusqueda && resultadosBusqueda.length > 0 && (
                      <ProductoResultadosTable
                        rows={resultadosBusqueda.map((item) => ({
                          key: item.productoKey,
                          codigo: item.mItemCodVal,
                          descripcion: item.productoDescripcion,
                          precio: item.precioPicture,
                          stock: null,
                          vendeLote: item.productoVendeLote,
                        }))}
                        onAgregar={(row) => {
                          const item = resultadosBusqueda.find((p) => p.productoKey === row.key);
                          if (item) void handleAgregarResultadoBusqueda(item);
                        }}
                        onVerDetalle={(row) => setDetalleProducto({ productoKey: Number(row.key), descripcion: row.descripcion })}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {errorFiltro && (
                      <div className="m-3 flex items-start gap-3 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/30">
                        <AlertCircle size={16} className="text-destructive shrink-0 mt-0.5" />
                        <p className="text-destructive text-[0.8rem] break-words">{errorFiltro}</p>
                      </div>
                    )}
                    {isLoadingFiltro && (
                      <div className="flex flex-col gap-1 p-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-[52px] rounded-lg" />
                        ))}
                      </div>
                    )}
                    {!isLoadingFiltro && !errorFiltro && resultadosFiltro.length === 0 && (
                      <p className="text-sm text-muted-foreground px-4 py-3">Sin resultados para el filtro aplicado.</p>
                    )}
                    {!isLoadingFiltro && !errorFiltro && resultadosFiltro.length > 0 && (
                      <ProductoResultadosTable
                        rows={resultadosFiltro.map((item) => ({
                          key: item.mItemKey,
                          codigo: item.codigo,
                          descripcion: item.mItemNom,
                          precio: formatPrecioItem(item.precioItem),
                          stock: item.stock,
                          vendeLote: false,
                        }))}
                        onAgregar={(row) => {
                          const item = resultadosFiltro.find((p) => p.mItemKey === row.key);
                          if (item) void handleAgregarResultadoFiltro(item);
                        }}
                        onVerDetalle={(row) => setDetalleProducto({ productoKey: Number(row.key), descripcion: row.descripcion })}
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {/* VISTA: EMPTY — placeholder; mutuamente excluyente con 'search' y
                'carta': se desmonta por completo apenas hay resultados (Etapa 10) */}
            {activeView === 'empty' && (
              <div className="flex flex-col items-center justify-center py-14 gap-2">
                <Search size={24} className="text-muted-foreground/40" />
                <p className="text-muted-foreground text-[0.8rem]">
                  Usa el buscador para agregar productos
                </p>
              </div>
            )}

          </div>
        </div>
      </div>

      </div>{/* fin cuerpo principal */}

      <LoteSelectorDialog
        open={loteModal !== null}
        productoKey={loteModal?.productoKey ?? null}
        lotes={loteModal?.lotes ?? []}
        cantidadOriginal={loteModal?.cantidadOriginal ?? ''}
        isSubmitting={isSubmittingLote}
        onSelectLote={(loteKey) => void handleSelectLote(loteKey)}
        onClose={() => setLoteModal(null)}
      />

      <ClienteXVentaDialog
        open={clienteDialogOpen}
        notaVentaKey={keyAsNumber}
        onClose={() => setClienteDialogOpen(false)}
        onAssigned={handleClienteAsignado}
      />

      <GlosaCabeceraDialog
        open={glosaDialogOpen}
        notaVentaKey={keyAsNumber}
        glosaActual={ventaGlosa}
        onClose={() => setGlosaDialogOpen(false)}
        onSaved={storeSetVentaGlosa}
      />

      <TransportistaDialog
        open={transportistaDialogOpen}
        notaVentaKey={keyAsNumber}
        onClose={() => setTransportistaDialogOpen(false)}
      />

      <DescuentoGlobalDialog
        open={descuentoDialogOpen}
        notaVentaKey={keyAsNumber}
        onClose={() => setDescuentoDialogOpen(false)}
      />

      <VendedorDialog
        open={vendedorDialogOpen}
        notaVentaKey={keyAsNumber}
        vendedorKeyActual={actores?.vendedorKey ?? 0}
        vendedorExige={exigeVendedorOk}
        onClose={() => setVendedorDialogOpen(false)}
        onAssigned={handleVendedorAsignado}
      />

      <ProductoDetalleDialog
        open={detalleProducto !== null}
        productoKey={detalleProducto?.productoKey ?? null}
        productoDescripcion={detalleProducto?.descripcion}
        onClose={() => setDetalleProducto(null)}
      />
    </div>
  );
}
