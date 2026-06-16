import { useContext } from 'react';
import { ProfileContext, type ProfileContextState } from './ProfileContext';

export function useProfileContext(): ProfileContextState {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfileContext must be used inside ProfileProvider');
  return ctx;
}
