import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo } from 'react';
import { AppState, Platform } from 'react-native';

import { useSettings } from '@/state/settings';

type SoundName = 'tap' | 'place' | 'remove' | 'connect' | 'success' | 'star' | 'whoosh';
type AudioContextValue = { play: (sound: SoundName) => void };
const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: PropsWithChildren) {
  const { musicEnabled, effectsEnabled, ready } = useSettings();
  const music = useAudioPlayer(require('../../assets/audio/ambient-loop.wav'));
  const tap = useAudioPlayer(require('../../assets/audio/tap.wav'));
  const place = useAudioPlayer(require('../../assets/audio/place.wav'));
  const remove = useAudioPlayer(require('../../assets/audio/remove.wav'));
  const connect = useAudioPlayer(require('../../assets/audio/connect.wav'));
  const success = useAudioPlayer(require('../../assets/audio/success.wav'));
  const star = useAudioPlayer(require('../../assets/audio/star.wav'));
  const whoosh = useAudioPlayer(require('../../assets/audio/whoosh.wav'));

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      allowsRecording: false,
      allowsBackgroundRecording: false,
      shouldPlayInBackground: false,
    });
    // expo-audio exposes looping as a mutable native player property.
    // eslint-disable-next-line react-hooks/immutability
    music.loop = true;
  }, [connect, music, place, remove, star, success, tap, whoosh]);

  useEffect(() => {
    if (!ready) return;
    const syncMusic = (appState = AppState.currentState) => {
      if (musicEnabled && Platform.OS !== 'web' && appState === 'active') music.play();
      else music.pause();
    };
    syncMusic();
    const subscription = AppState.addEventListener('change', syncMusic);
    return () => subscription.remove();
  }, [musicEnabled, music, ready]);

  const players = useMemo(() => ({ tap, place, remove, connect, success, star, whoosh }), [connect, place, remove, star, success, tap, whoosh]);
  const play = useCallback((sound: SoundName) => {
    if (!effectsEnabled) return;
    if (Platform.OS === 'web' && musicEnabled) music.play();
    const player = players[sound];
    void player.seekTo(0);
    player.play();
  }, [effectsEnabled, music, musicEnabled, players]);
  const value = useMemo(() => ({ play }), [play]);

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useGameAudio() {
  const value = useContext(AudioContext);
  if (!value) throw new Error('useGameAudio must be used inside AudioProvider');
  return value;
}
