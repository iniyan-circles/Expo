import { Platform, StyleSheet, View } from 'react-native';
import { useBuildVariant } from '@/hooks/use-build-variant';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      <ThemedText style={styles.rowValue}>{value}</ThemedText>
    </View>
  );
}

export default function SettingsScreen() {
  const build = useBuildVariant();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.heading}>Build Info</ThemedText>

      <View style={[styles.badge, { backgroundColor: build.color }]}>
        <ThemedText style={styles.badgeText}>{build.label}</ThemedText>
      </View>

      <View style={styles.table}>
        <Row label="Variant" value={build.variant} />
        <Row label="Platform" value={build.platform.toUpperCase()} />
        <Row label="Debug mode" value={build.isDebug ? 'Yes (Metro)' : 'No (bundled)'} />
        <Row label="EAS Channel" value={build.channel ?? '—'} />
        <Row label="Runtime version" value={build.runtimeVersion ?? '—'} />
        <Row label="Update ID" value={build.updateId ? build.updateId.slice(0, 8) + '…' : '—'} />
        <Row label="OS version" value={Platform.Version?.toString() ?? '—'} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    gap: 20,
  },
  heading: {
    marginBottom: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  table: {
    gap: 0,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  rowLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
});
