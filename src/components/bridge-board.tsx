import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, ImageBackground, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/palette';
import { canTravel, cellKey, connectFinishIfAdjacent, isBlocked, pathCounts, pieceForPath, sameCell } from '@/game/logic';
import type { Cell, Level, PieceKind } from '@/game/types';
import { useCopy } from '@/i18n/translations';
import { useSettings } from '@/state/settings';

const valley = require('../../assets/game/valley.png');
const straightBridge = require('../../assets/game/bridge-straight-v3.png');
const cornerBridge = require('../../assets/game/bridge-corner-v3.png');
const startPlatform = require('../../assets/game/start-platform-v1.png');
const finishPlatform = require('../../assets/game/finish-platform-v1.png');
const startHikerUpright = require('../../assets/game/start-hiker-upright-v1.png');
const finishCabinUpright = require('../../assets/game/finish-cabin-upright-v1.png');
const boulderAsset = require('../../assets/game/obstacle-boulders-v1.png');
const checkpointAsset = require('../../assets/game/checkpoint-v1.png');
const oneWayAsset = require('../../assets/game/one-way-v1.png');
const BUILD_STEP_DELAY = 55;
const BUILD_DELAY_LIMIT = 480;
const SHADOW_HANDOFF_DELAY = 300;

type Props = {
  level: Level;
  path: Cell[];
  buildStartIndex: number | null;
  removingCellKey: string | null;
  disabled?: boolean;
  maxWidth: number;
  onCellPress: (cell: Cell) => void;
  onInteractionChange?: (active: boolean) => void;
  onPathCommit: (path: Cell[]) => void;
};

function pathsEqual(first: Cell[], second: Cell[]) {
  return first.length === second.length && first.every((cell, index) => sameCell(cell, second[index]));
}

export function BridgeBoard({ level, path, buildStartIndex, removingCellKey, disabled = false, maxWidth, onCellPress, onInteractionChange, onPathCommit }: Props) {
  const { language } = useSettings();
  const text = useCopy(language);
  const clueSize = 34;
  const boardSize = Math.min(maxWidth - clueSize - 8, 510);
  const tileSize = boardSize / level.size;
  const [previewPath, setPreviewPath] = useState<Cell[] | null>(null);
  const [buildShadowRoute, setBuildShadowRoute] = useState<Cell[] | null>(null);
  const [buildShadowHidden, setBuildShadowHidden] = useState(0);
  const pathRef = useRef(path);
  const previewRef = useRef<Cell[] | null>(null);
  const startCellRef = useRef<Cell | null>(null);
  const dragActiveRef = useRef(false);
  const dragMovedRef = useRef(false);
  const onCellPressRef = useRef(onCellPress);
  const onInteractionChangeRef = useRef(onInteractionChange);
  const onPathCommitRef = useRef(onPathCommit);
  const shadowTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finish = level.cells[level.cells.length - 1];
  const end = path[path.length - 1];

  useEffect(() => {
    pathRef.current = path;
    if (previewRef.current && pathsEqual(previewRef.current, path)) {
      previewRef.current = null;
      setPreviewPath(null);
    }
  }, [path]);

  useEffect(() => {
    onCellPressRef.current = onCellPress;
    onInteractionChangeRef.current = onInteractionChange;
    onPathCommitRef.current = onPathCommit;
  }, [onCellPress, onInteractionChange, onPathCommit]);

  useEffect(() => () => {
    shadowTimersRef.current.forEach(clearTimeout);
  }, []);

  const clearBuildShadow = () => {
    shadowTimersRef.current.forEach(clearTimeout);
    shadowTimersRef.current = [];
    setBuildShadowRoute(null);
    setBuildShadowHidden(0);
  };

  const keepShadowUntilBuilt = (route: Cell[]) => {
    clearBuildShadow();
    setBuildShadowRoute(route);
    const segmentCount = Math.max(0, route.length - 1);
    for (let segment = 1; segment <= segmentCount; segment += 1) {
      const handoffAt = Math.min(segment * BUILD_STEP_DELAY, BUILD_DELAY_LIMIT) + SHADOW_HANDOFF_DELAY;
      const timer = setTimeout(() => {
        setBuildShadowHidden(segment);
        if (segment === segmentCount) {
          const finishTimer = setTimeout(() => {
            setBuildShadowRoute(null);
            setBuildShadowHidden(0);
          }, 130);
          shadowTimersRef.current.push(finishTimer);
        }
      }, handoffAt);
      shadowTimersRef.current.push(timer);
    }
  };

  const updatePreview = (next: Cell[] | null) => {
    previewRef.current = next;
    setPreviewPath(next);
  };

  const cellAtPoint = (x: number, y: number): Cell | null => {
    if (x < 0 || y < 0 || x >= boardSize || y >= boardSize) return null;
    return {
      row: Math.min(level.size - 1, Math.floor(y / tileSize)),
      col: Math.min(level.size - 1, Math.floor(x / tileSize)),
    };
  };

  const beginAt = (cell: Cell | null) => {
    onInteractionChangeRef.current?.(true);
    clearBuildShadow();
    startCellRef.current = cell;
    dragMovedRef.current = false;
    dragActiveRef.current = false;
    if (!cell) {
      updatePreview(null);
      return;
    }

    const current = pathRef.current;
    const placedIndex = current.findIndex((placed) => sameCell(placed, cell));
    const endCell = current[current.length - 1];
    let next: Cell[] | null = null;

    if (placedIndex >= 0) next = current.slice(0, placedIndex + 1);
    else if (!sameCell(endCell, finish) && canTravel(level, endCell, cell)) next = [...current, cell];

    dragActiveRef.current = next !== null;
    updatePreview(next);
  };

  const moveTo = (cell: Cell | null) => {
    if (!cell || !dragActiveRef.current) return;
    const currentPreview = previewRef.current;
    if (!currentPreview?.length) return;
    const last = currentPreview[currentPreview.length - 1];
    if (sameCell(last, cell)) return;

    dragMovedRef.current = true;
    const beforeFinish = currentPreview[currentPreview.length - 2];
    if (sameCell(last, finish) && beforeFinish && sameCell(beforeFinish, cell)) return;
    const existingIndex = currentPreview.findIndex((placed) => sameCell(placed, cell));
    if (existingIndex >= 0) {
      updatePreview(currentPreview.slice(0, existingIndex + 1));
      return;
    }
    if (sameCell(last, finish)) return;
    if (canTravel(level, last, cell)) updatePreview([...currentPreview, cell]);
  };

  const finishGesture = () => {
    onInteractionChangeRef.current?.(false);
    const startCell = startCellRef.current;
    const next = previewRef.current;
    const moved = dragMovedRef.current;
    const active = dragActiveRef.current;
    startCellRef.current = null;
    dragMovedRef.current = false;
    dragActiveRef.current = false;

    if (!moved) {
      updatePreview(null);
      if (startCell) onCellPressRef.current(startCell);
      return;
    }
    if (active && next && !pathsEqual(next, pathRef.current)) {
      const committedPath = next.length >= pathRef.current.length ? connectFinishIfAdjacent(next, finish, level) : next;
      if (committedPath.length > pathRef.current.length) {
        let common = 0;
        while (common < pathRef.current.length && common < committedPath.length && sameCell(pathRef.current[common], committedPath[common])) common += 1;
        keepShadowUntilBuilt(committedPath.slice(Math.max(0, common - 1)));
      }
      updatePreview(null);
      onPathCommitRef.current(committedPath);
      return;
    }
    updatePreview(null);
  };

  const cancelGesture = () => {
    onInteractionChangeRef.current?.(false);
    startCellRef.current = null;
    dragMovedRef.current = false;
    dragActiveRef.current = false;
    updatePreview(null);
  };

  const previewRoute = useMemo(() => {
    if (!previewPath || pathsEqual(previewPath, path)) return null;
    let common = 0;
    while (common < path.length && common < previewPath.length && sameCell(path[common], previewPath[common])) common += 1;
    return previewPath.slice(Math.max(0, common - 1));
  }, [path, previewPath]);
  const pieces = useMemo(() => {
    const result = new Map<string, { source: ImageSourcePropType; rotation: number; kind: PieceKind; revealDelay: number; shouldReveal: boolean }>();
    path.forEach((cell, index) => {
      const piece = pieceForPath(path, index, finish);
      const source = piece.kind === 'straight' ? straightBridge
        : piece.kind === 'corner' ? cornerBridge
          : piece.kind === 'start' ? startPlatform : finishPlatform;
      const shouldReveal = buildStartIndex !== null && index >= buildStartIndex;
      const revealDelay = shouldReveal ? Math.min((index - buildStartIndex + 1) * BUILD_STEP_DELAY, BUILD_DELAY_LIMIT) : 0;
      result.set(cellKey(cell), { source, rotation: piece.solutionRotation, kind: piece.kind, revealDelay, shouldReveal });
    });
    if (!result.has(cellKey(finish))) {
      const solutionPiece = pieceForPath(level.cells, level.cells.length - 1, finish);
      result.set(cellKey(finish), { source: finishPlatform, rotation: solutionPiece.solutionRotation, kind: 'finish', revealDelay: 0, shouldReveal: false });
    }
    return result;
  }, [buildStartIndex, finish, level.cells, path]);
  const countPath = previewPath ?? path;
  const counts = useMemo(() => pathCounts(level, countPath), [countPath, level]);
  const occupied = useMemo(() => new Set(path.map(cellKey)), [path]);
  const renderedPreviewRoute = previewRoute ?? buildShadowRoute;

  return (
    <View style={[styles.shell, { width: boardSize + clueSize, height: boardSize + clueSize }]}> 
      <View style={[styles.topClues, { marginLeft: clueSize, width: boardSize, height: clueSize }]}> 
        {level.colClues.map((clue, index) => {
          const value = counts.cols[index];
          return (
            <View key={`col-${index}`} style={[styles.clueSlot, { width: tileSize }]}>
              <View style={[styles.clueBadge, value === clue && styles.clueBadgeComplete, value > clue && styles.clueBadgeExceeded]}>
                <Text style={[styles.clue, value === clue && styles.clueComplete, value > clue && styles.clueExceeded]}>{clue}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.boardRow}>
        <View style={{ width: clueSize, height: boardSize }}>
          {level.rowClues.map((clue, index) => {
            const value = counts.rows[index];
            return (
              <View key={`row-${index}`} style={[styles.sideClue, { height: tileSize }]}> 
                <View style={[styles.clueBadge, value === clue && styles.clueBadgeComplete, value > clue && styles.clueBadgeExceeded]}>
                  <Text style={[styles.clue, value === clue && styles.clueComplete, value > clue && styles.clueExceeded]}>{clue}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <ImageBackground source={valley} resizeMode="cover" style={[styles.board, { width: boardSize, height: boardSize }]} imageStyle={styles.boardImage}>
          {Array.from({ length: level.size }).map((_, row) => (
            <View key={`board-row-${row}`} style={styles.tileRow}>
              {Array.from({ length: level.size }).map((__, col) => {
                const cell = { row, col };
                const key = cellKey(cell);
                const piece = pieces.get(key);
                const blocked = isBlocked(level, cell);
                const oneWay = level.oneWays.find((rule) => sameCell(rule.cell, cell));
                const checkpoint = level.checkpoints.some((required) => sameCell(required, cell));
                const canExtend = !blocked && !occupied.has(key) && canTravel(level, end, cell);
                const pathIndex = path.findIndex((placed) => sameCell(placed, cell));
                const canUndo = pathIndex > 0;
                const isEnd = sameCell(end, cell);
                return (
                  <Pressable
                    key={key}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityLabel={`${text.square} ${row + 1}, ${col + 1}${canUndo ? `, ${text.undoRoad}` : ''}`}
                    onPress={() => onCellPress(cell)}
                    style={({ pressed }) => [
                    styles.tile,
                    { width: tileSize, height: tileSize },
                    pressed && (canExtend || canUndo) && styles.tilePressed,
                    ]}>
                    <View style={styles.tileShade} />
                    {blocked && <Image source={boulderAsset} resizeMode="contain" style={styles.boulderAsset} fadeDuration={0} />}
                    {checkpoint && <Image source={checkpointAsset} resizeMode="contain" style={styles.checkpointAsset} fadeDuration={0} />}
                    {oneWay && (
                      <Image source={oneWayAsset} resizeMode="contain" fadeDuration={0}
                        style={[styles.oneWayAsset, { transform: [{ rotate: oneWay.direction === 'N' ? '0deg' : oneWay.direction === 'E' ? '90deg' : oneWay.direction === 'S' ? '180deg' : '270deg' }] }]} />
                    )}
                    {canExtend && <View style={styles.availableStep} />}
                    {piece ? (
                      <AnimatedBridgePiece
                        key={`${key}-${piece.kind}-${piece.rotation}`}
                        source={piece.source}
                        rotation={piece.rotation}
                        kind={piece.kind}
                        revealDelay={piece.revealDelay}
                        shouldReveal={piece.shouldReveal}
                        removing={piece.kind !== 'finish' && removingCellKey === key}
                        startLabel={text.startPoint}
                      />
                    ) : null}
                    {canUndo && isEnd && <View style={styles.undoBadge}><Text style={styles.undoText}>−</Text></View>}
                  </Pressable>
                );
              })}
            </View>
          ))}
          {renderedPreviewRoute && (
            <View pointerEvents="none" style={styles.previewLayer}>
              {renderedPreviewRoute.slice(1).map((cell, index) => {
                const previous = renderedPreviewRoute[index];
                const horizontal = previous.row === cell.row;
                const thickness = Math.max(8, tileSize * 0.15);
                const left = horizontal
                  ? Math.min(previous.col, cell.col) * tileSize + tileSize / 2
                  : cell.col * tileSize + (tileSize - thickness) / 2;
                const top = horizontal
                  ? cell.row * tileSize + (tileSize - thickness) / 2
                  : Math.min(previous.row, cell.row) * tileSize + tileSize / 2;
                return <PreviewSegment key={`preview-${cellKey(previous)}-${cellKey(cell)}`} horizontal={horizontal} fading={buildShadowRoute !== null && index < buildShadowHidden} left={left} top={top} width={horizontal ? tileSize : thickness} height={horizontal ? thickness : tileSize} />;
              })}
              {renderedPreviewRoute.length > 0 && (() => {
                const last = renderedPreviewRoute[renderedPreviewRoute.length - 1];
                const dotSize = Math.max(18, tileSize * 0.3);
                const haloSize = dotSize * 1.85;
                return (
                  <View style={[styles.previewEndHalo, { width: haloSize, height: haloSize, borderRadius: haloSize / 2, left: last.col * tileSize + (tileSize - haloSize) / 2, top: last.row * tileSize + (tileSize - haloSize) / 2 }]}>
                    <View style={[styles.previewEndMiddle, { width: dotSize * 1.25, height: dotSize * 1.25, borderRadius: dotSize }]} />
                    <View style={[styles.previewEndCore, { width: dotSize, height: dotSize, borderRadius: dotSize / 2 }]}>
                      <View style={styles.previewEndHighlight} />
                    </View>
                  </View>
                );
              })()}
            </View>
          )}
          <View
            pointerEvents={disabled ? 'none' : 'auto'}
            style={styles.gestureLayer}
            onStartShouldSetResponder={() => !disabled}
            onMoveShouldSetResponder={() => !disabled}
            onResponderGrant={(event) => beginAt(cellAtPoint(event.nativeEvent.locationX, event.nativeEvent.locationY))}
            onResponderMove={(event) => moveTo(cellAtPoint(event.nativeEvent.locationX, event.nativeEvent.locationY))}
            onResponderRelease={finishGesture}
            onResponderTerminate={cancelGesture}
            onResponderTerminationRequest={() => false}
          />
        </ImageBackground>
      </View>
    </View>
  );
}

const PreviewSegment = memo(function PreviewSegment({
  horizontal,
  fading,
  left,
  top,
  width,
  height,
}: {
  horizontal: boolean;
  fading: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  const [visibility] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const animation = Animated.timing(visibility, {
      toValue: fading ? 0 : 1,
      duration: fading ? 120 : 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [fading, visibility]);

  return (
    <Animated.View style={[styles.previewSegment, { left, top, width, height, opacity: visibility }]}>
      <View style={[styles.previewSegmentHalo, horizontal ? styles.previewHaloHorizontal : styles.previewHaloVertical]} />
      <View style={styles.previewSegmentBody} />
      <View style={[styles.previewSegmentGlint, horizontal ? styles.previewGlintHorizontal : styles.previewGlintVertical]} />
    </Animated.View>
  );
});

const AnimatedBridgePiece = memo(function AnimatedBridgePiece({
  source,
  rotation,
  kind,
  revealDelay,
  shouldReveal,
  removing,
  startLabel,
}: {
  source: ImageSourcePropType;
  rotation: number;
  kind: PieceKind;
  revealDelay: number;
  shouldReveal: boolean;
  removing: boolean;
  startLabel: string;
}) {
  const [entrance] = useState(() => new Animated.Value(shouldReveal ? 0 : 1));
  const [revealGlow] = useState(() => new Animated.Value(shouldReveal ? 0 : 1));
  const [departure] = useState(() => new Animated.Value(0));
  const [initialDelay] = useState(revealDelay);
  const [initialShouldReveal] = useState(shouldReveal);

  useEffect(() => {
    if (!initialShouldReveal) return;
    entrance.setValue(0);
    revealGlow.setValue(0);
    const animation = Animated.sequence([
      Animated.delay(initialDelay),
      Animated.parallel([
        Animated.timing(entrance, {
          toValue: 1,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(revealGlow, {
          toValue: 1,
          duration: 440,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);
    animation.start();
    return () => animation.stop();
  }, [entrance, initialDelay, initialShouldReveal, revealGlow]);

  useEffect(() => {
    const animation = Animated.timing(departure, {
      toValue: removing ? 1 : 0,
      duration: removing ? 45 : 55,
      easing: removing ? Easing.in(Easing.cubic) : Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [departure, removing]);

  return (
    <Animated.View style={[
      styles.pieceWrap,
      {
        opacity: departure.interpolate({ inputRange: [0, 1], outputRange: [1, 0], extrapolate: 'clamp' }),
        transform: [
          { rotate: `${rotation}deg` },
          { scale: departure.interpolate({ inputRange: [0, 1], outputRange: [1, 0.78], extrapolate: 'clamp' }) },
          { translateY: departure.interpolate({ inputRange: [0, 1], outputRange: [0, -8], extrapolate: 'clamp' }) },
        ],
      },
    ]}> 
      <Animated.View
        style={[
          styles.pieceEntrance,
          {
            opacity: entrance.interpolate({
              inputRange: [0, 0.3, 1],
              outputRange: [0, 0.68, 1],
              extrapolate: 'clamp',
            }),
            transform: [
              { scale: entrance.interpolate({ inputRange: [0, 0.82, 1], outputRange: [0.76, 1.018, 1], extrapolate: 'clamp' }) },
              { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [11, 0], extrapolate: 'clamp' }) },
              { rotate: entrance.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '0deg'], extrapolate: 'clamp' }) },
            ],
          },
        ]}>
        <Image
          source={source}
          resizeMode="contain"
          style={[
            styles.piece,
            kind === 'start' && styles.startPiece,
            kind === 'finish' && styles.finishPiece,
          ]}
          fadeDuration={0}
        />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pieceRevealGlow,
          {
            opacity: revealGlow.interpolate({
              inputRange: [0, 0.18, 0.72, 1],
              outputRange: [0, 0.44, 0.12, 0],
              extrapolate: 'clamp',
            }),
            transform: [{ scale: revealGlow.interpolate({ inputRange: [0, 1], outputRange: [0.58, 1.28], extrapolate: 'clamp' }) }],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.buildDust,
          styles.buildDustLeft,
          {
            opacity: revealGlow.interpolate({ inputRange: [0, 0.16, 0.72, 1], outputRange: [0, 0.34, 0.1, 0], extrapolate: 'clamp' }),
            transform: [
              { translateY: revealGlow.interpolate({ inputRange: [0, 1], outputRange: [8, -13], extrapolate: 'clamp' }) },
              { translateX: revealGlow.interpolate({ inputRange: [0, 1], outputRange: [0, -7], extrapolate: 'clamp' }) },
              { scale: revealGlow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1.25], extrapolate: 'clamp' }) },
            ],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.buildDust,
          styles.buildDustRight,
          {
            opacity: revealGlow.interpolate({ inputRange: [0, 0.22, 0.78, 1], outputRange: [0, 0.27, 0.08, 0], extrapolate: 'clamp' }),
            transform: [
              { translateY: revealGlow.interpolate({ inputRange: [0, 1], outputRange: [10, -9], extrapolate: 'clamp' }) },
              { translateX: revealGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 8], extrapolate: 'clamp' }) },
              { scale: revealGlow.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.05], extrapolate: 'clamp' }) },
            ],
          },
        ]}
      />
      {(kind === 'start' || kind === 'finish') && (
        <View
          pointerEvents="none"
          style={[
            styles.landmarkLayer,
            { transform: [{ rotate: `${-rotation}deg` }] },
          ]}>
          {kind === 'start' && <View style={styles.startHalo} />}
          <Image
            source={kind === 'start' ? startHikerUpright : finishCabinUpright}
            resizeMode="contain"
            fadeDuration={0}
            style={kind === 'start' ? styles.startLandmark : styles.finishLandmark}
          />
          {kind === 'start' && (
            <View style={styles.startBadge}>
              <Text style={styles.startBadgeArrow}>▶</Text>
              <Text numberOfLines={1} style={styles.startBadgeText}>{startLabel}</Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  shell: { alignSelf: 'center' },
  topClues: { flexDirection: 'row' },
  boardRow: { flexDirection: 'row' },
  clueSlot: { alignItems: 'center', justifyContent: 'center' },
  sideClue: { justifyContent: 'center', alignItems: 'center' },
  clueBadge: { width: 29, height: 29, borderRadius: 9, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  clueBadgeComplete: { backgroundColor: '#146d40', borderColor: 'rgba(142,255,181,0.82)', shadowColor: '#45e982', shadowOpacity: 0.42, shadowRadius: 11, shadowOffset: { width: 0, height: 1 }, elevation: 3 },
  clueBadgeExceeded: { backgroundColor: '#942f34', borderColor: 'rgba(255,177,169,0.84)', shadowColor: '#ed6568', shadowOpacity: 0.46, shadowRadius: 11, shadowOffset: { width: 0, height: 1 }, elevation: 3 },
  clue: { color: palette.cream, fontSize: 20, lineHeight: 24, fontWeight: '900', textShadowColor: palette.shadow, textShadowRadius: 4, textShadowOffset: { width: 0, height: 2 } },
  clueComplete: { color: '#d8ffe4', textShadowColor: '#063f20', textShadowRadius: 3 },
  clueExceeded: { color: '#fff0ed', textShadowColor: '#5c0b0e', textShadowRadius: 3 },
  board: { borderWidth: 3, borderColor: '#222d2b', borderRadius: 13, overflow: 'hidden', backgroundColor: '#354540' },
  boardImage: { opacity: 0.54 },
  tileRow: { flexDirection: 'row' },
  tile: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(226, 232, 220, 0.34)', overflow: 'visible', alignItems: 'center', justifyContent: 'center' },
  tileShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(18, 28, 25, 0.18)' },
  boulderAsset: { position: 'absolute', zIndex: 5, width: '94%', height: '94%' },
  checkpointAsset: { position: 'absolute', zIndex: 7, width: '52%', height: '52%' },
  oneWayAsset: { position: 'absolute', zIndex: 8, width: '58%', height: '58%' },
  tilePressed: { opacity: 0.72 },
  previewLayer: { ...StyleSheet.absoluteFill, zIndex: 12 },
  previewSegment: { position: 'absolute', borderRadius: 99 },
  previewSegmentHalo: { ...StyleSheet.absoluteFill, borderRadius: 99, backgroundColor: 'rgba(225,183,91,0.08)' },
  previewHaloHorizontal: { transform: [{ scaleX: 1.08 }, { scaleY: 1.85 }] },
  previewHaloVertical: { transform: [{ scaleX: 1.85 }, { scaleY: 1.08 }] },
  previewSegmentBody: { ...StyleSheet.absoluteFill, borderRadius: 99, backgroundColor: 'rgba(245,216,151,0.34)', borderWidth: 1, borderColor: 'rgba(255,247,220,0.38)' },
  previewSegmentGlint: { position: 'absolute', borderRadius: 99, backgroundColor: 'rgba(255,252,235,0.67)' },
  previewGlintHorizontal: { left: '9%', right: '9%', top: '32%', height: 1 },
  previewGlintVertical: { top: '9%', bottom: '9%', left: '32%', width: 1 },
  previewEndHalo: { position: 'absolute', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(225,183,91,0.07)' },
  previewEndMiddle: { position: 'absolute', backgroundColor: 'rgba(246,215,145,0.2)', borderWidth: 1, borderColor: 'rgba(255,243,207,0.24)' },
  previewEndCore: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,226,157,0.72)', borderWidth: 1, borderColor: 'rgba(255,251,232,0.72)' },
  previewEndHighlight: { position: 'absolute', left: '24%', top: '20%', width: '25%', height: '25%', borderRadius: 99, backgroundColor: 'rgba(255,255,247,0.82)' },
  gestureLayer: { ...StyleSheet.absoluteFill, zIndex: 20, backgroundColor: 'transparent' },
  availableStep: { width: '18%', aspectRatio: 1, borderRadius: 99, backgroundColor: 'rgba(255,225,151,0.82)', shadowColor: palette.gold, shadowOpacity: 0.28, shadowRadius: 11 },
  undoBadge: { position: 'absolute', right: 3, top: 3, width: 17, height: 17, borderRadius: 9, backgroundColor: 'rgba(20,29,27,0.84)', alignItems: 'center', justifyContent: 'center' },
  undoText: { color: palette.cream, fontSize: 15, lineHeight: 16, fontWeight: '900' },
  pieceWrap: { position: 'absolute', left: '-2%', top: '-2%', width: '104%', height: '104%' },
  pieceEntrance: { width: '100%', height: '100%' },
  piece: { position: 'absolute', width: '100%', height: '100%' },
  startPiece: { left: '2%', top: '-2.5%' },
  finishPiece: { left: '2%', top: '-6%' },
  landmarkLayer: { ...StyleSheet.absoluteFill, zIndex: 8, alignItems: 'center', justifyContent: 'center' },
  startLandmark: { position: 'absolute', width: '54%', height: '68%', top: '20%' },
  finishLandmark: { position: 'absolute', width: '66%', height: '66%', top: '16%', right: '13%' },
  startHalo: { position: 'absolute', width: '72%', height: '72%', borderRadius: 999, backgroundColor: 'rgba(49,213,126,0.13)', borderWidth: 2, borderColor: 'rgba(105,255,174,0.88)', shadowColor: '#4dff9c', shadowOpacity: 0.78, shadowRadius: 10, elevation: 5 },
  startBadge: { position: 'absolute', top: 1, alignSelf: 'center', minWidth: 39, height: 17, borderRadius: 9, paddingHorizontal: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: '#0d8a4d', borderWidth: 1, borderColor: '#a8ffd1', shadowColor: '#40f395', shadowOpacity: 0.72, shadowRadius: 7, elevation: 8 },
  startBadgeArrow: { color: '#f5fff8', fontSize: 7, lineHeight: 9, fontWeight: '900' },
  startBadgeText: { color: '#f5fff8', fontSize: 6, lineHeight: 8, fontWeight: '900', letterSpacing: 0.35 },
  pieceRevealGlow: { position: 'absolute', left: '16%', right: '16%', top: '16%', bottom: '16%', borderRadius: 999, backgroundColor: 'rgba(237,203,132,0.13)' },
  buildDust: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(232,210,166,0.72)', shadowColor: '#f4ddaa', shadowOpacity: 0.22, shadowRadius: 8 },
  buildDustLeft: { left: '32%', top: '57%' },
  buildDustRight: { right: '29%', top: '49%', width: 7, height: 7, borderRadius: 4 },
});
