import { useState, useCallback, useEffect, useRef } from 'react';
import type { SDTPrecios, FiltroPrecios, PaginationState, SortState, PrecioPK, ProductoSearchSDT, UbicacionItem } from '../types/precios';
import { getPrecios, getBCPrecio, putBCPrecio, caducarPrecio as apiCaducarPrecio, uploadPreciosNativo, crearPrecioNuevo as apiCrearPrecioNuevo, getUbicaciones as apiGetUbicaciones, ApiError } from '../services/apiClient';

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
  saving: boolean;
  toast: { message: string; type: 'success' | 'error' } | null;

  // Ubicaciones
  ubicaciones: UbicacionItem[];
}

const DEFAULT_EMP_KEY = 1008;

const initialFilters: FiltroPrecios = {
  EmpKey: DEFAULT_EMP_KEY,
  CodIntValor: '',
  ProductoDescripcion: '',
  Ubicacion: '',
  CategoriaPrecioIdl: '',
  FechaFiltro: new Date().toISOString().slice(0, 10),
};

export function usePrecios() {
  const [state, setState] = useState<PreciosState>({
    allItems: [],
    filteredItems: [],
    displayItems: [],
    totalCount: 0,
    lastTimeStamp: null,
    loading: false,
    error: null,
    errorStatus: null,
    filters: { ...initialFilters },
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
    saving: false,
    toast: null,
    ubicaciones: [],
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
        const searched = applySearch(items, s.searchText);
        const paged = applyClientSortAndPage(searched, s.sort, { ...s.pagination, page: 1 });
        return {
          ...s,
          allItems: items,
          ...paged,
          totalCount: items.length,
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
  }, [state.filters, applySearch, applyClientSortAndPage]);

  // Initial fetch
  const hasFetched = useRef(false);
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchPrecios();
      // Also fetch ubicaciones
      apiGetUbicaciones(initialFilters.EmpKey)
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
      const searched = applySearch(s.allItems, text);
      const paged = applyClientSortAndPage(searched, s.sort, { ...s.pagination, page: 1 });
      return { ...s, searchText: text, ...paged };
    });
  }, [applySearch, applyClientSortAndPage]);

  const clearFilters = useCallback(() => {
    const cleared = { ...initialFilters };
    setState(s => ({ ...s, filters: cleared, searchText: '' }));
    fetchPrecios(cleared);
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
      showToast(result.Mensaje || 'Guardado', result.Mensaje?.includes('OK') ? 'success' : 'error');
      setState(s => ({ ...s, saving: false, drawerOpen: false }));
      fetchPrecios();
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
    if (!target) return;
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
      const result = await apiCaducarPrecio(pk);
      showToast(result.Mensaje || 'Caducado', result.Mensaje?.includes('OK') ? 'success' : 'error');
      setState(s => ({ ...s, saving: false, expireTarget: null }));
      fetchPrecios();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al caducar';
      showToast(msg, 'error');
      setState(s => ({ ...s, saving: false }));
    }
  }, [state.expireTarget, showToast, fetchPrecios]);

  // -----------------------------------------------------------------------
  // Import
  // -----------------------------------------------------------------------
  const openImport = useCallback(() => {
    setState(s => ({ ...s, importOpen: true }));
  }, []);

  const closeImport = useCallback(() => {
    setState(s => ({ ...s, importOpen: false }));
  }, []);

  const doImport = useCallback(async (format: string, _fileName: string, file: File) => {
    setState(s => ({ ...s, saving: true }));
    try {
      // Two-step nativo: POST /gxobject → POST /UploadPreciosNativo
      const result = await uploadPreciosNativo(state.filters.EmpKey, format, file);
      const ok = result.Mensaje?.includes('OK');
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
      const ok = result.Mensaje?.includes('OK');
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
  };
}
