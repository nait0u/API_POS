import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getClientesXVenta as apiGetClientesXVenta,
  crearClienteShellXVenta as apiCrearShell,
  copiarClienteXVenta as apiCopiarCliente,
  actualizarClienteXVenta as apiActualizarCliente,
  getComunas as apiGetComunas,
  interpretPosError,
} from '@/services/apiClient';
import type {
  ClienteXVentaRow,
  GetClientesXVentaFiltro,
  CopiarClienteInput,
  ActualizarClienteXVentaInput,
} from '@/types/clientesXVenta';
import type { ComunaItem } from '@/types/customer';

const SEARCH_DEBOUNCE_MS = 300;

export interface UseClientesXVentaReturn {
  clientes: ClienteXVentaRow[];
  isSearching: boolean;
  isSaving: boolean;
  filtro: GetClientesXVentaFiltro;
  setFiltro: (filtro: GetClientesXVentaFiltro) => void;
  crearShell: () => Promise<number>;
  copiarCliente: (input: CopiarClienteInput) => Promise<number>;
  actualizarCliente: (clienteKey: number, input: ActualizarClienteXVentaInput) => Promise<void>;
  /** Inserta una fila en la lista local sin refetch (ej. tras crear/duplicar) */
  addClienteLocal: (row: ClienteXVentaRow) => void;
  /** Actualiza una fila existente en la lista local sin refetch (ej. tras editar) */
  patchClienteLocal: (clienteKey: number, patch: Partial<ClienteXVentaRow>) => void;
  comunas: ComunaItem[];
}

export function useClientesXVenta(): UseClientesXVentaReturn {
  const [clientes, setClientes] = useState<ClienteXVentaRow[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filtro, setFiltro] = useState<GetClientesXVentaFiltro>({});
  const [comunas, setComunas] = useState<ComunaItem[]>([]);

  const lastSearchIdRef = useRef(0);

  useEffect(() => {
    apiGetComunas()
      .then((res) => setComunas(res.comunas ?? []))
      .catch(() => setComunas([]));
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      const myId = ++lastSearchIdRef.current;
      setIsSearching(true);
      try {
        const res = await apiGetClientesXVenta(filtro);
        if (myId !== lastSearchIdRef.current) return;
        setClientes(res.clientes ?? []);
      } catch (err) {
        if (myId !== lastSearchIdRef.current) return;
        throw new Error(interpretPosError(err).message);
      } finally {
        if (myId === lastSearchIdRef.current) setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [filtro]);

  const crearShell = useCallback(async (): Promise<number> => {
    setIsSaving(true);
    try {
      const res = await apiCrearShell();
      return res.clienteKey;
    } catch (err) {
      throw new Error(interpretPosError(err).message);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const copiarCliente = useCallback(async (input: CopiarClienteInput): Promise<number> => {
    setIsSaving(true);
    try {
      const res = await apiCopiarCliente(input);
      return res.clienteKeyNew;
    } catch (err) {
      throw new Error(interpretPosError(err).message);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const actualizarCliente = useCallback(
    async (clienteKey: number, input: ActualizarClienteXVentaInput): Promise<void> => {
      setIsSaving(true);
      try {
        await apiActualizarCliente(clienteKey, input);
      } catch (err) {
        throw new Error(interpretPosError(err).message);
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const addClienteLocal = useCallback((row: ClienteXVentaRow) => {
    setClientes((prev) => [row, ...prev]);
  }, []);

  const patchClienteLocal = useCallback((clienteKey: number, patch: Partial<ClienteXVentaRow>) => {
    setClientes((prev) => prev.map((c) => (c.clienteKey === clienteKey ? { ...c, ...patch } : c)));
  }, []);

  return {
    clientes,
    isSearching,
    isSaving,
    filtro,
    setFiltro,
    crearShell,
    copiarCliente,
    actualizarCliente,
    addClienteLocal,
    patchClienteLocal,
    comunas,
  };
}
