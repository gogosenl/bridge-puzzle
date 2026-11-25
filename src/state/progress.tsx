import Storage from 'expo-sqlite/kv-store';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export const HINT_COST = 2;
export const LAYER_UNLOCK_COSTS = [0, 0, 55, 60, 60, 60, 60, 60, 60, 60, 60] as const;
const LAYER_SIZE = 50;
const LAYER_COMPLETION_BONUS = 10;
export type LevelRewards = { hintCoins: number; layerCoins: number };
type ProgressData = { unlockedLevel: number; unlockedLayer: number; stars: Record<string, number>; hintCoins: number; layerCoins: number; rewardedLevels: Record<string, boolean>; layerBonuses: Record<string, boolean> };
type ProgressContextValue = ProgressData & { ready: boolean; completeLevel: (level: number, stars: number) => Promise<LevelRewards>; spendHint: () => Promise<boolean>; unlockLayer: (layer: number) => Promise<boolean>; resetProgress: () => Promise<void> };
const STORAGE_KEY = 'canyon-bridge-progress-v1';
const initialProgress: ProgressData = { unlockedLevel: 1, unlockedLayer: 1, stars: {}, hintCoins: 5, layerCoins: 0, rewardedLevels: {}, layerBonuses: {} };
const ProgressContext = createContext<ProgressContextValue | null>(null);

function normalizeProgress(value: Partial<ProgressData>): ProgressData {
  const stars = value.stars ?? {};
  const layerBonuses = { ...(value.layerBonuses ?? {}) };
  let layerCoins = Math.max(0, value.layerCoins ?? 0);
  let highestEligibleLayer = 1;

  for (let layer = 1; layer < 10; layer += 1) {
    const layerEndKey = String(layer * LAYER_SIZE);
    if ((stars[layerEndKey] ?? 0) <= 0) break;
    highestEligibleLayer = layer + 1;
    if (!layerBonuses[layerEndKey]) {
      layerBonuses[layerEndKey] = true;
      layerCoins += LAYER_COMPLETION_BONUS;
    }
  }

  const storedLayer = Math.max(1, Math.min(10, value.unlockedLayer ?? 1));
  const unlockedLayer = Math.min(storedLayer, highestEligibleLayer);
  const layerCap = Math.min(500, unlockedLayer * LAYER_SIZE);
  let unlockedLevel = 1;
  while (unlockedLevel < layerCap && (stars[String(unlockedLevel)] ?? 0) > 0) unlockedLevel += 1;

  return { ...initialProgress, ...value, unlockedLevel, unlockedLayer, stars, layerCoins, rewardedLevels: value.rewardedLevels ?? {}, layerBonuses };
}

export function ProgressProvider({ children }: PropsWithChildren) {
  const [progress, setProgress] = useState<ProgressData>(initialProgress);
  const progressRef = useRef<ProgressData>(initialProgress);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Storage.getItem(STORAGE_KEY).then((stored) => {
      const loaded = stored ? normalizeProgress(JSON.parse(stored) as Partial<ProgressData>) : initialProgress;
      progressRef.current = loaded;
      setProgress(loaded);
    }).catch(() => { progressRef.current = initialProgress; setProgress(initialProgress); }).finally(() => setReady(true));
  }, []);
  const update = useCallback((updater: (current: ProgressData) => ProgressData) => {
    const next = updater(progressRef.current);
    progressRef.current = next;
    setProgress(next);
    void Storage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);
  const completeLevel = useCallback(async (level: number, stars: number) => {
    let rewards: LevelRewards = { hintCoins: 0, layerCoins: 0 };
    update((current) => {
      const key = String(level);
      const firstReward = level <= current.unlockedLevel && !current.rewardedLevels[key];
      const layerComplete = firstReward && level < 500 && level % LAYER_SIZE === 0 && !current.layerBonuses[key];
      rewards = firstReward
        ? { hintCoins: stars === 3 ? 2 : 1, layerCoins: 1 + (layerComplete ? LAYER_COMPLETION_BONUS : 0) }
        : { hintCoins: 0, layerCoins: 0 };
      const canAdvance = level === current.unlockedLevel;
      return {
        ...current,
        unlockedLevel: canAdvance ? Math.min(500, current.unlockedLayer * LAYER_SIZE, level + 1) : current.unlockedLevel,
        stars: { ...current.stars, [key]: Math.max(current.stars[key] ?? 0, stars) },
        hintCoins: current.hintCoins + rewards.hintCoins,
        layerCoins: current.layerCoins + rewards.layerCoins,
        rewardedLevels: firstReward ? { ...current.rewardedLevels, [key]: true } : current.rewardedLevels,
        layerBonuses: layerComplete ? { ...current.layerBonuses, [key]: true } : current.layerBonuses,
      };
    });
    return rewards;
  }, [update]);
  const spendHint = useCallback(async () => { let success = false; update((current) => { if (current.hintCoins < HINT_COST) return current; success = true; return { ...current, hintCoins: current.hintCoins - HINT_COST }; }); return success; }, [update]);
  const unlockLayer = useCallback(async (layer: number) => { let success = false; update((current) => { const cost = LAYER_UNLOCK_COSTS[layer] ?? Number.POSITIVE_INFINITY; const previousLayerEnd = (layer - 1) * LAYER_SIZE; const previousLayerComplete = (current.stars[String(previousLayerEnd)] ?? 0) > 0; if (layer !== current.unlockedLayer + 1 || !previousLayerComplete || current.layerCoins < cost) return current; success = true; return { ...current, unlockedLayer: layer, unlockedLevel: Math.max(current.unlockedLevel, previousLayerEnd + 1), layerCoins: current.layerCoins - cost }; }); return success; }, [update]);
  const resetProgress = useCallback(async () => { progressRef.current = initialProgress; setProgress(initialProgress); await Storage.setItem(STORAGE_KEY, JSON.stringify(initialProgress)); }, []);
  const value = useMemo(() => ({ ...progress, ready, completeLevel, spendHint, unlockLayer, resetProgress }), [completeLevel, progress, ready, resetProgress, spendHint, unlockLayer]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
export function useProgress() { const value = useContext(ProgressContext); if (!value) throw new Error('useProgress must be used inside ProgressProvider'); return value; }
