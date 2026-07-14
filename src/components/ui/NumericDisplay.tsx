import { cn } from '@/lib/utils';

interface NumericDisplayProps {
  value: number | string;
  currency?: string;
  className?: string;
}

const formatter = new Intl.NumberFormat('es-CL', {
  style: 'decimal',
  minimumFractionDigits: 2,
});

export function NumericDisplay({ value, currency = '$', className }: NumericDisplayProps) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  const formatted = isNaN(num) ? '—' : formatter.format(num);

  return (
    <span className={cn('font-tabular', className)}>
      {isNaN(num) ? '—' : `${currency}${formatted}`}
    </span>
  );
}
