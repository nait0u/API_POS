import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Inicia el temporizador
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Si el valor cambia antes de que termine el delay, se limpia el temporizador anterior
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}