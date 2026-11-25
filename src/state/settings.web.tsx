import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';

export type Language = 'tr' | 'en';
export type TutorialMechanic = 'boulders' | 'checkpoints' | 'oneWay';

type SettingsData = { language: Language; musicEnabled: boolean; effectsEnabled: boolean; seenMechanics: Record<TutorialMechanic, boolean> };
type SettingsContextValue = SettingsData & {
  ready: boolean;
  setLanguage: (language: Language) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setEffectsEnabled: (enabled: boolean) => void;
  markMechanicSeen: (mechanic: TutorialMechanic) => void;
};

const STORAGE_KEY = 'canyon-bridge-settings-v1';
const defaults: SettingsData = {
  language: 'tr', musicEnabled: true, effectsEnabled: true,
  seenMechanics: { boulders: false, checkpoints: false, oneWay: false },
};
const SettingsContext = createContext<SettingsContextValue | null>(null);

function loadSettings() {
  if (typeof window === 'undefined') return defaults;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaults;
    const parsed = JSON.parse(saved) as Partial<SettingsData>;
    return { ...defaults, ...parsed, seenMechanics: { ...defaults.seenMechanics, ...parsed.seenMechanics } };
  } catch {
    return defaults;
  }
}

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<SettingsData>(loadSettings);
  const update = useCallback((changes: Partial<SettingsData>) => {
    setSettings((current) => {
      const next = { ...current, ...changes };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);
  const value = useMemo(() => ({
    ...settings,
    ready: true,
    setLanguage: (language: Language) => update({ language }),
    setMusicEnabled: (musicEnabled: boolean) => update({ musicEnabled }),
    setEffectsEnabled: (effectsEnabled: boolean) => update({ effectsEnabled }),
    markMechanicSeen: (mechanic: TutorialMechanic) => update({ seenMechanics: { ...settings.seenMechanics, [mechanic]: true } }),
  }), [settings, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside SettingsProvider');
  return value;
}
