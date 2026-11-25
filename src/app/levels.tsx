import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Image, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { palette } from '@/constants/palette';
import { levels } from '@/game/levels';
import { layerName, useCopy } from '@/i18n/translations';
import { useGameAudio } from '@/state/audio';
import { LAYER_UNLOCK_COSTS, useProgress } from '@/state/progress';
import { useSettings } from '@/state/settings';

const valley = require('../../assets/game/valley.png');
const unlockedBadge = require('../../assets/ui/level-unlocked.png');
const star = require('../../assets/ui/star.png');
const hintCoinAsset = require('../../assets/ui/hint-coin-v1.png');
const layerTokenAsset = require('../../assets/ui/layer-token-v1.png');
const logo = require('../../assets/ui/logo.png');

export default function LevelsScreen() {
  const { stars, unlockedLevel, unlockedLayer, hintCoins, layerCoins, unlockLayer } = useProgress();
  const { play } = useGameAudio();
  const { language } = useSettings();
  const text = useCopy(language);
  const [activeLayer, setActiveLayer] = useState(() => unlockedLayer);
  const visibleLevels = useMemo(() => levels.filter((level) => level.layer === activeLayer), [activeLayer]);
  const unlockCost = LAYER_UNLOCK_COSTS[activeLayer] ?? 0;
  const isLocked = activeLayer > unlockedLayer;
  const previousLayerComplete = activeLayer <= 1 || (stars[String((activeLayer - 1) * 50)] ?? 0) > 0;
  const canUnlock = activeLayer === unlockedLayer + 1 && previousLayerComplete && layerCoins >= unlockCost;

  return (
    <ImageBackground source={valley} resizeMode="cover" style={styles.background} imageStyle={styles.image}>
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <PressableScale accessibilityLabel={text.home} onPress={() => { play('tap'); router.replace('/'); }} style={styles.homeButton}>
            <Image source={logo} style={styles.homeIcon} />
          </PressableScale>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{text.levels}</Text>
            <Text style={styles.subtitle}>{text.layer} {activeLayer} · {layerName(language, activeLayer)}</Text>
          </View>
          <View style={styles.headerWallet}>
            <View style={styles.headerWalletItem}><Image source={hintCoinAsset} style={styles.headerWalletAsset} /><Text style={styles.headerWalletValue}>{hintCoins}</Text></View>
            <View style={styles.headerWalletItem}><Image source={layerTokenAsset} style={styles.headerWalletAsset} /><Text style={styles.headerWalletValue}>{layerCoins}</Text></View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.layerTabs}>
          {Array.from({ length: 10 }, (_, index) => index + 1).map((layer) => (
            <PressableScale key={layer} onPress={() => { play('tap'); setActiveLayer(layer); }}
              style={[styles.layerTab, activeLayer === layer && styles.layerTabActive]}>
              {activeLayer === layer && <View style={styles.layerActiveGlow} />}
              <View style={[styles.layerBadge, activeLayer === layer && styles.layerBadgeActive]}>
                {layer > unlockedLayer
                  ? <Image source={layerTokenAsset} style={styles.layerLockAsset} />
                  : <Text style={[styles.layerNumber, activeLayer === layer && styles.layerNumberActive]}>{layer}</Text>}
              </View>
              <View style={styles.layerTabCopy}>
                <Text numberOfLines={1} style={[styles.layerTabLabel, activeLayer === layer && styles.layerTabLabelActive]}>{layerName(language, layer)}</Text>
                <Text style={[styles.layerRange, activeLayer === layer && styles.layerRangeActive]}>{(layer - 1) * 50 + 1}–{layer * 50}</Text>
              </View>
            </PressableScale>
          ))}
        </ScrollView>

        <FlatList
          data={isLocked ? [] : visibleLevels}
          numColumns={4}
          keyExtractor={(item) => String(item.id)}
          style={styles.listFrame}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={isLocked ? (
            <View style={styles.lockedCard}>
              <Image source={layerTokenAsset} style={styles.lockedAsset} />
              <Text style={styles.lockedTitle}>{text.layerLocked}</Text>
              <Text style={styles.lockedLayer}>{text.layer} {activeLayer} · {layerName(language, activeLayer)}</Text>
              <View style={styles.unlockCost}><Image source={layerTokenAsset} style={styles.unlockCostAsset} /><Text style={styles.unlockCostText}>{unlockCost}</Text></View>
              <Text style={styles.lockedMessage}>{activeLayer > unlockedLayer + 1 ? text.unlockPreviousLayer : !previousLayerComplete ? text.completePreviousLayer : layerCoins < unlockCost ? text.notEnoughTokens : text.firstClearReward}</Text>
              <PressableScale disabled={!canUnlock} onPress={() => { play('tap'); void unlockLayer(activeLayer); }} style={[styles.unlockButton, !canUnlock && styles.unlockButtonDisabled]}>
                <Text style={styles.unlockButtonText}>{text.unlockLayer}</Text>
              </PressableScale>
            </View>
          ) : null}
          renderItem={({ item }) => {
            const levelStars = stars[String(item.id)] ?? 0;
            const levelLocked = item.id > unlockedLevel;
            const mechanicIcons = `${item.blockedCells.length ? '◆' : ''}${item.checkpoints.length ? '◉' : ''}${item.oneWays.length ? '→' : ''}` || '·';
            return (
              <PressableScale
                disabled={levelLocked}
                accessibilityState={{ disabled: levelLocked }}
                accessibilityLabel={levelLocked ? `${text.level} ${item.id}, ${text.levelLocked}` : `${text.level} ${item.id}`}
                onPress={() => { play('tap'); router.push(`/game/${item.id}`); }}
                style={[styles.levelButton, levelLocked && styles.levelButtonLocked]}>
                <Image source={unlockedBadge} resizeMode="contain" style={[styles.badge, levelLocked && styles.badgeLocked]} fadeDuration={0} />
                <View style={[styles.levelCopy, levelLocked && styles.levelCopyLocked]}>
                  <Text style={styles.levelNumber}>{item.id}</Text>
                  <Text style={styles.gridSize}>{item.size}×{item.size} · {text.stage} {item.stage}</Text>
                  <Text style={styles.mechanicIcons}>{mechanicIcons}</Text>
                </View>
                {levelLocked && <View style={styles.levelLock}><View style={styles.levelLockShackle} /><View style={styles.levelLockBody}><View style={styles.levelLockKeyhole} /></View></View>}
                <View style={styles.stars}>
                  {[0, 1, 2].map((value) => (
                    <Image key={value} source={star} style={[styles.star, value >= levelStars && styles.starEmpty]} fadeDuration={0} />
                  ))}
                </View>
              </PressableScale>
            );
          }}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: palette.ink },
  image: { opacity: 0.38 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10, 18, 17, 0.76)' },
  safeArea: { flex: 1 },
  header: { minHeight: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  headerCopy: { position: 'absolute', left: 62, right: 118, alignItems: 'center' },
  homeButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: palette.panelSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245,236,216,0.16)' },
  homeIcon: { width: 39, height: 39 },
  headerWallet: { height: 42, paddingHorizontal: 6, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 1, backgroundColor: 'rgba(20,28,27,0.94)', borderWidth: 1, borderColor: 'rgba(228,180,94,0.24)' },
  headerWalletItem: { minWidth: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  headerWalletAsset: { width: 29, height: 29 },
  headerWalletValue: { color: palette.cream, fontSize: 11, fontWeight: '900', marginLeft: -3 },
  title: { color: palette.cream, textAlign: 'center', fontSize: 25, fontWeight: '900', letterSpacing: 1.5 },
  subtitle: { color: palette.creamMuted, fontSize: 12, textAlign: 'center', marginTop: 2 },
  layerTabs: { paddingHorizontal: 14, paddingBottom: 12, gap: 9 },
  layerTab: { width: 142, height: 62, borderRadius: 19, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', overflow: 'hidden', backgroundColor: 'rgba(20,31,29,0.92)', borderWidth: 1, borderColor: 'rgba(245,236,216,0.14)', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  layerTabActive: { backgroundColor: 'rgba(54,59,43,0.97)', borderColor: palette.gold, borderWidth: 1.5 },
  layerActiveGlow: { position: 'absolute', width: 76, height: 76, borderRadius: 38, left: -25, backgroundColor: 'rgba(228,180,94,0.17)' },
  layerBadge: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,236,216,0.07)', borderWidth: 1, borderColor: 'rgba(245,236,216,0.12)' },
  layerBadgeActive: { backgroundColor: palette.gold, borderColor: '#f5dca6' },
  layerLockAsset: { width: 36, height: 36, opacity: 0.68 },
  layerNumber: { color: palette.creamMuted, fontSize: 16, fontWeight: '900' },
  layerNumberActive: { color: palette.ink },
  layerTabCopy: { flex: 1, marginLeft: 9 },
  layerTabLabel: { color: palette.creamMuted, fontSize: 10, fontWeight: '900' },
  layerTabLabelActive: { color: palette.cream },
  layerRange: { color: 'rgba(245,236,216,0.38)', fontSize: 8, fontWeight: '800', marginTop: 4, letterSpacing: 0.7 },
  layerRangeActive: { color: palette.gold },
  listFrame: { width: '100%', maxWidth: 620, alignSelf: 'center' },
  list: { paddingHorizontal: 10, paddingTop: 7, paddingBottom: 42 },
  row: { marginBottom: 7 },
  levelButton: { width: '25%', aspectRatio: 0.86, alignItems: 'center', justifyContent: 'center' },
  levelButtonLocked: { opacity: 0.58 },
  badge: { position: 'absolute', top: 0, width: '94%', height: '94%' },
  badgeLocked: { opacity: 0.54, tintColor: '#4d5753' },
  levelCopy: { position: 'absolute', top: '23%', alignItems: 'center' },
  levelCopyLocked: { opacity: 0.42 },
  levelLock: { position: 'absolute', width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,17,16,0.94)', borderWidth: 1, borderColor: 'rgba(228,180,94,0.45)' },
  levelLockShackle: { position: 'absolute', top: 5, width: 12, height: 10, borderWidth: 2, borderBottomWidth: 0, borderColor: palette.gold, borderTopLeftRadius: 7, borderTopRightRadius: 7 },
  levelLockBody: { position: 'absolute', top: 12, width: 16, height: 12, borderRadius: 4, backgroundColor: palette.gold, alignItems: 'center', justifyContent: 'center' },
  levelLockKeyhole: { width: 3, height: 5, borderRadius: 2, backgroundColor: palette.ink },
  levelNumber: { color: '#f8e5b7', fontSize: 23, lineHeight: 25, fontWeight: '900', textShadowColor: '#24160c', textShadowRadius: 3, textShadowOffset: { width: 0, height: 2 } },
  gridSize: { color: '#edc982', fontSize: 8, fontWeight: '900', marginTop: 1 },
  mechanicIcons: { color: palette.mint, fontSize: 10, lineHeight: 12, fontWeight: '900', letterSpacing: 2, marginTop: 1 },
  stars: { position: 'absolute', bottom: 0, flexDirection: 'row', justifyContent: 'center' },
  star: { width: 15, height: 15, marginHorizontal: -1 },
  starEmpty: { opacity: 0.2, tintColor: '#8f9189' },
  lockedCard: { width: '88%', maxWidth: 390, alignSelf: 'center', alignItems: 'center', marginTop: 34, paddingHorizontal: 24, paddingBottom: 22, borderRadius: 27, backgroundColor: 'rgba(25,37,34,0.97)', borderWidth: 1, borderColor: 'rgba(228,180,94,0.38)' },
  lockedAsset: { width: 132, height: 132, marginTop: -10 },
  lockedTitle: { color: palette.cream, fontSize: 21, fontWeight: '900', letterSpacing: 1.2, marginTop: -8 },
  lockedLayer: { color: palette.creamMuted, fontSize: 11, fontWeight: '800', marginTop: 5 },
  unlockCost: { height: 48, flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  unlockCostAsset: { width: 46, height: 46 },
  unlockCostText: { color: palette.gold, fontSize: 22, fontWeight: '900', marginLeft: -2 },
  lockedMessage: { minHeight: 30, color: palette.creamMuted, fontSize: 10, textAlign: 'center', marginTop: 2 },
  unlockButton: { alignSelf: 'stretch', height: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.gold, borderWidth: 2, borderColor: '#f4d496' },
  unlockButtonDisabled: { opacity: 0.38 },
  unlockButtonText: { color: palette.ink, fontSize: 13, fontWeight: '900', letterSpacing: 0.8 },
});
