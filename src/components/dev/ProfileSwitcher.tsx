import { User, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PROFILES, type ProfileId } from '@/context/ProfileContext';
import { useProfileContext } from '@/context/useProfileContext';

export function ProfileSwitcher() {
  const { activeProfile, setActiveProfile } = useProfileContext();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground shrink-0">Perfil activo:</span>

          {(Object.keys(PROFILES) as ProfileId[]).map((id) => {
            const profile = PROFILES[id];
            const isActive = activeProfile.id === id;
            const Icon = profile.esCaja ? User : Briefcase;
            return (
              <Button
                key={id}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveProfile(id)}
                aria-pressed={isActive}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {profile.shortLabel}
              </Button>
            );
          })}

          <span className="ml-auto text-xs font-mono text-muted-foreground shrink-0">
            DispositivoId: DEV-{activeProfile.rut}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-6 text-xs text-muted-foreground border-t border-border pt-2">
          <span>
            Nombre:{' '}
            <span className="font-medium text-foreground">{activeProfile.name}</span>
          </span>
          <span>
            Perfil:{' '}
            <span className="font-medium text-foreground">{activeProfile.perfil}</span>
          </span>
          <span>
            esCaja:{' '}
            <span
              className={
                activeProfile.esCaja
                  ? 'font-medium text-success'
                  : 'font-medium text-muted-foreground'
              }
            >
              {activeProfile.esCaja ? 'true' : 'false'}
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
