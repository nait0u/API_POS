import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ApiError,
  getClientes as apiGetClientes,
  guardarCliente as apiGuardarCliente,
  getComunas as apiGetComunas,
  getCategoriasPrecioCliente as apiGetCategoriasPrecioCliente,
  getClienteMatriz as apiGetClienteMatriz,
} from '@/services/apiClient';
import {
  type Customer,
  type CustomerFormData,
  type ComunaItem,
  type CategoriaPrecioClienteItem,
  type SDTClienteRow,
  type GetClienteMatrizOutput,
  sdtToCustomer,
  formToGuardarPayload,
} from '@/types/customer';

const SEARCH_DEBOUNCE_MS = 300;

export interface UseClientesReturn {
  // Datos
  clientes: Customer[];
  comunas: ComunaItem[];
  categorias: CategoriaPrecioClienteItem[];
  // Flags
  isSearching: boolean;
  isSaving: boolean;
  catalogosReady: boolean;
  // Búsqueda
  searchText: string;
  setSearchText: (text: string) => void;
  // Mutaciones
  guardarCliente: (form: CustomerFormData, clienteKeyIn: number) => Promise<number>;
  getClienteMatriz: (rut: string, sucursalClienteKey?: number) => Promise<GetClienteMatrizOutput>;
}

export function useClientes(): UseClientesReturn {
  const [rows, setRows] = useState<SDTClienteRow[]>([]);
  const [comunas, setComunas] = useState<ComunaItem[]>([]);
  const [categorias, setCategorias] = useState<CategoriaPrecioClienteItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [catalogosReady, setCatalogosReady] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Guardamos la request más reciente para descartar respuestas obsoletas.
  const lastSearchIdRef = useRef(0);

  // Catálogos estables — se cargan una sola vez al montar.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [comunasRes, categoriasRes] = await Promise.all([
          apiGetComunas(),
          apiGetCategoriasPrecioCliente(),
        ]);
        if (cancelled) return;
        setComunas(comunasRes.comunas ?? []);
        setCategorias(categoriasRes.categorias ?? []);
        setCatalogosReady(true);
      } catch (err) {
        if (cancelled) return;
        console.error('[useClientes] catálogos fallaron:', err);
        setCatalogosReady(true); // permitir trabajar aunque falten catálogos
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Índice de comunas por id para mapeo O(1).
  const comunasIndex = useMemo(() => {
    const map = new Map<string, ComunaItem>();
    for (const c of comunas) map.set(c.comunaId, c);
    return map;
  }, [comunas]);

  const clientes = useMemo(
    () => rows.map((r) => sdtToCustomer(r, comunasIndex)),
    [rows, comunasIndex],
  );

  // Búsqueda con debounce: se dispara con cada cambio del searchText.
  useEffect(() => {
    const handle = window.setTimeout(async () => {
      const myId = ++lastSearchIdRef.current;
      setIsSearching(true);
      try {
        const res = await apiGetClientes(searchText);
        if (myId !== lastSearchIdRef.current) return; // respuesta obsoleta
        setRows(res.clientes ?? []);
      } catch (err) {
        if (myId !== lastSearchIdRef.current) return;
        const message = err instanceof ApiError ? err.message : 'Error al buscar clientes';
        throw new Error(message);
      } finally {
        if (myId === lastSearchIdRef.current) setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [searchText]);

  const guardarCliente = useCallback(
    async (form: CustomerFormData, clienteKeyIn: number): Promise<number> => {
      setIsSaving(true);
      try {
        const payload = formToGuardarPayload(form, clienteKeyIn);
        const res = await apiGuardarCliente(payload);
        // Invalidar cualquier debounce en vuelo antes de refrescar.
        ++lastSearchIdRef.current;
        // Siempre refrescar con lista completa para que el cliente creado/editado aparezca.
        const updated = await apiGetClientes('');
        setSearchText('');
        setRows(updated.clientes ?? []);
        return res.clienteKey;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Error al guardar el cliente';
        throw new Error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const getClienteMatriz = useCallback(
    (rut: string, sucursalClienteKey?: number) => apiGetClienteMatriz(rut, sucursalClienteKey),
    [],
  );

  return {
    clientes,
    comunas,
    categorias,
    isSearching,
    isSaving,
    catalogosReady,
    searchText,
    setSearchText,
    guardarCliente,
    getClienteMatriz,
  };
}
