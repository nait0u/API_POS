import { create } from 'zustand';
import { getCategoriasMenu, getCartaTouch } from '@/services/apiClient';
import type { GxCategoriaItem, GxGrupoTouch } from '@/types/ventas';

// Clave especial para la carta completa (sin filtro de categoría)
const CARTA_FULL_KEY = '__full__';

interface PosCatalogState {
  // ── Categorías ────────────────────────────────────────────────────────────
  colBuscadoras: GxCategoriaItem[];       // inputs de filtro dinámicos
  colClasificadoras: GxCategoriaItem[];   // chips de categoría
  syncTimeStamp: string | undefined;      // guard: evita re-fetch si ya hay datos
  isLoadingCategorias: boolean;
  errorCategorias: string | null;

  // ── Filtros dinámicos (uno por cada ColBuscadoras) ────────────────────────
  filtrosBuscadoras: Record<string, string>; // CatCod → valor digitado

  // ── Selector táctil ───────────────────────────────────────────────────────
  categoriaActiva: string | undefined;
  // Cache: CatCod → grupos, CARTA_FULL_KEY → carta completa
  gruposPorCategoria: Record<string, GxGrupoTouch[]>;
  isLoadingCarta: boolean;
  errorCarta: string | null;

  // ── Acciones ──────────────────────────────────────────────────────────────
  fetchCategorias: () => Promise<void>;
  forceFetchCategorias: () => Promise<void>;
  fetchCarta: (categoriaId?: string) => Promise<void>;
  setCategoriaActiva: (cod: string | undefined) => void;
  setFiltroBuscadora: (catCod: string, value: string) => void;
  resetFiltros: () => void;
}

export const usePosCatalogStore = create<PosCatalogState>((set, get) => ({
  colBuscadoras: [],
  colClasificadoras: [],
  syncTimeStamp: undefined,
  isLoadingCategorias: false,
  errorCategorias: null,

  filtrosBuscadoras: {},

  categoriaActiva: undefined,
  gruposPorCategoria: {},
  isLoadingCarta: false,
  errorCarta: null,

  // ── fetchCategorias — respeta el cache (SyncTimeStamp) ───────────────────
  fetchCategorias: async () => {
    // Si ya tenemos datos vigentes, no volvemos a pedir al BFF
    if (get().syncTimeStamp) return;
    return get().forceFetchCategorias();
  },

  // ── forceFetchCategorias — ignora el cache ────────────────────────────────
  forceFetchCategorias: async () => {
    set({ isLoadingCategorias: true, errorCategorias: null });
    try {
      const res = await getCategoriasMenu();
      const buscadoras = res.ColBuscadoras ?? [];
      set({
        colBuscadoras: buscadoras,
        colClasificadoras: res.ColClasificadoras ?? [],
        syncTimeStamp: res.SyncTimeStamp,
        // Inicializa entradas vacías para cada buscadora (preserva valores previos)
        filtrosBuscadoras: buscadoras.reduce<Record<string, string>>((acc, b) => {
          acc[b.CatCod] = get().filtrosBuscadoras[b.CatCod] ?? '';
          return acc;
        }, {}),
      });
    } catch (err) {
      set({ errorCategorias: err instanceof Error ? err.message : 'Error al cargar categorías' });
    } finally {
      set({ isLoadingCategorias: false });
    }
  },

  // ── fetchCarta — usa cache por CatCod (o CARTA_FULL_KEY para la carta completa) ──
  fetchCarta: async (categoriaId?: string) => {
    const key = categoriaId ?? CARTA_FULL_KEY;
    // Ya está en cache
    if (get().gruposPorCategoria[key]) return;

    set({ isLoadingCarta: true, errorCarta: null });
    try {
      const res = await getCartaTouch(categoriaId);
      set((state) => ({
        gruposPorCategoria: {
          ...state.gruposPorCategoria,
          [key]: res.cartaGrupos ?? [],
        },
      }));
    } catch (err) {
      set({ errorCarta: err instanceof Error ? err.message : 'Error al cargar la carta' });
    } finally {
      set({ isLoadingCarta: false });
    }
  },

  setCategoriaActiva: (cod) => set({ categoriaActiva: cod }),

  setFiltroBuscadora: (catCod, value) =>
    set((state) => ({
      filtrosBuscadoras: { ...state.filtrosBuscadoras, [catCod]: value },
    })),

  resetFiltros: () =>
    set((state) => ({
      filtrosBuscadoras: Object.fromEntries(
        Object.keys(state.filtrosBuscadoras).map((k) => [k, '']),
      ),
    })),
}));
