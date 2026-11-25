import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, ImageBackground, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BridgeBoard } from '@/components/bridge-board';
import { PressableScale } from '@/components/pressable-scale';
import { palette } from '@/constants/palette';
import { canTravel, cellKey, connectFinishIfAdjacent, hintPath, isPathSolved, starsForMoves } from '@/game/logic';
import { getLevel } from '@/game/levels';
import type { Cell, Level } from '@/game/types';
import { useCopy } from '@/i18n/translations';
import { useGameAudio } from '@/state/audio';
import { HINT_COST, useProgress } from '@/state/progress';
import { TutorialMechanic, useSettings } from '@/state/settings';

const valley = require('../../../assets/game/valley.png');
const starAsset = require('../../../assets/ui/star.png');
const hintCoinAsset = require('../../../assets/ui/hint-coin-v1.png');
const layerTokenAsset = require('../../../assets/ui/layer-token-v1.png');
const logo = require('../../../assets/ui/logo.png');
const tutorialAssets = {
  boulders: require('../../../assets/game/obstacle-boulders-v1.png'),
  checkpoints: require('../../../assets/game/checkpoint-v1.png'),
  oneWay: require('../../../assets/game/one-way-v1.png'),
};
const particleAngles = Array.from({ length: 10 }, (_, index) => (Math.PI * 2 * index) / 10);

export default function GameScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const levelId = Math.max(1, Math.min(500, Number(params.id) || 1));
  const { ready, unlockedLevel } = useProgress();
  const level = useMemo(() => getLevel(levelId), [levelId]);

  useEffect(() => {
    if (ready && levelId > unlockedLevel) router.replace('/levels');
  }, [levelId, ready, unlockedLevel]);

  if (!ready || levelId > unlockedLevel) return null;
  return <GameLevel key={level.id} level={level} />;
}

function GameLevel({ level }: { level: Level }) {
  const { width, height } = useWindowDimensions();
  const { completeLevel, hintCoins, layerCoins, spendHint } = useProgress();
  const { play } = useGameAudio();
  const { language, ready: settingsReady, seenMechanics, markMechanicSeen } = useSettings();
  const text = useCopy(language);
  const mechanicRule = level.mechanic === 'boulders' ? text.ruleBoulders
    : level.mechanic === 'checkpoints' ? text.ruleCheckpoints
      : level.mechanic === 'oneWay' ? text.ruleOneWay
        : level.mechanic === 'mixed' ? text.ruleMixed : text.ruleClassic;
  const [path, setPath] = useState<Cell[]>([level.cells[0]]);
  const [buildStartIndex, setBuildStartIndex] = useState<number | null>(null);
  const [removingCellKey, setRemovingCellKey] = useState<string | null>(null);
  const [pathAnimating, setPathAnimating] = useState(false);
  const [boardInteracting, setBoardInteracting] = useState(false);
  const [moves, setMoves] = useState(0);
  const [complete, setComplete] = useState(false);
  const pathRef = useRef(path);
  const movesRef = useRef(0);
  const solved = useRef(false);
  const pathTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [completionFx] = useState(() => new Animated.Value(0));

  useEffect(() => () => {
    pathTimersRef.current.forEach(clearTimeout);
  }, []);

  const unseenTutorials: TutorialMechanic[] = [];
  if (settingsReady && level.blockedCells.length > 0 && !seenMechanics.boulders) unseenTutorials.push('boulders');
  if (settingsReady && level.checkpoints.length > 0 && !seenMechanics.checkpoints) unseenTutorials.push('checkpoints');
  if (settingsReady && level.oneWays.length > 0 && !seenMechanics.oneWay) unseenTutorials.push('oneWay');
  const currentTutorial = unseenTutorials[0];
  const tutorialTitle = currentTutorial === 'boulders' ? text.boulderTitle
    : currentTutorial === 'checkpoints' ? text.checkpointTitle : text.oneWayTitle;
  const tutorialDescription = currentTutorial === 'boulders' ? text.boulderIntro
    : currentTutorial === 'checkpoints' ? text.checkpointIntro : text.oneWayIntro;

  const continueTutorial = () => {
    if (!currentTutorial) return;
    play('tap');
    markMechanicSeen(currentTutorial);
  };

  const finishIfSolved = async (next: Cell[], nextMoves: number) => {
    if (solved.current || !isPathSolved(level, next)) return;
    solved.current = true;
    setComplete(true);
    const stars = starsForMoves(level, nextMoves);
    const rewards = await completeLevel(level.id, stars);
    play('success');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.spring(completionFx, { toValue: 1, friction: 6, tension: 42, useNativeDriver: true }),
      Animated.delay(900),
    ]).start(() => {
      router.replace(`/result/${level.id}?moves=${nextMoves}&stars=${stars}&hintReward=${rewards.hintCoins}&layerReward=${rewards.layerCoins}` as never);
    });
  };

  const finishAfterBuild = (next: Cell[], nextMoves: number, addedPieces: number) => {
    if (!isPathSolved(level, next)) return;
    const waitForRoad = Math.min(Math.max(1, addedPieces) * 55, 480) + 460;
    const timer = setTimeout(() => {
      void finishIfSolved(next, nextMoves);
    }, waitForRoad);
    pathTimersRef.current.push(timer);
  };

  const removePathSequentially = (target: Cell[], current: Cell[], nextMoves: number) => {
    pathTimersRef.current.forEach(clearTimeout);
    pathTimersRef.current = [];
    setBuildStartIndex(null);
    setPathAnimating(true);
    movesRef.current = nextMoves;
    setMoves(nextMoves);
    play('remove');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let working = current;
    const finishRemoval = () => {
      pathRef.current = target;
      setPath(target);
      setRemovingCellKey(null);
      setPathAnimating(false);
    };
    const removeNext = () => {
      if (working.length <= target.length) {
        finishRemoval();
        return;
      }
      const departing = working[working.length - 1];
      setRemovingCellKey(cellKey(departing));
      const fadeTimer = setTimeout(() => {
        working = working.slice(0, -1);
        pathRef.current = working;
        setPath(working);
        setRemovingCellKey(null);
        if (working.length <= target.length) {
          finishRemoval();
          return;
        }
        const gapTimer = setTimeout(removeNext, 6);
        pathTimersRef.current.push(gapTimer);
      }, 45);
      pathTimersRef.current.push(fadeTimer);
    };
    removeNext();
  };

  const placePiece = (cell: Cell) => {
    if (complete || pathAnimating) return;
    const current = pathRef.current;
    const end = current[current.length - 1];
    const placedIndex = current.findIndex((placed) => cellKey(placed) === cellKey(cell));
    let next: Cell[] | null = null;

    if (placedIndex > 0) {
      next = current.slice(0, placedIndex);
    } else if (cellKey(end) !== cellKey(level.cells[level.cells.length - 1]) && canTravel(level, end, cell) && placedIndex === -1) {
      next = connectFinishIfAdjacent([...current, cell], level.cells[level.cells.length - 1], level);
    }
    if (!next) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const addedPieces = Math.max(1, next.length - current.length);
    const nextMoves = movesRef.current + addedPieces;
    if (next.length < current.length) {
      removePathSequentially(next, current, nextMoves);
      return;
    }
    const finishKey = cellKey(level.cells[level.cells.length - 1]);
    const connectedFinish = next.some((item) => cellKey(item) === finishKey)
      && !current.some((item) => cellKey(item) === finishKey);
    play(connectedFinish ? 'connect' : 'place');
    void Haptics.selectionAsync();
    setBuildStartIndex(current.length);
    pathRef.current = next;
    movesRef.current = nextMoves;
    setPath(next);
    setMoves(nextMoves);
    finishAfterBuild(next, nextMoves, addedPieces);
  };

  const commitDraggedPath = (candidate: Cell[]) => {
    if (complete || pathAnimating || candidate.length === 0) return;
    const current = pathRef.current;
    const next = candidate.length >= current.length
      ? connectFinishIfAdjacent(candidate, level.cells[level.cells.length - 1], level)
      : candidate;
    if (cellKey(next[0]) !== cellKey(level.cells[0])) return;
    if (new Set(next.map(cellKey)).size !== next.length) return;
    if (next.some((cell, index) => index > 0 && !canTravel(level, next[index - 1], cell))) return;
    const finishIndex = next.findIndex((cell) => cellKey(cell) === cellKey(level.cells[level.cells.length - 1]));
    if (finishIndex >= 0 && finishIndex !== next.length - 1) return;

    let common = 0;
    while (common < current.length && common < next.length && cellKey(current[common]) === cellKey(next[common])) common += 1;
    if (common === current.length && common === next.length) return;

    const changedCells = Math.max(1, current.length - common + next.length - common);
    const nextMoves = movesRef.current + changedCells;
    if (next.length < current.length && common === next.length) {
      removePathSequentially(next, current, nextMoves);
      return;
    }
    setBuildStartIndex(common);
    pathRef.current = next;
    movesRef.current = nextMoves;
    setPath(next);
    setMoves(nextMoves);
    const finishKey = cellKey(level.cells[level.cells.length - 1]);
    const connectedFinish = next.some((item) => cellKey(item) === finishKey)
      && !current.some((item) => cellKey(item) === finishKey);
    play(connectedFinish ? 'connect' : 'place');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    finishAfterBuild(next, nextMoves, next.length - common);
  };

  const activateHint = async () => {
    if (hintCoins < HINT_COST || complete || pathAnimating) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    const hintedPath = hintPath(level, pathRef.current);
    if (!hintedPath) return;
    if (!await spendHint()) return;
    const next = connectFinishIfAdjacent(hintedPath, level.cells[level.cells.length - 1], level);
    const nextMoves = movesRef.current + 1;
    let common = 0;
    while (common < pathRef.current.length && common < next.length && cellKey(pathRef.current[common]) === cellKey(next[common])) common += 1;
    const finishKey = cellKey(level.cells[level.cells.length - 1]);
    const connectedFinish = next.some((item) => cellKey(item) === finishKey)
      && !pathRef.current.some((item) => cellKey(item) === finishKey);
    setBuildStartIndex(common);
    pathRef.current = next;
    movesRef.current = nextMoves;
    setPath(next);
    setMoves(nextMoves);
    play(connectedFinish ? 'connect' : 'place');
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    finishAfterBuild(next, nextMoves, next.length - common);
  };

  const boardWidth = Math.min(width - 20, height * 0.63);

  return (
    <ImageBackground source={valley} resizeMode="cover" style={styles.background} imageStyle={styles.backgroundImage}>
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <PressableScale accessibilityLabel={text.home} onPress={() => { play('tap'); router.replace('/'); }} style={styles.iconButton}>
            <Image source={logo} style={styles.homeIcon} />
          </PressableScale>
          <PressableScale
            accessibilityLabel={text.levels}
            onPress={() => { play('tap'); router.push('/levels'); }}
            style={styles.levelPlate}>
            <View style={styles.levelPlateCopy}>
              <Text style={styles.levelTitle}>{text.level} {level.id}</Text>
              <Text style={styles.levelMeta}>{text.layer} {level.layer} · {text.stage} {level.stage} · {level.size}×{level.size}</Text>
            </View>
            <Text style={styles.levelsIcon}>▦</Text>
          </PressableScale>
          <PressableScale accessibilityLabel={text.settings} onPress={() => { play('tap'); router.push('/settings'); }} style={styles.iconButton}>
            <Text style={styles.menuIcon}>⚙</Text>
          </PressableScale>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusPill}><Text style={styles.statusLabel}>{text.moves}</Text><Text style={styles.statusValue}>{moves}</Text></View>
          <View style={styles.statusPill}><Text style={styles.statusLabel}>{text.par}</Text><Text style={styles.statusValue}>{level.par}</Text></View>
        </View>

        <View style={styles.gameWallet}>
          <View style={styles.gameWalletItem}><Image source={hintCoinAsset} style={styles.gameWalletAsset} /><Text style={styles.gameWalletValue}>{hintCoins}</Text></View>
          <View style={styles.gameWalletDivider} />
          <View style={styles.gameWalletItem}><Image source={layerTokenAsset} style={styles.gameWalletAsset} /><Text style={styles.gameWalletValue}>{layerCoins}</Text></View>
        </View>

        <ScrollView
          contentContainerStyle={styles.gameContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceHorizontal={false}
          directionalLockEnabled
          scrollEnabled={!boardInteracting}>
          <BridgeBoard
            level={level}
            path={path}
            buildStartIndex={buildStartIndex}
            removingCellKey={removingCellKey}
            disabled={pathAnimating || !settingsReady || Boolean(currentTutorial)}
            maxWidth={boardWidth}
            onCellPress={placePiece}
            onInteractionChange={setBoardInteracting}
            onPathCommit={commitDraggedPath}
          />
          <View style={styles.rulePill}><Text style={styles.ruleText}>{mechanicRule}</Text></View>
          <Text style={styles.instruction}>{text.instruction}</Text>
          <View style={styles.toolRow}>
            <PressableScale onPress={() => { void activateHint(); }} disabled={hintCoins < HINT_COST} style={[styles.toolButton, hintCoins < HINT_COST && styles.toolDisabled]}>
              <Image source={hintCoinAsset} style={styles.toolCoin} />
              <View><Text style={styles.toolLabel}>{text.hint}</Text><Text style={styles.toolCost}>-{HINT_COST}</Text></View>
              <View style={styles.counter}><Image source={hintCoinAsset} style={styles.counterCoin} /><Text style={styles.counterText}>{hintCoins}</Text></View>
            </PressableScale>
          </View>
        </ScrollView>
      </SafeAreaView>

      {complete && (
        <Animated.View pointerEvents="auto" style={[styles.completionLayer, { opacity: completionFx }]}>
          {particleAngles.map((angle, index) => {
            const distance = 116 + (index % 2) * 34;
            return (
              <Animated.Image
                key={index}
                source={starAsset}
                style={[styles.successParticle, {
                  opacity: completionFx.interpolate({
                    inputRange: [0, 0.18, 0.72, 1],
                    outputRange: [0, 1, 0.8, 0],
                    extrapolate: 'clamp',
                  }),
                  transform: [
                    { translateX: completionFx.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * distance], extrapolate: 'clamp' }) },
                    { translateY: completionFx.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * distance], extrapolate: 'clamp' }) },
                    { scale: completionFx.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.15, 1, 0.55], extrapolate: 'clamp' }) },
                    { rotate: `${index * 29}deg` },
                  ],
                }]}
              />
            );
          })}
          <Animated.View style={[styles.successRing, {
            transform: [{ scale: completionFx.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }],
          }]}>
            <Text style={styles.check}>✓</Text>
          </Animated.View>
          <Text style={styles.completeTitle}>{text.bridgeComplete}</Text>
          <Text style={styles.completeSub}>{text.safeRoute}</Text>
        </Animated.View>
      )}

      {currentTutorial && (
        <View accessibilityViewIsModal style={styles.tutorialLayer}>
          <View style={styles.tutorialCard}>
            <Text style={styles.tutorialEyebrow}>{text.newRule}</Text>
            <View style={styles.tutorialAssetFrame}>
              <View style={styles.tutorialGlow} />
              <Image source={tutorialAssets[currentTutorial]} resizeMode="contain" style={styles.tutorialAsset} fadeDuration={0} />
            </View>
            <Text style={styles.tutorialTitle}>{tutorialTitle}</Text>
            <Text style={styles.tutorialDescription}>{tutorialDescription}</Text>
            <View style={styles.tutorialProgress}>
              {unseenTutorials.map((mechanic, index) => <View key={mechanic} style={[styles.tutorialDot, index === 0 && styles.tutorialDotActive]} />)}
            </View>
            <PressableScale accessibilityRole="button" onPress={continueTutorial} style={styles.tutorialButton}>
              <Text style={styles.tutorialButtonText}>{text.continue}</Text>
              <Text style={styles.tutorialButtonArrow}>›</Text>
            </PressableScale>
          </View>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: palette.ink },
  backgroundImage: { opacity: 0.42 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10, 18, 17, 0.74)' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 5, gap: 10 },
  iconButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: palette.panel, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245,236,216,0.18)' },
  homeIcon: { width: 39, height: 39 },
  menuIcon: { color: palette.cream, fontSize: 19, fontWeight: '900' },
  levelPlate: { flex: 1, minHeight: 54, borderRadius: 16, backgroundColor: palette.panel, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245,236,216,0.18)', flexDirection: 'row', paddingHorizontal: 13 },
  levelPlateCopy: { flex: 1, alignItems: 'center', paddingLeft: 24 },
  levelTitle: { color: palette.cream, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  levelMeta: { color: palette.creamMuted, fontSize: 10, fontWeight: '700', marginTop: 2, letterSpacing: 0.5 },
  levelsIcon: { width: 24, color: palette.gold, fontSize: 20, textAlign: 'right', fontWeight: '900' },
  statusRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, paddingTop: 10 },
  statusPill: { minWidth: 64, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: palette.panelSoft, alignItems: 'center' },
  statusLabel: { color: palette.creamMuted, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  statusValue: { color: palette.cream, fontSize: 17, fontWeight: '900' },
  gameWallet: { alignSelf: 'center', height: 35, marginTop: 6, paddingHorizontal: 7, borderRadius: 13, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20,28,27,0.93)', borderWidth: 1, borderColor: 'rgba(228,180,94,0.25)' },
  gameWalletItem: { minWidth: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  gameWalletAsset: { width: 27, height: 27 },
  gameWalletValue: { color: palette.cream, fontSize: 11, fontWeight: '900', marginLeft: -2 },
  gameWalletDivider: { width: 1, height: 21, marginHorizontal: 4, backgroundColor: 'rgba(245,236,216,0.15)' },
  gameContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingBottom: 16 },
  instruction: { color: palette.creamMuted, fontSize: 12, textAlign: 'center', marginTop: 12 },
  rulePill: { marginTop: 11, maxWidth: 520, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: 'rgba(228,180,94,0.12)', borderWidth: 1, borderColor: 'rgba(228,180,94,0.35)' },
  ruleText: { color: '#f3dba7', fontSize: 10, lineHeight: 14, textAlign: 'center', fontWeight: '800' },
  toolRow: { flexDirection: 'row', gap: 12, marginTop: 13 },
  toolButton: { minWidth: 114, height: 58, borderRadius: 17, backgroundColor: palette.panel, borderWidth: 1, borderColor: 'rgba(245,236,216,0.2)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 15 },
  toolDisabled: { opacity: 0.45 },
  toolCoin: { width: 27, height: 27 },
  toolLabel: { color: palette.cream, fontSize: 11, fontWeight: '900', letterSpacing: 0.7 },
  toolCost: { color: palette.gold, fontSize: 8, fontWeight: '900', marginTop: 1 },
  counter: { position: 'absolute', top: -8, right: -8, minWidth: 43, height: 25, borderRadius: 13, backgroundColor: palette.mint, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 1, paddingHorizontal: 4, borderWidth: 2, borderColor: palette.ink },
  counterCoin: { width: 17, height: 17 },
  counterText: { color: palette.ink, fontSize: 10, fontWeight: '900' },
  completionLayer: { ...StyleSheet.absoluteFill, zIndex: 20, backgroundColor: 'rgba(8,14,13,0.79)', alignItems: 'center', justifyContent: 'center' },
  successParticle: { position: 'absolute', width: 25, height: 25 },
  successRing: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(228,180,94,0.18)', borderWidth: 4, borderColor: palette.gold, shadowColor: palette.gold, shadowOpacity: 0.8, shadowRadius: 28 },
  check: { color: '#ffe4a3', fontSize: 76, lineHeight: 88, fontWeight: '900' },
  completeTitle: { color: palette.cream, fontSize: 25, fontWeight: '900', letterSpacing: 1.8, marginTop: 24 },
  completeSub: { color: palette.mint, fontSize: 13, fontWeight: '800', marginTop: 7 },
  tutorialLayer: { ...StyleSheet.absoluteFill, zIndex: 80, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, backgroundColor: 'rgba(6,12,11,0.88)' },
  tutorialCard: { width: '100%', maxWidth: 410, borderRadius: 29, paddingHorizontal: 24, paddingTop: 21, paddingBottom: 20, alignItems: 'center', backgroundColor: 'rgba(25,37,34,0.98)', borderWidth: 1, borderColor: 'rgba(228,180,94,0.48)', shadowColor: '#000', shadowOpacity: 0.65, shadowRadius: 28, shadowOffset: { width: 0, height: 14 } },
  tutorialEyebrow: { color: palette.mint, fontSize: 10, fontWeight: '900', letterSpacing: 2.2 },
  tutorialAssetFrame: { width: 190, height: 190, marginTop: 5, alignItems: 'center', justifyContent: 'center' },
  tutorialGlow: { position: 'absolute', width: 142, height: 142, borderRadius: 71, backgroundColor: 'rgba(228,180,94,0.11)', shadowColor: palette.gold, shadowOpacity: 0.3, shadowRadius: 26 },
  tutorialAsset: { width: '100%', height: '100%' },
  tutorialTitle: { color: palette.cream, fontSize: 23, fontWeight: '900', textAlign: 'center', letterSpacing: 1.2, marginTop: -2 },
  tutorialDescription: { color: palette.creamMuted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 10, maxWidth: 330 },
  tutorialProgress: { height: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tutorialDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(245,236,216,0.22)' },
  tutorialDotActive: { width: 18, backgroundColor: palette.gold },
  tutorialButton: { alignSelf: 'stretch', minHeight: 58, borderRadius: 18, backgroundColor: palette.gold, borderWidth: 2, borderColor: '#f4d496', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  tutorialButtonText: { color: palette.ink, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  tutorialButtonArrow: { color: palette.ink, fontSize: 32, lineHeight: 34 },
});
