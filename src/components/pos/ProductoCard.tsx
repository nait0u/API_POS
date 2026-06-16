import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GxProductoTouch } from '@/types/ventas';

interface ProductoCardProps {
  producto: GxProductoTouch;
  onAdd: (producto: GxProductoTouch) => void;
}

export function ProductoCard({ producto, onAdd }: ProductoCardProps) {
  const stockClass =
    producto.ProductoStock < 0
      ? 'text-destructive'
      : producto.ProductoStock < 10
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-green-600 dark:text-green-400';

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/40 hover:bg-accent/40 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate leading-snug">
          {producto.ProductoDescripcion}
        </p>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">
          {producto.ProductoCodigo}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-foreground font-mono">
          {producto.ProductoPrecios}
        </p>
        <p className={cn('text-xs font-mono mt-0.5', stockClass)}>
          Stock: {producto.ProductoStock}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onAdd(producto)}
        aria-label={`Agregar ${producto.ProductoDescripcion}`}
        className={cn(
          'shrink-0 w-11 h-11 flex items-center justify-center rounded-lg',
          'border border-border bg-muted text-muted-foreground',
          'hover:bg-primary hover:text-primary-foreground hover:border-primary',
          'transition-all focus:outline-none focus:ring-4 focus:ring-ring/20',
        )}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
