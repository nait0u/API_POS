// ---------------------------------------------------------------------------
// Balanza — websocket del BFF (namespace /balanza)
// ---------------------------------------------------------------------------
// Scaffolding intencionalmente NO conectado a ninguna vista todavía — no hay
// hardware de balanza disponible para validar end-to-end en esta sesión.
// Conectar desde una vista explícitamente (ver docs/INTEGRACION_XVENTA.md).
// ---------------------------------------------------------------------------

import { io, type Socket } from 'socket.io-client';
import type { DeltaCarritoResponseDto } from '@/types/carrito';

const BALANZA_WS_URL = import.meta.env.VITE_BALANZA_WS_URL ?? 'http://localhost:3000';

export interface RegistrarContextoPayload {
  empKey: number;
  puntoAccesoKey: number;
  dispositivoId: string;
  perfil: string;
  notaVentaKey: number;
}

export interface BalanzaErrorPayload {
  mensaje: string;
}

let socket: Socket | null = null;

/** Abre la conexión al namespace /balanza. Idempotente si ya hay una conexión activa. */
export function connectBalanza(): Socket {
  if (socket) return socket;
  socket = io(`${BALANZA_WS_URL}/balanza`, { transports: ['websocket'] });
  return socket;
}

export function disconnectBalanza(): void {
  socket?.disconnect();
  socket = null;
}

export function registrarContexto(payload: RegistrarContextoPayload): void {
  socket?.emit('registrar-contexto', payload);
}

export function onCarritoActualizado(handler: (payload: DeltaCarritoResponseDto) => void): () => void {
  socket?.on('carrito-actualizado', handler);
  return () => socket?.off('carrito-actualizado', handler);
}

export function onBalanzaError(handler: (payload: BalanzaErrorPayload) => void): () => void {
  socket?.on('balanza-error', handler);
  return () => socket?.off('balanza-error', handler);
}
