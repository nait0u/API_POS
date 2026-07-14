import { create } from 'zustand';
import type {
  GetPantallaVentaInitOutput,
  GetPantallaVentaTotalesOutput,
  GetPantallaVentaCarritoOutput,
  GxVentaCarritoItem,
  GxPantallaVentaInitActores,
} from '@/types/ventas';

interface PosVentaState {
  initData: GetPantallaVentaInitOutput | null;
  totalesData: GetPantallaVentaTotalesOutput | null;
  carrito: GxVentaCarritoItem[];
  carritoSyncTimeStamp: string | undefined;
  ventaFecha: string | null;
  ventaGlosa: string;

  setInitData: (data: GetPantallaVentaInitOutput) => void;
  setTotalesData: (data: GetPantallaVentaTotalesOutput) => void;
  setVentaFecha: (fecha: string | null) => void;
  setVentaGlosa: (glosa: string) => void;
  /**
   * Actualiza localmente cliente/vendedor mostrados tras asignarlos desde un
   * diálogo (PUT /carrito/cliente y /carrito/vendedor no devuelven Delta ni
   * actores completos) — evita un refetch completo de GetPantallaVentaInit.
   */
  patchActores: (patch: Partial<GxPantallaVentaInitActores>) => void;
  /**
   * Delta-merge: elimina las líneas en `lineasEliminadas`, actualiza o inserta
   * las filas en `itemsActualizados`. No toca las filas que no aparecen en el payload.
   * Guard por SyncTimeStamp: si el timestamp no cambió, no hace nada.
   */
  mergeCarrito: (payload: GetPantallaVentaCarritoOutput) => void;
  resetVenta: () => void;
}

const initialState = {
  initData: null as GetPantallaVentaInitOutput | null,
  totalesData: null as GetPantallaVentaTotalesOutput | null,
  carrito: [] as GxVentaCarritoItem[],
  carritoSyncTimeStamp: undefined as string | undefined,
  ventaFecha: null as string | null,
  ventaGlosa: '' as string,
};

export const usePosVentaStore = create<PosVentaState>((set, get) => ({
  ...initialState,

  setInitData: (data) => set({ initData: data }),

  setTotalesData: (data) => set({ totalesData: data }),

  setVentaFecha: (fecha) => set({ ventaFecha: fecha }),

  setVentaGlosa: (glosa) => set({ ventaGlosa: glosa }),

  patchActores: (patch) =>
    set((state) => {
      if (!state.initData) return state;
      return { initData: { ...state.initData, actores: { ...state.initData.actores, ...patch } } };
    }),

  mergeCarrito: (payload) => {
    const { sync, itemsActualizados, lineasEliminadas } = payload;
    if (get().carritoSyncTimeStamp === sync.timeStamp) return;

    set((state) => {
      const eliminadas = new Set(lineasEliminadas.map((l) => l.lineaEliminadaItem));
      const updatedMap = new Map(itemsActualizados.map((i) => [i.linea, i]));

      // Filtrar eliminadas y sustituir items actualizados (merge inmutable)
      const merged = state.carrito
        .filter((i) => !eliminadas.has(i.linea))
        .map((i) => updatedMap.get(i.linea) ?? i);

      // Agregar líneas nuevas (presentes en el payload pero no en el carrito actual)
      const existingLineas = new Set(merged.map((i) => i.linea));
      const newItems = itemsActualizados.filter((i) => !existingLineas.has(i.linea));

      return {
        carrito: [...merged, ...newItems],
        carritoSyncTimeStamp: sync.timeStamp,
      };
    });
  },

  resetVenta: () => set(initialState),
}));

// ── Fine-grained selectors (evitan re-renders en otros suscriptores) ─────────

export const selectPermiteAgregarReferencia = (s: PosVentaState) =>
  s.initData?.uiFlags.permiteAgregarReferencia ?? false;

export const selectMuestraDescuentoGlobal = (s: PosVentaState) =>
  (s.initData?.uiFlags.muestraDescuentoGlobalOk ?? false) &&
  (s.initData?.settings.modificaDescuentoOk ?? false);

export const selectMuestraTotalBruto = (s: PosVentaState) =>
  s.initData?.uiFlags.muestraTotalBrutoOk ?? false;

export const selectMuestraTotalPagos = (s: PosVentaState) =>
  s.initData?.uiFlags.muestraTotalPagosOk ?? false;

export const selectMuestraCatBuscadora = (s: PosVentaState) =>
  s.initData?.uiFlags.muestraCatBuscadoraOk ?? false;

export const selectEditaGlosa = (s: PosVentaState) =>
  s.initData?.permisos.editaGlosa ?? false;

export const selectVendedorEditable = (s: PosVentaState) =>
  (s.initData?.actores.vendedorEditOk ?? false) &&
  (s.initData?.permisos.editaVendedor ?? false);

export const selectUsaProductoLibre = (s: PosVentaState) =>
  s.initData?.settings.usaProductoLibre ?? false;

export const selectPermiteDatosTransportista = (s: PosVentaState) =>
  s.initData?.uiFlags.permiteDatosTransportista ?? false;

export const selectUsaLectorQR = (s: PosVentaState) =>
  s.initData?.settings.usaLectorQR ?? false;

export const selectRecibePagos = (s: PosVentaState) =>
  s.initData?.permisos.recibePagos ?? false;

export const selectMostrarBtnPagos = (s: PosVentaState) =>
  s.totalesData?.flags.mostrarBtnPagosOk ?? false;

export const selectMetodosDePago = (s: PosVentaState) =>
  s.initData?.metodosDePago ?? null;

/**
 * Config de emisión de documentos — contiene todas las flags de UIFlags
 * relacionadas con el dropdown EMITIR. Usar con useShallow para evitar
 * re-renders por cambios en otras partes del estado (ej. carrito).
 */
export interface EmisionConfig {
  permiteEditarTipoDocTri: boolean;
  tipoDocumentoDefecto: string;
  guiaVenta: boolean;
  factura: boolean;
  boleta: boolean;
  guiaTraslado: boolean;
  ticketNoTri: boolean;
}

export const selectEmisionConfig = (s: PosVentaState): EmisionConfig => ({
  permiteEditarTipoDocTri: s.initData?.uiFlags.permiteEditarTipoDocTriOk ?? false,
  tipoDocumentoDefecto:    s.initData?.settings.tipoDocumentoDefecto ?? '',
  guiaVenta:   s.initData?.uiFlags.permiteEmitirGuiaVenta ?? false,
  factura:     s.initData?.uiFlags.permiteEmitirFactura ?? false,
  boleta:      s.initData?.uiFlags.permiteEmitirBoleta ?? false,
  guiaTraslado: s.initData?.uiFlags.permiteEmitirGuiaTraslado ?? false,
  ticketNoTri: s.initData?.uiFlags.permiteEmitirTicketNoTriOk ?? false,
});

/** Datos del banner transaccional del POS — usar con useShallow */
export interface BannerTransaccionInfo {
  tipoDocumento: string;
  cliente: string;
  vendedor: string;
  ventaFecha: string | null;
}

export const selectBannerTransaccion = (s: PosVentaState): BannerTransaccionInfo => ({
  tipoDocumento: s.initData?.settings.tipoDocumentoDefecto ?? '',
  cliente:       s.initData?.actores.clienteNombreCompleto ?? '',
  vendedor:      s.initData?.actores.vendedorApodo ?? '',
  ventaFecha:    s.ventaFecha,
});
