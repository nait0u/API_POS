// ---------------------------------------------------------------------------
// Tipos del estado inicial del POS — payload de GET /ventas/estado-caja
// ---------------------------------------------------------------------------

export type EstadoCaja = 'Cerrada' | 'Abierta' | (string & {});

export type AccionRequeridaCaja =
  | 'ABRIR_CAJA'
  | 'CERRAR_CAJA'
  | 'NINGUNA'
  | (string & {});

/**
 * Shape exacto que devuelve el BFF en GET /ventas/estado-caja.
 * Inicializa el contexto operativo del punto de venta.
 */
export interface PosEstadoCajaPayload {
  esCaja: boolean;
  turnoCajaKey: number;
  estadoCaja: EstadoCaja;
  usaMesas: boolean;
  requiereClientePreVenta: boolean;
  accionRequerida: AccionRequeridaCaja;
  alertas: string[];
}

export type PosStateStatus = 'loading' | 'ready' | 'error';

export interface PosStateContextValue {
  status: PosStateStatus;
  estado: PosEstadoCajaPayload | null;
  error: string | null;
  /** Reintenta la consulta al endpoint /ventas/estado-caja. */
  refresh: () => Promise<void>;
  /**
   * Determina la siguiente vista a renderizar tras pulsar "Nueva Venta".
   * Devuelve null cuando la caja no está abierta (acción abortada).
   */
  resolveNuevaVentaTarget: () => 'customer-selection' | 'nota-de-venta' | null;
}
