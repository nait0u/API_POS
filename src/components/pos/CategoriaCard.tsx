import { cn } from '@/lib/utils';
import type { GxCategoriaItem } from '@/types/ventas';

interface CategoriaCardProps {
  categoria: GxCategoriaItem;
  isActive: boolean;
  onClick: (catCod: string) => void;
}

export function CategoriaCard({ categoria, isActive, onClick }: CategoriaCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(categoria.CatCod)}
      aria-pressed={isActive}
      className={cn(
        'w-full text-left px-4 py-3 rounded-lg border font-medium text-sm transition-all',
        'min-h-[44px] active:scale-[0.98]',
        'focus:outline-none focus:ring-4 focus:ring-ring/20',
        isActive
          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
          : 'bg-card text-foreground border-border hover:bg-accent hover:border-ring/50',
      )}
    >
      {categoria.CatNom}
    </button>
  );
}
