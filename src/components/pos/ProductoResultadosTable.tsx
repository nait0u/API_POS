import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Fila normalizada — unifica los resultados del buscador general
 * (GxSelectorProductoGeneralItem) y de la Carta (GxProductoTouch), que
 * traen shapes distintos pero representan la misma unidad visual de fila.
 */
export interface ProductoResultadoRow {
  key: string | number;
  codigo: string;
  descripcion: string;
  /** ⚠️ Ya viene formateado por GeneXus (precioPicture/productoPrecios) — renderizar tal cual, nunca reformatear */
  precio: string;
  stock: number | null;
  vendeLote: boolean;
}

interface ProductoResultadosTableProps {
  rows: ProductoResultadoRow[];
  onAgregar: (row: ProductoResultadoRow) => void;
  onVerDetalle: (row: ProductoResultadoRow) => void;
}

/**
 * Grilla unificada de resultados de producto — columnas estrictas:
 * Código | Descripción | Precio | Stock | Acciones.
 * La fila completa agrega el producto al carrito (Etapa 8); el botón de
 * detalle detiene la propagación para abrir el modal sin afectar el carro.
 */
export function ProductoResultadosTable({ rows, onAgregar, onVerDetalle }: ProductoResultadosTableProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="bg-primary sticky top-0 z-10">
          {[
            { label: 'Código',      align: 'left',   w: 110 },
            { label: 'Descripción', align: 'left',   w: undefined },
            { label: 'Precio',      align: 'right',  w: 110 },
            { label: 'Stock',       align: 'right',  w: 84  },
            { label: '',            align: 'center', w: 56  },
          ].map((col, i) => (
            <th
              key={i}
              style={{ width: col.w, textAlign: col.align as 'left' | 'right' | 'center' }}
              className="px-2.5 py-2 text-[0.68rem] font-bold uppercase tracking-[0.07em] text-primary-foreground whitespace-nowrap"
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.key}
            role="row"
            tabIndex={0}
            onClick={() => onAgregar(row)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onAgregar(row);
              }
            }}
            aria-label={`Agregar ${row.descripcion} al carrito`}
            className="border-b border-border/20 cursor-pointer hover:bg-muted/40 focus:outline-none focus:bg-muted/60 focus:ring-2 focus:ring-inset focus:ring-ring/40 transition-colors"
          >
            <td className="px-2.5 py-2 font-mono text-base text-foreground whitespace-nowrap">
              {row.codigo}
            </td>
            <td className="px-2.5 py-2 text-base text-foreground font-medium">
              {row.descripcion}
            </td>
            <td className="px-2.5 py-2 text-right font-tabular font-semibold text-foreground whitespace-nowrap">
              {row.precio}
            </td>
            <td
              className={cn(
                'px-2.5 py-2 text-right font-tabular text-sm whitespace-nowrap',
                row.stock == null
                  ? 'text-muted-foreground'
                  : row.stock < 0
                    ? 'text-destructive'
                    : row.stock < 10
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-[hsl(var(--pos-success-text))]',
              )}
            >
              {row.stock == null ? '—' : row.stock.toLocaleString('es-CL')}
            </td>
            <td className="px-2.5 py-2 text-center">
              <button
                type="button"
                aria-label={`Ver detalle de ${row.descripcion}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onVerDetalle(row);
                }}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all focus:outline-none focus:ring-2 focus:ring-ring/20"
              >
                <Info size={14} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
