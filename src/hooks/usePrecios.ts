import { useState, useCallback, useEffect, useRef } from 'react';
import type { SDTPrecios, FiltroPrecios, PaginationState, SortState, PrecioPK, ProductoSearchSDT, UbicacionItem } from '../types/precios';
import { getPrecios, getBCPrecio, putBCPrecio, caducarPrecio as apiCaducarPrecio, getNovedades, uploadPreciosNativo, crearPrecioNuevo as apiCrearPrecioNuevo, getUbicaciones as apiGetUbicaciones, getFormatosUpload, ApiError } from '../services/apiClient';

// ---------------------------------------------------------------------------
// Estado global del módulo Lista de Precios
// ---------------------------------------------------------------------------

export interface PreciosState {
  // Data
  allItems: SDTPrecios[];         // lista completa del backend
  filteredItems: SDTPrecios[];    // tras filtro client-side de search
  displayItems: SDTPrecios[];     // página actual
  totalCount: number;

  // Timestamps
  lastTimeStamp: string | null;

  // Status
  loading: boolean;
  error: string | null;
  errorStatus: number | null;

  // Filtros
  filters: FiltroPrecios;
  searchText: string;

  // Paginación (client-side por ahora)
  pagination: PaginationState;
  totalPages: number;

  // Sorting
  sort: SortState;

  // UI
  editingPrecio: SDTPrecios | null;
  editingBC: string | null;   // PrecioChar del BC
  editLoading: boolean;
  drawerOpen: boolean;
  isNewMode: boolean;
  selectedProduct: ProductoSearchSDT | null;
  expireTarget: SDTPrecios | null;
  importOpen: boolean;
  importFormatOptions: { value: string; label: string }[];
  importFormatLoading: boolean;
  saving: boolean;
  toast: { message: string; type: 'success' | 'error' } | null;

  // Ubicaciones
  ubicaciones: UbicacionItem[];

  // Inputs base URL
  baseEmpKey: number;
  baseUbiCod: string;
}

const DEFAULT_EMP_KEY = 1008;

export function usePrecios() {
  const [state, setState] = useState<PreciosState>(() => {
    const params = new URLSearchParams(window.location.search);
    const empKeyStr = params.get('empkey');
    const ubiCodStr = params.get('ubicod');

    const baseEmpKey = empKeyStr ? parseInt(empKeyStr, 10) : DEFAULT_EMP_KEY;
    const baseUbiCod = ubiCodStr || '';

    return {
      allItems: [],
      filteredItems: [],
      displayItems: [],
      totalCount: 0,
      lastTimeStamp: null,
      loading: false,
      error: null,
      errorStatus: null,
      filters: {
        EmpKey: baseEmpKey,
        CodIntValor: '',
        ProductoDescripcion: '',
        Ubicacion: baseUbiCod,
        CategoriaPrecioIdl: '',
        FechaFiltro: new Date().toISOString().slice(0, 10),
      },
      searchText: '',
      pagination: { page: 1, pageSize: 20 },
      totalPages: 1,
      sort: { column: null, direction: null },
      editingPrecio: null,
      editingBC: null,
      editLoading: false,
      drawerOpen: false,
      isNewMode: false,
      selectedProduct: null,
      expireTarget: null,
      importOpen: false,
      importFormatOptions: [],
      importFormatLoading: false,
      saving: false,
      toast: null,
      ubicaciones: [],
      baseEmpKey,
      baseUbiCod,
    };
  });

  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (state.toast) {
      toastTimer.current = setTimeout(() => {
        setState(s => ({ ...s, toast: null }));
      }, 4000);
      return () => { if (toastTimer.current != null) clearTimeout(toastTimer.current); };
    }
  }, [state.toast]);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setState(s => ({ ...s, toast: { message, type } }));
  }, []);

  // -----------------------------------------------------------------------
  // Helpers: PK matching + expiration filter
  // -----------------------------------------------------------------------
  const matchPK = useCallback((a: SDTPrecios, b: SDTPrecios) =>
    a.Empkey === b.Empkey &&
    a.ProductoKey === b.ProductoKey &&
    a.PrecioTimeInicio === b.PrecioTimeInicio &&
    a.PrecioUbiCod === b.PrecioUbiCod &&
    a.CategoriaPrecioIdl === b.CategoriaPrecioIdl &&
    a.PrecioCantidad === b.PrecioCantidad &&
    a.PrecioHoraInicio === b.PrecioHoraInicio,
  []);

  const filterActive = useCallback((items: SDTPrecios[]) => {
    const now = new Date();
    return items.filter(i => new Date(i.PrecioTimeFin) > now);
  }, []);

  // -----------------------------------------------------------------------
  // Client-side sort + paginate
  // -----------------------------------------------------------------------
  const applyClientSortAndPage = useCallback(
    (items: SDTPrecios[], sort: SortState, pagination: PaginationState) => {
      let sorted = [...items];

      if (sort.column && sort.direction) {
        sorted.sort((a, b) => {
          const va = a[sort.column!];
          const vb = b[sort.column!];
          let cmp = 0;
          if (typeof va === 'number' && typeof vb === 'number') {
            cmp = va - vb;
          } else {
            cmp = String(va).localeCompare(String(vb), 'es');
          }
          return sort.direction === 'desc' ? -cmp : cmp;
        });
      }

      const totalPages = Math.max(1, Math.ceil(sorted.length / pagination.pageSize));
      const safePage = Math.min(pagination.page, totalPages);
      const start = (safePage - 1) * pagination.pageSize;
      const displayItems = sorted.slice(start, start + pagination.pageSize);

      return { filteredItems: sorted, displayItems, totalPages, pagination: { ...pagination, page: safePage } };
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Client-side search filtering (código + descripción)
  // -----------------------------------------------------------------------
  const applySearch = useCallback(
    (items: SDTPrecios[], search: string) => {
      if (!search.trim()) return items;
      const q = search.toLowerCase();
      return items.filter(
        i =>
          i.CodIntValor.toLowerCase().includes(q) ||
          i.ProductoDescripcion.toLowerCase().includes(q),
      );
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Fetch main list
  // -----------------------------------------------------------------------
  const fetchPrecios = useCallback(async (filters?: FiltroPrecios) => {
    setState(s => ({ ...s, loading: true, error: null, errorStatus: null }));
    try {
      const f = filters || state.filters;
      const result = await getPrecios(f);
      const items = result.ListaPreciosSDT || [];
      setState(s => {
        const active = filterActive(items);
        const searched = applySearch(active, s.searchText);
        const paged = applyClientSortAndPage(searched, s.sort, { ...s.pagination, page: 1 });
        return {
          ...s,
          allItems: items,
          ...paged,
          totalCount: active.length,
          lastTimeStamp: result.TimeStamp,
          loading: false,
          filters: f,
        };
      });
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : null;
      setState(s => ({
        ...s,
        loading: false,
        error: apiErr?.message || (err instanceof Error ? err.message : 'Error desconocido'),
        errorStatus: apiErr?.status || 500,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.filters, filterActive, applySearch, applyClientSortAndPage]);

  // -----------------------------------------------------------------------
  // Incremental sync via GetNovedades
  // -----------------------------------------------------------------------
  const syncNovedades = useCallback(async () => {
    const { lastTimeStamp, filters } = state;
    if (!lastTimeStamp) {
      console.warn('[syncNovedades] Sin lastTimeStamp, haciendo fetch completo');
      return fetchPrecios();
    }
    try {
      const result = await getNovedades(filters.EmpKey, filters.Ubicacion || '', lastTimeStamp);
      const novedades = result.ListaPreciosSDT || [];
      console.log(`[syncNovedades] ${novedades.length} novedades recibidas`);

      setState(s => {
        // Merge: update existing items or append new ones
        const updatedItems = [...s.allItems];
        for (const novedad of novedades) {
          const idx = updatedItems.findIndex(item => matchPK(item, novedad));
          if (idx >= 0) {
            updatedItems[idx] = novedad;
          } else {
            updatedItems.push(novedad);
          }
        }
        // Re-apply display pipeline with active filter
        const active = filterActive(updatedItems);
        const searched = applySearch(active, s.searchText);
        const paged = applyClientSortAndPage(searched, s.sort, s.pagination);
        return {
          ...s,
          allItems: updatedItems,
          ...paged,
          totalCount: active.length,
          lastTimeStamp: result.TimeStampOut || s.lastTimeStamp,
        };
      });
    } catch (err) {
      console.error('[syncNovedades] Error:', err);
    }
  }, [state.lastTimeStamp, state.filters, fetchPrecios, matchPK, filterActive, applySearch, applyClientSortAndPage]);

  // Initial fetch
  const hasFetched = useRef(false);
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchPrecios();
      // Also fetch ubicaciones
      apiGetUbicaciones(state.baseEmpKey)
        .then(res => setState(s => ({ ...s, ubicaciones: res.UbicacionesComboSDT || [] })))
        .catch(() => { /* silently fail */ });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------------
  // Setters
  // -----------------------------------------------------------------------
  const setFilters = useCallback((partial: Partial<FiltroPrecios>) => {
    setState(s => ({ ...s, filters: { ...s.filters, ...partial } }));
  }, []);

  const setSearchText = useCallback((text: string) => {
    setState(s => {
      const active = filterActive(s.allItems);
      const searched = applySearch(active, text);
      const paged = applyClientSortAndPage(searched, s.sort, { ...s.pagination, page: 1 });
      return { ...s, searchText: text, ...paged, totalCount: active.length };
    });
  }, [filterActive, applySearch, applyClientSortAndPage]);

  const clearFilters = useCallback(() => {
    let cleared: FiltroPrecios | null = null;
    setState(s => {
      cleared = {
        EmpKey: s.baseEmpKey,
        CodIntValor: '',
        ProductoDescripcion: '',
        Ubicacion: s.baseUbiCod,
        CategoriaPrecioIdl: '',
        FechaFiltro: new Date().toISOString().slice(0, 10),
      };
      return { ...s, filters: cleared, searchText: '' };
    });
    // Use setTimeout to ensure fetchPrecios runs after state has update been dispatched,
    // or just pass the `cleared` object directly. The old code passed it directly.
    setTimeout(() => {
        if (cleared) fetchPrecios(cleared);
    }, 0);
  }, [fetchPrecios]);

  const setPage = useCallback((page: number) => {
    setState(s => {
      const paged = applyClientSortAndPage(s.filteredItems, s.sort, { ...s.pagination, page });
      return { ...s, ...paged };
    });
  }, [applyClientSortAndPage]);

  const setPageSize = useCallback((pageSize: number) => {
    setState(s => {
      const paged = applyClientSortAndPage(s.filteredItems, s.sort, { page: 1, pageSize });
      return { ...s, ...paged };
    });
  }, [applyClientSortAndPage]);

  const toggleSort = useCallback((column: keyof SDTPrecios) => {
    setState(s => {
      let newDir: 'asc' | 'desc' | null;
      if (s.sort.column === column) {
        newDir = s.sort.direction === 'asc' ? 'desc' : s.sort.direction === 'desc' ? null : 'asc';
      } else {
        newDir = 'asc';
      }
      const newSort: SortState = { column: newDir ? column : null, direction: newDir };
      const paged = applyClientSortAndPage(s.filteredItems, newSort, s.pagination);
      return { ...s, sort: newSort, ...paged };
    });
  }, [applyClientSortAndPage]);

  // -----------------------------------------------------------------------
  // Edit (Get BC + Drawer)
  // -----------------------------------------------------------------------
  const openEdit = useCallback(async (precio: SDTPrecios) => {
    setState(s => ({ ...s, editLoading: true, drawerOpen: true, editingPrecio: precio, editingBC: null }));
    try {
      const pk: PrecioPK = {
        Empkey: precio.Empkey,
        ProductoKey: precio.ProductoKey,
        PrecioTimeInicio: precio.PrecioTimeInicio,
        PrecioUbiCod: precio.PrecioUbiCod,
        CategoriaPrecioIdl: precio.CategoriaPrecioIdl,
        PrecioCantidad: precio.PrecioCantidad,
        PrecioHoraInicio: precio.PrecioHoraInicio,
      };
      const result = await getBCPrecio(pk);
      setState(s => ({ ...s, editLoading: false, editingBC: result.PrecioChar }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al obtener precio';
      showToast(msg, 'error');
      setState(s => ({ ...s, editLoading: false, drawerOpen: false }));
    }
  }, [showToast]);

  const closeDrawer = useCallback(() => {
    setState(s => ({ ...s, drawerOpen: false, editingPrecio: null, editingBC: null, isNewMode: false, selectedProduct: null }));
  }, []);

  const savePrecio = useCallback(async (precioChar: string, empKey: number, productoKey: number) => {
    setState(s => ({ ...s, saving: true }));
    try {
      const result = await putBCPrecio(precioChar, empKey, productoKey);
      const ok = result.Mensaje?.toLowerCase().includes('ok');
      showToast(result.Mensaje || 'Guardado', ok ? 'success' : 'error');
      if (ok) {
        setState(s => ({ ...s, saving: false, drawerOpen: false }));
        fetchPrecios();
      } else {
        setState(s => ({ ...s, saving: false }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      showToast(msg, 'error');
      setState(s => ({ ...s, saving: false }));
    }
  }, [showToast, fetchPrecios]);

  // -----------------------------------------------------------------------
  // Caducar
  // -----------------------------------------------------------------------
  const openExpire = useCallback((precio: SDTPrecios) => {
    setState(s => ({ ...s, expireTarget: precio }));
  }, []);

  const closeExpire = useCallback(() => {
    setState(s => ({ ...s, expireTarget: null }));
  }, []);

  const confirmExpire = useCallback(async () => {
    const target = state.expireTarget;
    console.log('[confirmExpire] expireTarget:', target);
    if (!target) { console.warn('[confirmExpire] ABORTADO: expireTarget es null'); return; }
    setState(s => ({ ...s, saving: true }));
    try {
      const pk: PrecioPK = {
        Empkey: target.Empkey,
        ProductoKey: target.ProductoKey,
        PrecioTimeInicio: target.PrecioTimeInicio,
        PrecioUbiCod: target.PrecioUbiCod,
        CategoriaPrecioIdl: target.CategoriaPrecioIdl,
        PrecioCantidad: target.PrecioCantidad,
        PrecioHoraInicio: target.PrecioHoraInicio,
      };
      console.log('[confirmExpire] PK construida:', JSON.stringify(pk));
      const result = await apiCaducarPrecio(pk);
      console.log('[confirmExpire] Resultado completo:', JSON.stringify(result));
      console.log('[confirmExpire] result.Mensaje:', JSON.stringify(result.Mensaje));
      console.log('[confirmExpire] typeof result.Mensaje:', typeof result.Mensaje);
      const ok = result.Mensaje?.toLowerCase().includes('ok');
      console.log('[confirmExpire] includes("OK") =>', ok);
      showToast(result.Mensaje || 'Caducado', ok ? 'success' : 'error');
      if (ok) {
        setState(s => ({ ...s, saving: false, expireTarget: null }));
        syncNovedades();
      } else {
        console.warn('[confirmExpire] Mensaje NO contiene "OK", no se refresca la lista');
        setState(s => ({ ...s, saving: false }));
      }
    } catch (err) {
      console.error('[confirmExpire] CATCH:', err);
      const msg = err instanceof Error ? err.message : 'Error al caducar';
      showToast(msg, 'error');
      setState(s => ({ ...s, saving: false }));
    }
  }, [state.expireTarget, showToast, syncNovedades]);

  // -----------------------------------------------------------------------
  // Import
  // -----------------------------------------------------------------------
  const openImport = useCallback(async () => {
    setState(s => ({ ...s, importFormatLoading: true }));
    try {
      const formatos = await getFormatosUpload(state.filters.EmpKey, 'ListaTransformacionesPOS');
      const options = formatos.map(f => ({ 
        value: f.Id || '', 
        label: f.Descripcion || 'Formato sin descripción' 
      }));

      setState(s => ({
        ...s,
        importFormatOptions: options,
        importOpen: true,
        importFormatLoading: false
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar los formatos de importación';
      showToast(msg, 'error');
      setState(s => ({ ...s, importFormatLoading: false }));
    }
  }, [state.filters.EmpKey, showToast]);

  const closeImport = useCallback(() => {
    setState(s => ({ ...s, importOpen: false }));
  }, []);

  const doImport = useCallback(async (format: string, _fileName: string, file: File) => {
    setState(s => ({ ...s, saving: true }));
    try {
      // Two-step nativo: POST /gxobject → POST /UploadPreciosNativo
      const result = await uploadPreciosNativo(state.filters.EmpKey, format, file);
      const ok = result.Mensaje?.toLowerCase().includes('ok');
      showToast(result.Mensaje || 'Importado', ok ? 'success' : 'error');
      setState(s => ({ ...s, saving: false, importOpen: !ok }));
      if (ok) fetchPrecios();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al importar';
      showToast(msg, 'error');
      setState(s => ({ ...s, saving: false }));
    }
  }, [state.filters.EmpKey, showToast, fetchPrecios]);

  // -----------------------------------------------------------------------
  // New precio (opens drawer in search mode)
  // -----------------------------------------------------------------------
  const openNew = useCallback(() => {
    setState(s => ({
      ...s,
      editingPrecio: null,
      editingBC: null,
      drawerOpen: true,
      editLoading: false,
      isNewMode: true,
      selectedProduct: null,
    }));
  }, []);

  const selectProductForNew = useCallback((producto: ProductoSearchSDT) => {
    setState(s => ({ ...s, selectedProduct: producto }));
  }, []);

  const clearSelectedProduct = useCallback(() => {
    setState(s => ({ ...s, selectedProduct: null }));
  }, []);

  const createNewPrecio = useCallback(async (precioValor: number, ubiCod: string) => {
    const product = state.selectedProduct;
    if (!product) return;
    setState(s => ({ ...s, saving: true }));
    try {
      const result = await apiCrearPrecioNuevo(
        state.filters.EmpKey,
        product.ProductoKey,
        ubiCod,
        precioValor,
      );
      const ok = result.Mensaje?.toLowerCase().includes('ok');
      showToast(result.Mensaje || 'Creado', ok ? 'success' : 'error');
      setState(s => ({ ...s, saving: false, drawerOpen: !ok, isNewMode: !ok, selectedProduct: ok ? null : s.selectedProduct }));
      if (ok) fetchPrecios();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear precio';
      showToast(msg, 'error');
      setState(s => ({ ...s, saving: false }));
    }
  }, [state.selectedProduct, state.filters.EmpKey, showToast, fetchPrecios]);

  return {
    ...state,
    fetchPrecios,
    setFilters,
    setSearchText,
    clearFilters,
    setPage,
    setPageSize,
    toggleSort,
    openEdit,
    closeDrawer,
    savePrecio,
    openExpire,
    closeExpire,
    confirmExpire,
    openImport,
    closeImport,
    doImport,
    selectProductForNew,
    clearSelectedProduct,
    createNewPrecio,
    openNew,
    syncNovedades,
  };
}
