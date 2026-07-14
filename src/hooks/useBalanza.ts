import { useCallback, useEffect, useRef, useState } from 'react';
import {
  connectBalanza,
  disconnectBalanza,
  registrarContexto,
  onCarritoActualizado,
  onBalanzaError,
  type RegistrarContextoPayload,
} from '@/services/balanzaSocket';
import { usePosVentaStore } from '@/store/posVentaStore';
import type { DeltaCarritoResponseDto } from '@/types/carrito';

// No conectado por defecto en ninguna vista — ver nota de scaffolding en
// balanzaSocket.ts. Una vista debe llamar explícitamente a `connect()`.

export interface UseBalanzaReturn {
  ultimoError: string | null;
  connect: (contexto: RegistrarContextoPayload) => void;
  disconnect: () => void;
}

export function useBalanza(): UseBalanzaReturn {
  const [ultimoError, setUltimoError] = useState<string | null>(null);
  const mergeCarrito = usePosVentaStore((s) => s.mergeCarrito);
  const setTotalesData = usePosVentaStore((s) => s.setTotalesData);
  const cleanupRef = useRef<(() => void) | null>(null);

  const applyDelta = useCallback(
    (delta: DeltaCarritoResponseDto) => {
      mergeCarrito(delta.carrito);
      setTotalesData(delta.totales);
    },
    [mergeCarrito, setTotalesData],
  );

  const disconnect = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    disconnectBalanza();
  }, []);

  const connect = useCallback(
    (contexto: RegistrarContextoPayload) => {
      connectBalanza();
      registrarContexto(contexto);
      const offCarrito = onCarritoActualizado(applyDelta);
      const offError = onBalanzaError((payload) => setUltimoError(payload.mensaje));
      cleanupRef.current = () => {
        offCarrito();
        offError();
      };
    },
    [applyDelta],
  );

  useEffect(() => () => disconnect(), [disconnect]);

  return { ultimoError, connect, disconnect };
}
