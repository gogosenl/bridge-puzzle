import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { palette } from '@/constants/palette';
import { useCopy } from '@/i18n/translations';
import { useGameAudio } from '@/state/audio';
import { useProgress } from '@/state/progress';
import { useSettings } from '@/state/settings';

const valley = require('../../assets/game/valley.png');
const logo = require('../../assets/ui/logo.png');
const star = require('../../assets/ui/star.png');
const gorsenGamesLogo = require('../../assets/ui/gorsen-games.png');
const hintCoinAsset = require('../../assets/ui/hint-coin-v1.png');
const layerTokenAsset = require('../../assets/ui/layer-token-v1.png');
let launchAnimationShown = false;

export default function HomeScreen() {
  const { unlockedLevel, stars, hintCoins, layerCoins, ready } = useProgress();
  const { play } = useGameAudio();
  const { language } = useSettings();
  const text = useCopy(language);
  const totalStars = Object.values(stars).reduce((sum, value) => sum + value, 0);
  const [showLaunch, setShowLaunch] = useState(() => !launchAnimationShown);
  const [intro] = useState(() => new Animated.Value(showLaunch ? 1 : 0));
  const [launchOpacity] = useState(() => new Animated.Value(1));
  const [launchLogoOpacity] = useState(() => new Animated.Value(0));
  const [launchLogoScale] = useState(() => new Animated.Value(0.72));
  const [launchLogoY] = useState(() => new Animated.Value(28));
  const [launchCopyOpacity] = useState(() => new Animated.Value(0));
  const [launchSweep] = useState(() => new Animated.Value(0));
  const [launchScene] = useState(() => new Animated.Value(showLaunch ? 0 : 1));
  const [launchRoute] = useState(() => new Animated.Value(0));
  const [launchStudioOpacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (showLaunch) return;
    Animated.spring(intro, { toValue: 1, friction: 7, tension: 38, useNativeDriver: true }).start();
  }, [intro, showLaunch]);

  useEffect(() => {
    if (!showLaunch) return;
    play('whoosh');
    const routeSound = setTimeout(() => play('connect'), 1180);
    const animation = Animated.parallel([
      Animated.timing(launchScene, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(110),
        Animated.parallel([
          Animated.timing(launchStudioOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.timing(launchLogoOpacity, { toValue: 1, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(launchLogoScale, { toValue: 1, duration: 680, easing: Easing.out(Easing.back(1.25)), useNativeDriver: true }),
          Animated.timing(launchLogoY, { toValue: 0, duration: 720, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(launchCopyOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.timing(launchSweep, { toValue: 1, duration: 820, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(launchRoute, { toValue: 1, duration: 880, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.delay(420),
        Animated.parallel([
          Animated.timing(launchOpacity, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
          Animated.timing(launchLogoScale, { toValue: 1.06, duration: 500, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.timing(launchLogoY, { toValue: -12, duration: 500, useNativeDriver: true }),
        ]),
      ]),
    ]);
    animation.start(({ finished }) => {
      if (finished) {
        launchAnimationShown = true;
        setShowLaunch(false);
      }
    });
    return () => {
      clearTimeout(routeSound);
      animation.stop();
    };
  }, [launchCopyOpacity, launchLogoOpacity, launchLogoScale, launchLogoY, launchOpacity, launchRoute, launchScene, launchStudioOpacity, launchSweep, play, showLaunch]);

  const open = (target: string) => {
    play('tap');
    router.push(target as never);
  };

  const launchOverlay = showLaunch ? (
      <Animated.View
        style={[styles.launchScreen, { opacity: launchOpacity }]}>
        <View style={styles.launchBackground}>
          <View style={styles.launchColorWash} />
          <View style={styles.launchVignette} />

          <SafeAreaView style={styles.launchSafeArea}>
            <Animated.View style={[styles.launchPresentedBy, {
              opacity: launchStudioOpacity,
              transform: [{ translateY: launchStudioOpacity.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }],
            }]}>
              <Image source={gorsenGamesLogo} style={styles.launchStudioLogo} />
              <View>
                <Text style={styles.launchPresentedLabel}>{text.presents}</Text>
                <Text style={styles.launchPresentedName}>GÖRSEN GAMES</Text>
              </View>
            </Animated.View>

            <View style={styles.launchCenter}>
              <Animated.View style={[styles.launchBrand, {
                opacity: launchLogoOpacity,
                transform: [{ translateY: launchLogoY }, { scale: launchLogoScale }],
              }]}>
                <Animated.View style={[styles.launchOuterRing, {
                  transform: [
                    { rotate: launchScene.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '7deg'] }) },
                    { scale: launchScene.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.03] }) },
                  ],
                }]}>
                  <View style={[styles.launchRingMark, styles.launchRingMarkTop]} />
                  <View style={[styles.launchRingMark, styles.launchRingMarkRight]} />
                  <View style={[styles.launchRingMark, styles.launchRingMarkBottom]} />
                  <View style={[styles.launchRingMark, styles.launchRingMarkLeft]} />
                </Animated.View>
                <Animated.View style={[styles.launchPulse, {
                  opacity: launchScene.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.08, 0.34, 0.12] }),
                  transform: [{ scale: launchScene.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1.18] }) }],
                }]} />
                <View style={styles.launchGlow} />
                <Image source={logo} resizeMode="contain" style={styles.launchLogo} />
                <Animated.View style={[styles.launchSweep, {
                  opacity: launchSweep.interpolate({ inputRange: [0, 0.12, 0.82, 1], outputRange: [0, 0.8, 0.45, 0] }),
                  transform: [{ translateX: launchSweep.interpolate({ inputRange: [0, 1], outputRange: [-220, 220] }) }, { rotate: '14deg' }],
                }]} />
              </Animated.View>

              <Animated.View style={[styles.launchCopy, {
                opacity: launchCopyOpacity,
                transform: [{ translateY: launchCopyOpacity.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
              }]}>
                <Text style={styles.launchEyebrow}>ROUTE CRAFT</Text>
                <Text style={styles.launchTitle}>{text.gameTitle}</Text>
                <Text style={styles.launchTagline}>{text.launchTagline}</Text>
              </Animated.View>

              <View style={styles.launchRouteMap}>
                <Animated.View style={[styles.launchRouteSegment, styles.launchRouteSegmentLeft, {
                  transform: [{ scaleX: launchRoute.interpolate({ inputRange: [0, 0.38, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }) }],
                }]} />
                <Animated.View style={[styles.launchRouteSegment, styles.launchRouteSegmentDown, {
                  transform: [{ scaleY: launchRoute.interpolate({ inputRange: [0.25, 0.65, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }) }],
                }]} />
                <Animated.View style={[styles.launchRouteSegment, styles.launchRouteSegmentRight, {
                  transform: [{ scaleX: launchRoute.interpolate({ inputRange: [0.52, 0.92, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }) }],
                }]} />
                <Animated.View style={[styles.launchRouteNode, styles.launchRouteStart, { opacity: launchRoute }]} />
                <Animated.View style={[styles.launchRouteNode, styles.launchRouteTurn, { opacity: launchRoute.interpolate({ inputRange: [0.3, 0.5], outputRange: [0, 1], extrapolate: 'clamp' }) }]} />
                <Animated.View style={[styles.launchRouteNode, styles.launchRouteFinish, {
                  opacity: launchRoute.interpolate({ inputRange: [0.78, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
                  transform: [{ scale: launchRoute.interpolate({ inputRange: [0.78, 0.94, 1], outputRange: [0.4, 1.35, 1], extrapolate: 'clamp' }) }],
                }]} />
              </View>
            </View>

            <Animated.View style={[styles.launchLoading, { opacity: launchCopyOpacity }]}>
              <View style={styles.launchLoadingRow}>
                <Text style={styles.launchLoadingText}>{text.routePreparing}</Text>
                <Text style={styles.launchLoadingValue}>500</Text>
              </View>
              <View style={styles.launchLoadingTrack}>
                <Animated.View style={[styles.launchLoadingFill, { transform: [{ scaleX: launchScene }] }]} />
                <Animated.View style={[styles.launchLoadingSpark, {
                  opacity: launchScene.interpolate({ inputRange: [0, 0.08, 0.95, 1], outputRange: [0, 1, 1, 0] }),
                  transform: [{ translateX: launchScene.interpolate({ inputRange: [0, 1], outputRange: [-137, 137] }) }],
                }]} />
              </View>
            </Animated.View>
          </SafeAreaView>
        </View>
      </Animated.View>
  ) : null;

  return (
    <View style={styles.root}>
      <Animated.Image
        source={valley}
        resizeMode="cover"
        style={[styles.sharedBackground, {
          transform: [
            { scale: launchScene.interpolate({ inputRange: [0, 1], outputRange: [1.1, 1] }) },
            { translateY: launchScene.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
        }]}
      />
      <View style={styles.overlay} />
      <View style={styles.background}>
        <Animated.View
          pointerEvents={showLaunch ? 'none' : 'auto'}
          style={[styles.homeContent, {
            opacity: showLaunch
              ? launchOpacity.interpolate({ inputRange: [0, 0.55, 1], outputRange: [1, 0, 0], extrapolate: 'clamp' })
              : 1,
          }]}>
        <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Text style={styles.eyebrow}>{text.adventure}</Text>
          <View style={styles.wallet}>
            <View style={styles.walletPill}><Image source={hintCoinAsset} style={styles.walletAsset} /><Text style={styles.walletText}>{hintCoins}</Text></View>
            <View style={styles.walletPill}><Image source={layerTokenAsset} style={styles.walletAsset} /><Text style={styles.walletText}>{layerCoins}</Text></View>
          </View>
          <PressableScale accessibilityLabel={text.settings} onPress={() => open('/settings')} style={styles.soundButton}>
            <Text style={styles.soundIcon}>⚙</Text>
          </PressableScale>
        </View>

        <Animated.View style={[styles.brand, {
          opacity: intro,
          transform: [{ scale: intro.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }) }],
        }]}>
          <Image source={logo} resizeMode="contain" style={styles.logo} />
          <Text style={styles.title}>{text.gameTitle}</Text>
          <Text style={styles.subtitle}>{text.tagline}</Text>
        </Animated.View>

        <View style={styles.actions}>
          <PressableScale
            accessibilityRole="button"
            disabled={!ready}
            onPress={() => open(`/game/${Math.min(unlockedLevel, 500)}`)}
            style={styles.primaryButton}>
            <View>
              <Text style={styles.buttonHint}>{text.continueAdventure}</Text>
              <Text style={styles.primaryLabel}>{ready ? `${text.level} ${unlockedLevel}` : text.loading}</Text>
            </View>
            <Text style={styles.primaryIcon}>›</Text>
          </PressableScale>

          <PressableScale onPress={() => open('/levels')} style={styles.secondaryButton}>
            <Text style={styles.secondaryLabel}>{text.levels}</Text>
            <View style={styles.starTotal}>
              <Image source={star} style={styles.smallStar} />
              <Text style={styles.starText}>{totalStars}/1500</Text>
            </View>
          </PressableScale>

          <View style={styles.studioBrand}>
            <Image source={gorsenGamesLogo} resizeMode="cover" style={styles.studioLogo} />
            <Text style={styles.studioName}>GÖRSEN GAMES</Text>
          </View>
        </View>
        </SafeAreaView>
        </Animated.View>
      </View>
      {launchOverlay}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07100e' },
  sharedBackground: { ...StyleSheet.absoluteFill, width: '100%', height: '100%', opacity: 0.88 },
  launchScreen: { ...StyleSheet.absoluteFill, zIndex: 100 },
  launchBackground: { flex: 1, overflow: 'hidden' },
  launchColorWash: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(4,17,15,0.18)' },
  launchVignette: { ...StyleSheet.absoluteFill, borderWidth: 34, borderColor: 'rgba(2,8,7,0.34)' },
  launchSafeArea: { flex: 1, paddingHorizontal: 28, paddingTop: 15, paddingBottom: 26, justifyContent: 'space-between' },
  launchPresentedBy: { alignSelf: 'center', minHeight: 42, paddingHorizontal: 13, paddingVertical: 7, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: 'rgba(10,22,19,0.72)', borderWidth: 1, borderColor: 'rgba(228,180,94,0.24)' },
  launchStudioLogo: { width: 29, height: 29, borderRadius: 8 },
  launchPresentedLabel: { color: 'rgba(245,236,216,0.5)', fontSize: 6, fontWeight: '900', letterSpacing: 1.8 },
  launchPresentedName: { color: palette.cream, fontSize: 8, fontWeight: '900', letterSpacing: 2.1, marginTop: 2 },
  launchCenter: { alignItems: 'center', marginTop: 8 },
  launchBrand: { width: 274, height: 274, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  launchOuterRing: { position: 'absolute', width: 224, height: 224, borderRadius: 112, borderWidth: 1, borderColor: 'rgba(228,180,94,0.48)', backgroundColor: 'rgba(8,18,16,0.24)' },
  launchRingMark: { position: 'absolute', width: 17, height: 4, borderRadius: 2, backgroundColor: palette.gold, shadowColor: palette.gold, shadowOpacity: 0.7, shadowRadius: 8 },
  launchRingMarkTop: { top: -2, left: 102 },
  launchRingMarkRight: { right: -8, top: 108, transform: [{ rotate: '90deg' }] },
  launchRingMarkBottom: { bottom: -2, left: 102 },
  launchRingMarkLeft: { left: -8, top: 108, transform: [{ rotate: '90deg' }] },
  launchPulse: { position: 'absolute', width: 224, height: 224, borderRadius: 112, borderWidth: 2, borderColor: 'rgba(111,225,183,0.38)' },
  launchGlow: { position: 'absolute', width: 202, height: 202, borderRadius: 101, backgroundColor: 'rgba(228,180,94,0.11)', shadowColor: palette.gold, shadowOpacity: 0.8, shadowRadius: 42 },
  launchLogo: { width: 254, height: 254 },
  launchSweep: { position: 'absolute', width: 52, height: 320, backgroundColor: 'rgba(255,244,208,0.2)', shadowColor: '#fff2c6', shadowOpacity: 0.74, shadowRadius: 18 },
  launchCopy: { alignItems: 'center', marginTop: -25 },
  launchEyebrow: { color: palette.gold, fontSize: 8, fontWeight: '900', letterSpacing: 4.2, marginBottom: 7 },
  launchTitle: { color: palette.cream, fontSize: 31, fontWeight: '900', letterSpacing: 2.8, textAlign: 'center', textShadowColor: '#000', textShadowRadius: 15, textShadowOffset: { width: 0, height: 6 } },
  launchTagline: { color: palette.mint, marginTop: 9, fontSize: 8, fontWeight: '900', letterSpacing: 1.8, textAlign: 'center' },
  launchRouteMap: { width: 238, height: 52, marginTop: 16 },
  launchRouteSegment: { position: 'absolute', borderRadius: 5, backgroundColor: palette.gold, shadowColor: palette.gold, shadowOpacity: 0.64, shadowRadius: 7 },
  launchRouteSegmentLeft: { left: 17, top: 10, width: 99, height: 3 },
  launchRouteSegmentDown: { left: 113, top: 10, width: 3, height: 30 },
  launchRouteSegmentRight: { left: 113, top: 37, width: 106, height: 3 },
  launchRouteNode: { position: 'absolute', width: 11, height: 11, borderRadius: 6, backgroundColor: palette.cream, borderWidth: 2, borderColor: palette.gold, shadowColor: palette.gold, shadowOpacity: 0.85, shadowRadius: 9 },
  launchRouteStart: { left: 12, top: 6 },
  launchRouteTurn: { left: 109, top: 6 },
  launchRouteFinish: { right: 12, bottom: 8, backgroundColor: palette.mint },
  launchLoading: { alignSelf: 'center', width: 286 },
  launchLoadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  launchLoadingText: { color: 'rgba(245,236,216,0.62)', fontSize: 7, fontWeight: '900', letterSpacing: 1.8 },
  launchLoadingValue: { color: palette.gold, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 },
  launchLoadingTrack: { height: 3, borderRadius: 2, backgroundColor: 'rgba(245,236,216,0.13)', overflow: 'visible', justifyContent: 'center' },
  launchLoadingFill: { ...StyleSheet.absoluteFill, borderRadius: 2, backgroundColor: palette.gold },
  launchLoadingSpark: { position: 'absolute', alignSelf: 'center', width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff4c9', shadowColor: palette.gold, shadowOpacity: 1, shadowRadius: 10 },
  background: { flex: 1 },
  homeContent: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8, 15, 14, 0.55)' },
  safeArea: { flex: 1, paddingHorizontal: 26, justifyContent: 'space-between', paddingVertical: 22 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: palette.mint, fontWeight: '900', letterSpacing: 2.1, fontSize: 11 },
  wallet: { flexDirection: 'row', gap: 4 },
  walletPill: { height: 32, minWidth: 48, borderRadius: 13, paddingHorizontal: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,28,27,0.88)', borderWidth: 1, borderColor: 'rgba(228,180,94,0.25)' },
  walletAsset: { width: 25, height: 25 },
  walletText: { color: palette.cream, fontSize: 10, fontWeight: '900', marginLeft: -1 },
  soundButton: { width: 44, height: 44, borderRadius: 15, backgroundColor: palette.panel, borderWidth: 1, borderColor: 'rgba(245,236,216,0.22)', alignItems: 'center', justifyContent: 'center' },
  soundIcon: { color: palette.gold, fontSize: 22, fontWeight: '900' },
  brand: { alignItems: 'center', marginTop: -10 },
  logo: { width: 238, height: 238 },
  title: { marginTop: -8, color: palette.cream, fontSize: 33, textAlign: 'center', fontWeight: '900', letterSpacing: 1.8, textShadowColor: palette.shadow, textShadowRadius: 12, textShadowOffset: { width: 0, height: 5 } },
  subtitle: { color: palette.creamMuted, textAlign: 'center', marginTop: 8, fontSize: 13 },
  actions: { gap: 11 },
  primaryButton: { minHeight: 70, paddingHorizontal: 22, borderRadius: 19, backgroundColor: palette.gold, borderWidth: 2, borderColor: '#f2d292', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 7 } },
  buttonHint: { color: 'rgba(23,32,31,0.65)', fontWeight: '900', fontSize: 9, letterSpacing: 1.1 },
  primaryLabel: { color: palette.ink, fontWeight: '900', fontSize: 20, letterSpacing: 1.1, marginTop: 2 },
  primaryIcon: { color: palette.ink, fontSize: 38, lineHeight: 40, fontWeight: '300' },
  secondaryButton: { minHeight: 58, paddingHorizontal: 20, borderRadius: 18, backgroundColor: palette.panel, borderWidth: 1, borderColor: 'rgba(245,236,216,0.24)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  secondaryLabel: { color: palette.cream, fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  starTotal: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  smallStar: { width: 24, height: 24 },
  starText: { color: palette.gold, fontWeight: '900', fontSize: 14 },
  studioBrand: { height: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 1 },
  studioLogo: { width: 28, height: 28, borderRadius: 7 },
  studioName: { color: 'rgba(245,236,216,0.78)', fontSize: 10, fontWeight: '900', letterSpacing: 2.2 },
});
