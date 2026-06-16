import { useContext } from 'react';
import { AppContext } from './AppContext';
import type { AppContextState, AppParameters, DeviceInfo } from './AppContext';

export function useAppContext(): AppContextState {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext debe usarse dentro de un <AppProvider>');
  }
  return ctx;
}

export function useDeviceInfo(): DeviceInfo {
  const { deviceInfo, status } = useAppContext();
  if (status !== 'ready' || !deviceInfo) {
    throw new Error(
      'useDeviceInfo() invocado antes de que el contexto esté listo. ' +
        'Asegúrate de renderizar el árbol de negocio sólo cuando status === "ready".',
    );
  }
  return deviceInfo;
}

export function useAppParameters(): AppParameters {
  const { parameters, status } = useAppContext();
  if (status !== 'ready' || !parameters) {
    throw new Error(
      'useAppParameters() invocado antes de que el contexto esté listo.',
    );
  }
  return parameters;
}
