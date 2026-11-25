import type { Language } from '@/state/settings';

export const copy = {
  tr: {
    adventure: '500 BÖLÜMLÜK MACERA', gameTitle: 'TRAIL BUILDER',
    tagline: 'Parçaları yerleştir. Rotayı tamamla. Zirveye ulaş.', launchTagline: 'ROTANI KUR · ZİRVEYE ULAŞ', routePreparing: 'ROTA HAZIRLANIYOR', presents: 'SUNAR', continueAdventure: 'MACERAYA DEVAM ET',
    level: 'BÖLÜM', loading: 'YÜKLENİYOR', levels: 'BÖLÜMLER', levelsSubtitle: 'Köprü uzar, kanyon büyür.',
    difficulty: 'ZORLUK', moves: 'HAMLE', par: 'HEDEF', reset: 'SIFIRLA', hint: 'İPUCU', startPoint: 'BAŞLA',
    instruction: 'Rotayı sürükleyerek çiz; bitişe yaklaşınca son bağlantı otomatik kurulur. Geri sürükleyerek yolu kısalt.',
    bridgeComplete: 'KÖPRÜ TAMAMLANDI', safeRoute: 'Güvenli rota bulundu', stars: 'YILDIZ',
    continue: 'DEVAM ET', backToLevels: 'BÖLÜMLERE DÖN', summitComplete: 'ZİRVE TAMAMLANDI',
    settings: 'AYARLAR', settingsSubtitle: 'Oyunu istediğin gibi ayarla', audio: 'SES', music: 'MÜZİK',
    musicDescription: 'Kanyonun sakin arka plan müziği', soundEffects: 'SES EFEKTLERİ',
    effectsDescription: 'Yol, düğme ve başarı sesleri', language: 'DİL', turkish: 'TÜRKÇE', english: 'ENGLISH',
    on: 'AÇIK', off: 'KAPALI', settingsSaved: 'Ayarların otomatik kaydedilir.',
    square: 'Kare', undoRoad: 'yolu buradan geri al', layer: 'KATMAN', stage: 'ETAP',
    ruleClassic: 'Satır ve sütun sayılarını tamamlayarak güvenli rotayı kur.',
    ruleBoulders: 'Kayalık karelerden geçmeden rotayı tamamla.',
    ruleCheckpoints: 'Parlayan kontrol noktalarının tamamından geç.',
    ruleOneWay: 'Ok işaretli karelerden yalnızca ok yönünde çık.',
    ruleMixed: 'Kayaları aş, kontrol noktalarından geç ve ok yönlerine uy.',
    newRule: 'YENİ KURAL', boulderTitle: 'KAYALIK ENGEL',
    boulderIntro: 'Kayalık karelere köprü kurulamaz. Rotanı bu engellerin çevresinden geçir.',
    checkpointTitle: 'GEÇİŞ NOKTASI',
    checkpointIntro: 'Parlayan geçiş noktalarının tamamından geçmeden bölüm tamamlanmaz.',
    oneWayTitle: 'TEK YÖNLÜ GEÇİT',
    oneWayIntro: 'Bu parçaya istediğin yönden girebilirsin; fakat yalnızca okun gösterdiği yönden çıkabilirsin.',
    hintCoin: 'İPUCU PARASI', layerToken: 'KATMAN PARASI', rewards: 'BÖLÜM ÖDÜLLERİ',
    firstClearReward: 'İlk tamamlanma ödülü', rewardCollected: 'Bu bölümün ödülü daha önce alındı.',
    unlockLayer: 'KATMANI AÇ', layerLocked: 'KATMAN KİLİTLİ', notEnoughTokens: 'Yeterli katman paran yok.',
    unlockPreviousLayer: 'Önce bir önceki katmanı açmalısın.', completePreviousLayer: 'Yeni katmanı açmak için önce mevcut katmanın 50 bölümünü sırayla tamamla.',
    levelLocked: 'Önceki bölümü tamamla', hintCost: 'İpucu bedeli', notEnoughHints: 'Yeterli ipucu paran yok.',
    home: 'ANA SAYFA',
  },
  en: {
    adventure: '500-LEVEL ADVENTURE', gameTitle: 'TRAIL BUILDER',
    tagline: 'Place the pieces. Complete the route. Reach the summit.', launchTagline: 'BUILD THE ROUTE · REACH THE SUMMIT', routePreparing: 'PREPARING ROUTE', presents: 'PRESENTS', continueAdventure: 'CONTINUE ADVENTURE',
    level: 'LEVEL', loading: 'LOADING', levels: 'LEVELS', levelsSubtitle: 'Longer bridges. Deeper canyons.',
    difficulty: 'DIFFICULTY', moves: 'MOVES', par: 'TARGET', reset: 'RESET', hint: 'HINT', startPoint: 'START',
    instruction: 'Drag to draw the route; the final link connects automatically near the finish. Drag back to shorten it.',
    bridgeComplete: 'BRIDGE COMPLETE', safeRoute: 'Safe route found', stars: 'STARS',
    continue: 'CONTINUE', backToLevels: 'BACK TO LEVELS', summitComplete: 'SUMMIT COMPLETE',
    settings: 'SETTINGS', settingsSubtitle: 'Make the game feel right for you', audio: 'AUDIO', music: 'MUSIC',
    musicDescription: 'Calm canyon background music', soundEffects: 'SOUND EFFECTS',
    effectsDescription: 'Road, button and success sounds', language: 'LANGUAGE', turkish: 'TÜRKÇE', english: 'ENGLISH',
    on: 'ON', off: 'OFF', settingsSaved: 'Your settings are saved automatically.',
    square: 'Square', undoRoad: 'remove the road back to here', layer: 'LAYER', stage: 'STAGE',
    ruleClassic: 'Build a safe route that matches every row and column clue.',
    ruleBoulders: 'Complete the route without entering rocky cells.',
    ruleCheckpoints: 'Pass through every glowing checkpoint.',
    ruleOneWay: 'Leave arrow cells only in the direction shown.',
    ruleMixed: 'Avoid rocks, visit checkpoints and follow the arrows.',
    newRule: 'NEW RULE', boulderTitle: 'ROCKY OBSTACLE',
    boulderIntro: 'A bridge cannot be built on rocky cells. Guide your route around these obstacles.',
    checkpointTitle: 'CHECKPOINT',
    checkpointIntro: 'The level cannot be completed until you pass through every glowing checkpoint.',
    oneWayTitle: 'ONE-WAY GATE',
    oneWayIntro: 'You may enter this tile from any side, but you can leave only in the direction of the arrow.',
    hintCoin: 'HINT COINS', layerToken: 'LAYER TOKENS', rewards: 'LEVEL REWARDS',
    firstClearReward: 'First-clear reward', rewardCollected: 'This level reward was already collected.',
    unlockLayer: 'UNLOCK LAYER', layerLocked: 'LAYER LOCKED', notEnoughTokens: 'You do not have enough layer tokens.',
    unlockPreviousLayer: 'Unlock the previous layer first.', completePreviousLayer: 'Complete all 50 levels in the current layer in order to unlock the next layer.',
    levelLocked: 'Complete the previous level', hintCost: 'Hint cost', notEnoughHints: 'You do not have enough hint coins.',
    home: 'HOME',
  },
} as const;

export type Copy = { [K in keyof typeof copy.tr]: string };
export function useCopy(language: Language): Copy {
  return copy[language] as Copy;
}

const names = {
  tr: ['Başlangıç Patikası', 'Yüksek Geçit', 'Kaya Duvarı', 'Işık Noktaları', 'Rüzgâr Yönü', 'Dar Boğaz', 'Bulut Hattı', 'Fırtına Rotası', 'Zirve Altı', 'Efsanevi Zirve'],
  en: ['Trailhead', 'High Pass', 'Rock Wall', 'Light Beacons', 'Wind Direction', 'Narrow Gorge', 'Cloud Line', 'Storm Route', 'Near the Summit', 'Legendary Summit'],
} as const;

export function layerName(language: Language, layer: number) {
  return names[language][Math.max(0, Math.min(9, layer - 1))];
}
