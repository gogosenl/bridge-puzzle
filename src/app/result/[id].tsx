import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { palette } from '@/constants/palette';
import { useCopy } from '@/i18n/translations';
import { useGameAudio } from '@/state/audio';
import { useProgress } from '@/state/progress';
import { useSettings } from '@/state/settings';

const valley = require('../../../assets/game/valley.png');
const logo = require('../../../assets/ui/logo.png');
const starAsset = require('../../../assets/ui/star.png');
const hintCoinAsset = require('../../../assets/ui/hint-coin-v1.png');
const layerTokenAsset = require('../../../assets/ui/layer-token-v1.png');

export default function ResultScreen() {
  const params = useLocalSearchParams<{ id: string; moves?: string; stars?: string; hintReward?: string; layerReward?: string }>();
  const levelId = Math.max(1, Math.min(500, Number(params.id) || 1));
  const moves = Math.max(0, Number(params.moves) || 0);
  const earnedStars = Math.max(1, Math.min(3, Number(params.stars) || 1));
  const hintReward = Math.max(0, Number(params.hintReward) || 0);
  const layerReward = Math.max(0, Number(params.layerReward) || 0);
  const { hintCoins, layerCoins, unlockedLevel, unlockedLayer } = useProgress();
  const canContinue = levelId < 500 && levelId + 1 <= unlockedLevel && Math.ceil((levelId + 1) / 50) <= unlockedLayer;
  const { play } = useGameAudio();
  const { language } = useSettings();
  const text = useCopy(language);
  const [leaving, setLeaving] = useState(false);
  const [entry] = useState(() => new Animated.Value(0));
  const [transition] = useState(() => new Animated.Value(0));
  const [starValues] = useState(() => [new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]);

  useEffect(() => {
    Animated.timing(entry, { toValue: 1, duration: 420, useNativeDriver: true }).start();
    const timers: ReturnType<typeof setTimeout>[] = [];
    starValues.forEach((value, index) => {
      Animated.spring(value, { toValue: 1, delay: 360 + index * 300, friction: 5, tension: 70, useNativeDriver: true }).start();
      if (index < earnedStars) {
        timers.push(setTimeout(() => {
          play('star');
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 390 + index * 300));
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [earnedStars, entry, play, starValues]);

  const transitionTo = (destination: 'next' | 'levels') => {
    if (leaving) return;
    setLeaving(true);
    play('whoosh');
    Animated.timing(transition, { toValue: 1, duration: 480, useNativeDriver: true }).start(() => {
      if (destination === 'next' && canContinue) {
        router.replace({ pathname: '/game/[id]', params: { id: String(levelId + 1) } });
      } else {
        router.replace('/levels');
      }
    });
  };

  return (
    <ImageBackground source={valley} resizeMode="cover" style={styles.background} imageStyle={styles.backgroundImage}>
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.card, {
          opacity: entry,
          transform: [{ translateY: entry.interpolate({ inputRange: [0, 1], outputRange: [38, 0] }) }],
        }]}>
          <Image source={logo} resizeMode="contain" style={styles.logo} />
          <Text style={styles.eyebrow}>{text.bridgeComplete}</Text>
          <Text style={styles.title}>{text.level} {levelId}</Text>

          <View style={styles.starRow}>
            {starValues.map((value, index) => (
              <Animated.View key={index} style={{
                opacity: value,
                transform: [
                  { scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] }) },
                  { translateY: index === 1 ? -10 : 0 },
                ],
              }}>
                <Image source={starAsset} style={[styles.star, index >= earnedStars && styles.starEmpty]} />
              </Animated.View>
            ))}
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}><Text style={styles.statValue}>{moves}</Text><Text style={styles.statLabel}>{text.moves}</Text></View>
            <View style={styles.divider} />
            <View style={styles.stat}><Text style={styles.statValue}>{earnedStars}/3</Text><Text style={styles.statLabel}>{text.stars}</Text></View>
          </View>

          <View style={styles.rewards}>
            <Text style={styles.rewardsTitle}>{text.rewards}</Text>
            {hintReward + layerReward > 0 ? (
              <View style={styles.rewardRow}>
                <View style={styles.rewardItem}><Image source={hintCoinAsset} style={styles.rewardAsset} /><Text style={styles.rewardAmount}>+{hintReward}</Text><Text style={styles.rewardBalance}>{hintCoins}</Text></View>
                <View style={styles.rewardItem}><Image source={layerTokenAsset} style={styles.rewardAsset} /><Text style={styles.rewardAmount}>+{layerReward}</Text><Text style={styles.rewardBalance}>{layerCoins}</Text></View>
              </View>
            ) : <Text style={styles.rewardCollected}>{text.rewardCollected}</Text>}
          </View>

          <PressableScale disabled={leaving} onPress={() => transitionTo(canContinue ? 'next' : 'levels')} style={styles.nextButton}>
            <Text style={styles.nextLabel}>{canContinue ? text.continue : text.backToLevels}</Text>
            <Text style={styles.nextArrow}>›</Text>
          </PressableScale>
          <PressableScale disabled={leaving} onPress={() => transitionTo('levels')} style={styles.levelsButton}>
            <Text style={styles.levelsLabel}>{text.levels}</Text>
          </PressableScale>
        </Animated.View>
      </SafeAreaView>

      <Animated.View pointerEvents="none" style={[styles.transitionCurtain, {
        opacity: transition,
        transform: [{ scale: transition.interpolate({ inputRange: [0, 1], outputRange: [1.25, 1] }) }],
      }]}>
        <Image source={logo} style={styles.transitionLogo} />
        <Text style={styles.transitionText}>{canContinue ? `${text.level} ${levelId + 1}` : levelId >= 500 ? text.summitComplete : text.levels}</Text>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: palette.ink },
  backgroundImage: { opacity: 0.48 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8,15,14,0.7)' },
  safeArea: { flex: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 26 },
  card: { borderRadius: 30, backgroundColor: 'rgba(26,37,34,0.96)', borderWidth: 1, borderColor: 'rgba(235,190,105,0.42)', paddingHorizontal: 23, paddingBottom: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 24, shadowOffset: { width: 0, height: 12 } },
  logo: { width: 156, height: 156, marginTop: -76 },
  eyebrow: { color: palette.mint, fontSize: 11, fontWeight: '900', letterSpacing: 2, marginTop: -2 },
  title: { color: palette.cream, fontSize: 34, fontWeight: '900', marginTop: 5 },
  starRow: { minHeight: 112, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 4 },
  star: { width: 86, height: 86 },
  starEmpty: { opacity: 0.18, tintColor: '#737a74' },
  stats: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: 'rgba(9,15,14,0.42)', paddingVertical: 10, marginTop: 2, marginBottom: 9 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: palette.cream, fontSize: 21, fontWeight: '900' },
  statLabel: { color: palette.creamMuted, fontSize: 8, fontWeight: '900', letterSpacing: 1.3, marginTop: 2 },
  divider: { width: 1, height: 31, backgroundColor: 'rgba(245,236,216,0.18)' },
  rewards: { alignSelf: 'stretch', minHeight: 69, borderRadius: 16, backgroundColor: 'rgba(228,180,94,0.08)', borderWidth: 1, borderColor: 'rgba(228,180,94,0.24)', paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  rewardsTitle: { color: palette.gold, fontSize: 8, fontWeight: '900', textAlign: 'center', letterSpacing: 1.3 },
  rewardRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 3 },
  rewardItem: { minWidth: 86, height: 39, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  rewardAsset: { width: 38, height: 38 },
  rewardAmount: { color: palette.mint, fontSize: 15, fontWeight: '900', marginLeft: -2 },
  rewardBalance: { color: palette.creamMuted, fontSize: 9, fontWeight: '800', marginLeft: 4 },
  rewardCollected: { color: palette.creamMuted, fontSize: 10, textAlign: 'center', marginTop: 12 },
  nextButton: { alignSelf: 'stretch', minHeight: 62, borderRadius: 18, backgroundColor: palette.gold, borderWidth: 2, borderColor: '#f4d496', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  nextLabel: { color: palette.ink, fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  nextArrow: { color: palette.ink, fontSize: 34, lineHeight: 36 },
  levelsButton: { paddingVertical: 15, paddingHorizontal: 28 },
  levelsLabel: { color: palette.creamMuted, fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  transitionCurtain: { ...StyleSheet.absoluteFill, zIndex: 50, backgroundColor: '#101917', alignItems: 'center', justifyContent: 'center' },
  transitionLogo: { width: 178, height: 178 },
  transitionText: { color: palette.cream, fontSize: 19, fontWeight: '900', letterSpacing: 2, marginTop: 12 },
});
