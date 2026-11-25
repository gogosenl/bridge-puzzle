import { router } from 'expo-router';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { palette } from '@/constants/palette';
import { useCopy } from '@/i18n/translations';
import { useGameAudio } from '@/state/audio';
import { Language, useSettings } from '@/state/settings';

const valley = require('../../assets/game/valley.png');

function ToggleRow({ icon, title, description, enabled, onChange, onText, offText }: {
  icon: string; title: string; description: string; enabled: boolean;
  onChange: (enabled: boolean) => void; onText: string; offText: string;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}><Text style={styles.settingIconText}>{icon}</Text></View>
      <View style={styles.settingCopy}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <PressableScale
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled }}
        onPress={() => onChange(!enabled)}
        style={[styles.toggle, enabled && styles.toggleOn]}>
        <View style={[styles.toggleKnob, enabled && styles.toggleKnobOn]} />
        <Text style={[styles.toggleText, enabled && styles.toggleTextOn]}>{enabled ? onText : offText}</Text>
      </PressableScale>
    </View>
  );
}

export default function SettingsScreen() {
  const { language, musicEnabled, effectsEnabled, setLanguage, setMusicEnabled, setEffectsEnabled } = useSettings();
  const { play } = useGameAudio();
  const text = useCopy(language);

  const chooseLanguage = (next: Language) => {
    play('tap');
    setLanguage(next);
  };

  return (
    <ImageBackground source={valley} resizeMode="cover" style={styles.background} imageStyle={styles.backgroundImage}>
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <PressableScale onPress={() => { play('tap'); router.back(); }} style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </PressableScale>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{text.settings}</Text>
            <Text style={styles.subtitle}>{text.settingsSubtitle}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{text.audio}</Text>
            <ToggleRow icon="♫" title={text.music} description={text.musicDescription} enabled={musicEnabled}
              onChange={setMusicEnabled} onText={text.on} offText={text.off} />
            <View style={styles.divider} />
            <ToggleRow icon="◖))" title={text.soundEffects} description={text.effectsDescription} enabled={effectsEnabled}
              onChange={(enabled) => { setEffectsEnabled(enabled); if (enabled) setTimeout(() => play('tap'), 40); }}
              onText={text.on} offText={text.off} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{text.language}</Text>
            <View style={styles.languageRow}>
              {(['tr', 'en'] as const).map((item) => (
                <PressableScale key={item} onPress={() => chooseLanguage(item)}
                  style={[styles.languageButton, language === item && styles.languageButtonActive]}>
                  <Text style={styles.flag}>{item === 'tr' ? 'TR' : 'EN'}</Text>
                  <Text style={[styles.languageText, language === item && styles.languageTextActive]}>
                    {item === 'tr' ? text.turkish : text.english}
                  </Text>
                  {language === item && <Text style={styles.check}>✓</Text>}
                </PressableScale>
              ))}
            </View>
          </View>
          <Text style={styles.savedText}>{text.settingsSaved}</Text>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: palette.ink },
  backgroundImage: { opacity: 0.42 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8,15,14,0.76)' },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14 },
  backButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: palette.panelSoft, alignItems: 'center', justifyContent: 'center' },
  backText: { color: palette.cream, fontSize: 39, lineHeight: 42 },
  headerCopy: { flex: 1 }, headerSpacer: { width: 48 },
  title: { color: palette.cream, textAlign: 'center', fontSize: 25, fontWeight: '900', letterSpacing: 1.5 },
  subtitle: { color: palette.creamMuted, fontSize: 12, textAlign: 'center', marginTop: 2 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 50, gap: 16, width: '100%', maxWidth: 620, alignSelf: 'center' },
  card: { borderRadius: 24, padding: 17, backgroundColor: 'rgba(27,39,36,0.96)', borderWidth: 1, borderColor: 'rgba(235,190,105,0.28)', shadowColor: '#000', shadowOpacity: 0.36, shadowRadius: 18, shadowOffset: { width: 0, height: 9 } },
  sectionLabel: { color: palette.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.8, marginBottom: 10 },
  settingRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center' },
  settingIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(228,180,94,0.13)', borderWidth: 1, borderColor: 'rgba(228,180,94,0.22)' },
  settingIconText: { color: palette.gold, fontSize: 20, fontWeight: '900' },
  settingCopy: { flex: 1, paddingHorizontal: 12 },
  settingTitle: { color: palette.cream, fontSize: 14, fontWeight: '900', letterSpacing: 0.4 },
  settingDescription: { color: palette.creamMuted, fontSize: 10, marginTop: 3, lineHeight: 14 },
  divider: { height: 1, backgroundColor: 'rgba(245,236,216,0.1)', marginVertical: 3 },
  toggle: { width: 74, height: 38, borderRadius: 19, padding: 4, backgroundColor: '#25302d', borderWidth: 1, borderColor: 'rgba(245,236,216,0.16)', justifyContent: 'center' },
  toggleOn: { backgroundColor: palette.mint, borderColor: '#70d9b5' },
  toggleKnob: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#89918d', position: 'absolute', left: 4 },
  toggleKnobOn: { left: 40, backgroundColor: '#f8f0dc' },
  toggleText: { color: palette.creamMuted, fontSize: 7, fontWeight: '900', position: 'absolute', right: 7, letterSpacing: 0.5 },
  toggleTextOn: { color: palette.ink, left: 8, right: undefined },
  languageRow: { flexDirection: 'row', gap: 10 },
  languageButton: { flex: 1, minHeight: 62, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(245,236,216,0.14)', backgroundColor: 'rgba(8,15,14,0.36)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9 },
  languageButtonActive: { borderColor: palette.gold, backgroundColor: 'rgba(228,180,94,0.12)' },
  flag: { color: palette.gold, fontWeight: '900', fontSize: 12 },
  languageText: { color: palette.creamMuted, fontSize: 11, fontWeight: '900', flex: 1 },
  languageTextActive: { color: palette.cream },
  check: { color: palette.mint, fontSize: 17, fontWeight: '900' },
  savedText: { color: palette.creamMuted, opacity: 0.75, fontSize: 10, textAlign: 'center' },
});
