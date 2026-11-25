import Storage from 'expo-sqlite/kv-store';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'tr' | 'en';
export type TutorialMechanic = 'boulders' | 'checkpoints' | 'oneWay';

type SettingsData = {
  language: Language;
  musicEnabled: boolean;
  effectsEnabled: boolean;
  seenMechanics: Record<TutorialMechanic, boolean>;
};

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

export function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<SettingsData>(defaults);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Storage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        const saved = JSON.parse(stored) as Partial<SettingsData>;
        setSettings({ ...defaults, ...saved, seenMechanics: { ...defaults.seenMechanics, ...saved.seenMechanics } });
      })
      .catch(() => setSettings(defaults))
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((changes: Partial<SettingsData>) => {
    setSettings((current) => {
      const next = { ...current, ...changes };
      void Storage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    ...settings,
    ready,
    setLanguage: (language: Language) => update({ language }),
    setMusicEnabled: (musicEnabled: boolean) => update({ musicEnabled }),
    setEffectsEnabled: (effectsEnabled: boolean) => update({ effectsEnabled }),
    markMechanicSeen: (mechanic: TutorialMechanic) => update({ seenMechanics: { ...settings.seenMechanics, [mechanic]: true } }),
  }), [ready, settings, update]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside SettingsProvider');
  return value;
}
