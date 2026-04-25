import Ionicons from '@expo/vector-icons/Ionicons';
import * as Updates from 'expo-updates';
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { ColorSchemePreference, useColorSchemePreference } from '@/context/color-scheme';
import { useBuildVariant } from '@/hooks/use-build-variant';
import { useColorScheme } from '@/hooks/use-color-scheme';

const SCHEME_OPTIONS: { value: ColorSchemePreference; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

function SectionHeader({ title }: { title: string }) {
  return <ThemedText style={styles.sectionHeader}>{title}</ThemedText>;
}

function InfoRow({ label, value, last = false, borderColor }: { label: string; value: string; last?: boolean; borderColor: string }) {
  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
      <ThemedText style={styles.infoLabel}>{label}</ThemedText>
      <ThemedText style={styles.infoValue} numberOfLines={1}>{value}</ThemedText>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const build = useBuildVariant();
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { preference, setPreference } = useColorSchemePreference();

  const { isUpdateAvailable, isChecking, lastCheckForUpdateTimeSinceRestart } = Updates.useUpdates();

  const surfaceBg = scheme === 'dark' ? '#1a1f20' : '#f5f9fa';
  const borderColor = scheme === 'dark' ? '#2a3538' : '#ddedf2';

  async function checkForUpdate() {
    try {
      await Updates.checkForUpdateAsync();
    } catch {
      // In dev/debug builds checkForUpdateAsync throws — silently ignore
    }
  }

  async function applyUpdate() {
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch {
      // no-op
    }
  }

  const lastChecked = lastCheckForUpdateTimeSinceRestart
    ? new Date(lastCheckForUpdateTimeSinceRestart).toLocaleTimeString()
    : 'Not checked yet';

  return (
    <ThemedView style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.pageHeader}>
          <ThemedText style={styles.pageTitle}>Settings</ThemedText>
        </View>

        {/* Appearance */}
        <SectionHeader title="Appearance" />
        <View style={[styles.card, { backgroundColor: surfaceBg, borderColor }]}>
          <ThemedText style={styles.cardLabel}>Color Theme</ThemedText>
          <View style={styles.schemeRow}>
            {SCHEME_OPTIONS.map((opt) => {
              const active = preference === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setPreference(opt.value)}
                  style={[
                    styles.schemeBtn,
                    { borderColor: active ? colors.tint : borderColor },
                    active && { backgroundColor: colors.tint + '15' },
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name={opt.icon} size={20} color={active ? colors.tint : colors.icon} />
                  <ThemedText style={[styles.schemeBtnText, active && { color: colors.tint, fontWeight: '700' }]}>
                    {opt.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* OTA Updates */}
        <SectionHeader title="App Updates" />
        <View style={[styles.card, { backgroundColor: surfaceBg, borderColor }]}>
          <View style={styles.otaRow}>
            <View style={[styles.otaIcon, { backgroundColor: colors.tint + '18' }]}>
              <Ionicons name="cloud-download-outline" size={22} color={colors.tint} />
            </View>
            <View style={styles.otaInfo}>
              <ThemedText style={styles.otaTitle}>Over-the-Air Updates</ThemedText>
              <ThemedText style={styles.otaSub}>Last checked: {lastChecked}</ThemedText>
            </View>
            {isUpdateAvailable && (
              <View style={[styles.updateBadge, { backgroundColor: '#059669' }]}>
                <ThemedText style={styles.updateBadgeText}>New</ThemedText>
              </View>
            )}
          </View>

          <View style={[styles.otaDivider, { backgroundColor: borderColor }]} />

          {isUpdateAvailable ? (
            <TouchableOpacity
              style={[styles.otaBtn, { backgroundColor: '#059669' }]}
              onPress={applyUpdate}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-down-circle-outline" size={18} color="#fff" />
              <ThemedText style={styles.otaBtnText}>Install Update & Restart</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.otaBtn, { backgroundColor: colors.tint, opacity: isChecking ? 0.6 : 1 }]}
              onPress={checkForUpdate}
              disabled={isChecking}
              activeOpacity={0.8}
            >
              <Ionicons name={isChecking ? 'sync-outline' : 'refresh-outline'} size={18} color="#fff" />
              <ThemedText style={styles.otaBtnText}>
                {isChecking ? 'Checking…' : 'Check for Update'}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Build info */}
        <SectionHeader title="Build Info" />
        <View style={[styles.card, { backgroundColor: surfaceBg, borderColor, paddingHorizontal: 0, paddingVertical: 0 }]}>
          <View style={[styles.buildBadgeRow, { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
            <View style={[styles.buildBadge, { backgroundColor: build.color }]}>
              <ThemedText style={styles.buildBadgeText}>{build.label}</ThemedText>
            </View>
          </View>
          <InfoRow label="Variant" value={build.variant} borderColor={borderColor} />
          <InfoRow label="Platform" value={`${build.platform.toUpperCase()} · ${Platform.Version}`} borderColor={borderColor} />
          <InfoRow label="Debug / Metro" value={build.isDebug ? 'Yes' : 'No'} borderColor={borderColor} />
          <InfoRow label="EAS Channel" value={build.channel ?? '—'} borderColor={borderColor} />
          <InfoRow label="Runtime version" value={build.runtimeVersion ?? '—'} borderColor={borderColor} />
          <InfoRow label="Update ID" value={build.updateId ? build.updateId.slice(0, 12) + '…' : '—'} last borderColor={borderColor} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  pageHeader: { paddingVertical: 20 },
  pageTitle: { fontSize: 28, fontWeight: '800' },

  sectionHeader: { fontSize: 13, fontWeight: '600', opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 8 },

  card: { borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1 },
  cardLabel: { fontSize: 14, fontWeight: '600', marginBottom: 12 },

  schemeRow: { flexDirection: 'row', gap: 8 },
  schemeBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, gap: 6 },
  schemeBtnText: { fontSize: 12, fontWeight: '600' },

  otaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  otaIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  otaInfo: { flex: 1 },
  otaTitle: { fontSize: 14, fontWeight: '700' },
  otaSub: { fontSize: 12, opacity: 0.5, marginTop: 2 },
  updateBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  updateBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  otaDivider: { height: 1, marginBottom: 14 },
  otaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 12 },
  otaBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  buildBadgeRow: { paddingHorizontal: 16, paddingVertical: 12 },
  buildBadge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  buildBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  infoLabel: { fontSize: 14, opacity: 0.55 },
  infoValue: { fontSize: 14, fontWeight: '600', maxWidth: '55%', textAlign: 'right' },
});
