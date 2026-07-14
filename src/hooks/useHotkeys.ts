import { useEffect, useRef } from 'react';

export type HotkeyHandler = (event: KeyboardEvent) => void;
export type HotkeyMap = Record<string, HotkeyHandler>;

/**
 * Captura teclas globales (ej. F1-F12) vía un listener en window y ejecuta
 * el handler correspondiente. Siempre invoca preventDefault() sobre las
 * teclas mapeadas para evitar comportamientos nativos del navegador
 * (ej. F3 abre la búsqueda del navegador).
 */
export function useHotkeys(map: HotkeyMap, enabled = true) {
  const mapRef = useRef(map);

  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      const handler = mapRef.current[event.key];
      if (!handler) return;
      event.preventDefault();
      handler(event);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}
