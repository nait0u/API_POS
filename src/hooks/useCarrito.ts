import { useCallback, useRef } from 'react';
import { usePosVentaStore } from '@/store/posVentaStore';
import {
  agregarProductoCarrito as apiAgregarProducto,
  fijarCantidadCarrito as apiFijarCantidad,
  eliminarLineaCarrito as apiEliminarLinea,
  setGlosaCabecera as apiSetGlosaCabecera,
  setGlosaLinea as apiSetGlosaLinea,
  setDescuentoGlobal as apiSetDescuentoGlobal,
  setClienteCarrito as apiSetCliente,
  setVendedorCarrito as apiSetVendedor,
  setTransportista as apiSetTransportista,
  setReferencias as apiSetReferencias,
  omniboxAgregar as apiOmniboxAgregar,
  interpretPosError,
} from '@/services/apiClient';
import type {
  DeltaCarritoResponseDto,
  AgregarProductoCarritoInput,
  FijarCantidadCarritoInput,
  EliminarLineaCarritoInput,
  GlosaCabeceraInput,
  GlosaLineaInput,
  DescuentoGlobalInput,
  AsignarClienteCarritoInput,
  AsignarVendedorCarritoInput,
  TransportistaCarritoInput,
  ReferenciasCarritoInput,
  OmniboxAgregarInput,
} from '@/types/carrito';

// Las mutaciones de carrito reutilizan usePosVentaStore (mergeCarrito/setTotalesData)
// en vez de un store propio: DeltaCarritoResponseDto.carrito/.totales tienen exactamente
// la misma forma que GetPantallaVentaCarritoOutput/GetPantallaVentaTotalesOutput, y
// PantallaVentaView ya renderiza el carrito desde ese store — un store paralelo
// dejaría el carrito visible desincronizado de las mutaciones nuevas.

export function useCarrito() {
  const mergeCarrito = usePosVentaStore((s) => s.mergeCarrito);
  const setTotalesData = usePosVentaStore((s) => s.setTotalesData);

  const applyDelta = useCallback(
    (delta: DeltaCarritoResponseDto) => {
      mergeCarrito(delta.carrito);
      setTotalesData(delta.totales);
    },
    [mergeCarrito, setTotalesData],
  );

  // Serializa mutaciones de cantidad — GeneXus encadena dos llamadas sobre un
  // estado server-side compartido por NotaVentaKey; llamadas concurrentes
  // sobre la misma "línea activa" pueden pisarse entre sí.
  const cantidadMutexRef = useRef<Promise<unknown>>(Promise.resolve());

  const runSerialized = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const run = cantidadMutexRef.current.then(task, task);
    cantidadMutexRef.current = run.catch(() => undefined);
    return run;
  }, []);

  const agregarProducto = useCallback(
    async (input: AgregarProductoCarritoInput) => {
      const delta = await apiAgregarProducto(input);
      applyDelta(delta);
      return delta;
    },
    [applyDelta],
  );

  const fijarCantidad = useCallback(
    (input: FijarCantidadCarritoInput) =>
      runSerialized(async () => {
        const delta = await apiFijarCantidad(input);
        applyDelta(delta);
        return delta;
      }),
    [applyDelta, runSerialized],
  );

  const eliminarLinea = useCallback(
    async (input: EliminarLineaCarritoInput) => {
      const delta = await apiEliminarLinea(input);
      applyDelta(delta);
      return delta;
    },
    [applyDelta],
  );

  const setGlosaCabecera = useCallback((input: GlosaCabeceraInput) => apiSetGlosaCabecera(input), []);

  const setGlosaLinea = useCallback(
    async (input: GlosaLineaInput) => {
      const delta = await apiSetGlosaLinea(input);
      applyDelta(delta);
      return delta;
    },
    [applyDelta],
  );

  const setDescuentoGlobal = useCallback(
    async (input: DescuentoGlobalInput) => {
      // ⚠️ GeneXus recalcula el descuento de forma perezosa — este delta
      // (y un GET de totales inmediato) puede no reflejar el descuento
      // todavía; se refleja recién en la siguiente mutación de carrito.
      const delta = await apiSetDescuentoGlobal(input);
      applyDelta(delta);
      return delta;
    },
    [applyDelta],
  );

  const setCliente = useCallback((input: AsignarClienteCarritoInput) => apiSetCliente(input), []);
  const setVendedor = useCallback((input: AsignarVendedorCarritoInput) => apiSetVendedor(input), []);
  const setTransportista = useCallback((input: TransportistaCarritoInput) => apiSetTransportista(input), []);
  const setReferencias = useCallback((input: ReferenciasCarritoInput) => apiSetReferencias(input), []);

  const omniboxAgregar = useCallback(
    async (input: OmniboxAgregarInput) => {
      try {
        const delta = await apiOmniboxAgregar(input);
        applyDelta(delta);
        return delta;
      } catch (err) {
        // Re-lanzar como PosErrorInfo estructurado — el 428 trae { productoKey, lotes }
        // en `body`, necesario para abrir el selector de lote.
        throw interpretPosError(err);
      }
    },
    [applyDelta],
  );

  return {
    agregarProducto,
    fijarCantidad,
    eliminarLinea,
    setGlosaCabecera,
    setGlosaLinea,
    setDescuentoGlobal,
    setCliente,
    setVendedor,
    setTransportista,
    setReferencias,
    omniboxAgregar,
  };
}
