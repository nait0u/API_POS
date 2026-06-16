// @refresh reset
import { createContext, useState, useMemo, type ReactNode } from 'react';
import { setProfileHeaders } from '@/services/apiClient';

export type ProfileId = 'jaime' | 'constanza';

export interface Profile {
  id: ProfileId;
  shortLabel: string;
  name: string;
  rut: string;
  perfil: string;
  esCaja: boolean;
  posUser: string;
}

export const PROFILES: Record<ProfileId, Profile> = {
  jaime: {
    id: 'jaime',
    shortLabel: 'Jaime (Cajero)',
    name: 'Jaime Medalla Astete',
    rut: '20613830',
    perfil: 'CAJERAADMINISTRATIVA',
    esCaja: true,
    posUser:
      'eyJydXQiOiIyMDYxMzgzMCIsInJ1dER2IjoiMjA2MTM4MzAwIiwibm9tYnJlIjoiSmFpbWUgTWVkYWxsYSBBc3RldGUiLCJwZXJmaWwiOiJDQUpFUkFBRE1JTklTVFJBVElWQSIsInBlcmZpbERlc2MiOiJDQUpFUkEgQURNSU5JU1RSQVRJVkEiLCJtYW5kYW50ZSI6Ijc2NDA3OTMwIiwicnV0RW1wcmVzYSI6IjUwMDAwMDAyMyIsInN1Y3Vyc2FsIjoiTG9jYWwxIiwiZXNDYWphIjp0cnVlfQ==',
  },
  constanza: {
    id: 'constanza',
    shortLabel: 'Constanza (Admin)',
    name: 'CONSTANZA PALOMO MIRANDA',
    rut: '18373061',
    perfil: 'posadmcert',
    esCaja: false,
    posUser:
      'eyJydXQiOiIxODM3MzA2MSIsInJ1dER2IjoiMTgzNzMwNjE0Iiwibm9tYnJlIjoiQ09OU1RBTlpBIFBBTE9NTyBNSVJBTkRBIiwicGVyZmlsIjoicG9zYWRtY2VydCIsInBlcmZpbERlc2MiOiJQT1MgQWRtaW5pc3RyYWRvciBDZXJ0aWZpY2Fkb3IiLCJtYW5kYW50ZSI6Ijc2NDA3OTMwIiwicnV0RW1wcmVzYSI6IjUwMDAwMDAyMyIsInN1Y3Vyc2FsIjoiIiwiZXNDYWphIjpmYWxzZX0=',
  },
};

const DEV_STATIC_HEADERS: Record<string, string> = {
  'x-pos-emp-key': '1008',
  'x-pos-punto-acceso-key': '2',
  'x-pos-punto-acceso-desc': 'MC Tur Sin Inv Loc 1',
  'x-pos-estacion-turno-idl': 'CAJA1',
  'x-pos-turno-caja-key': '87',
  'x-pos-vendedor-key': '5',
  'x-pos-modo': 'NotaVenta',
};

export function buildProfileHeaders(profile: Profile): Record<string, string> {
  return {
    ...DEV_STATIC_HEADERS,
    'x-pos-user': profile.posUser,
    'x-pos-estacion-es-caja': profile.esCaja ? 'true' : 'false',
  };
}

export interface ProfileContextState {
  activeProfile: Profile;
  setActiveProfile: (id: ProfileId) => void;
  getHeaders: () => Record<string, string>;
}

export const ProfileContext = createContext<ProfileContextState | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfileId, setActiveProfileId] = useState<ProfileId>('constanza');

  // Sync headers during render so they're always current before child effects run.
  // useEffect runs bottom-up (children first), so an effect-only approach would
  // cause PosStateContext.refresh() to read stale headers after a profile switch.
  setProfileHeaders(buildProfileHeaders(PROFILES[activeProfileId]));

  const value = useMemo<ProfileContextState>(
    () => ({
      activeProfile: PROFILES[activeProfileId],
      setActiveProfile: setActiveProfileId,
      getHeaders: () => buildProfileHeaders(PROFILES[activeProfileId]),
    }),
    [activeProfileId],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
