import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const USED_GB = 14.2;
const TOTAL_GB = 20;
const USAGE_PCT = USED_GB / TOTAL_GB;

const QUICK_ACTIONS: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; color: string }[] = [
  { icon: 'add-circle-outline', label: 'Top Up', color: '#0a7ea4' },
  { icon: 'airplane-outline', label: 'Roaming', color: '#7c3aed' },
  { icon: 'receipt-outline', label: 'Billing', color: '#0891b2' },
  { icon: 'headset-outline', label: 'Support', color: '#059669' },
];

const RECENT: { label: string; sub: string; amount: string; positive: boolean }[] = [
  { label: 'Data Top-Up', sub: 'Today, 9:41 AM', amount: '+5 GB', positive: true },
  { label: 'Monthly Plan', sub: 'Apr 21', amount: '-$28.00', positive: false },
  { label: 'Roaming Pack', sub: 'Apr 18', amount: '-$12.00', positive: false },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  const cardBg = scheme === 'dark' ? '#1e2b30' : '#e8f4f8';
  const surfaceBg = scheme === 'dark' ? '#1a1f20' : '#f5f9fa';
  const borderColor = scheme === 'dark' ? '#2a3538' : '#ddedf2';

  return (
    <ThemedView style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.greeting}>Good morning</ThemedText>
            <ThemedText style={[styles.planBadge, { color: colors.tint }]}>CirclesCare Plan</ThemedText>
          </View>
          <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
            <ThemedText style={styles.avatarText}>CC</ThemedText>
          </View>
        </View>

        {/* Data usage card */}
        <View style={[styles.usageCard, { backgroundColor: colors.tint }]}>
          <ThemedText style={styles.usageLabel}>Data Usage</ThemedText>
          <View style={styles.usageRow}>
            <ThemedText style={styles.usageNumber}>{USED_GB}</ThemedText>
            <ThemedText style={styles.usageUnit}> / {TOTAL_GB} GB</ThemedText>
          </View>
          {/* Progress track */}
          <View style={styles.trackBg}>
            <View style={[styles.trackFill, { width: `${USAGE_PCT * 100}%` }]} />
          </View>
          <ThemedText style={styles.usageFooter}>
            {(TOTAL_GB - USED_GB).toFixed(1)} GB remaining · resets in 9 days
          </ThemedText>
        </View>

        {/* Quick actions */}
        <View style={[styles.section, { backgroundColor: surfaceBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map((a) => (
              <TouchableOpacity key={a.label} style={[styles.actionBtn, { borderColor }]} activeOpacity={0.7}>
                <View style={[styles.actionIcon, { backgroundColor: a.color + '18' }]}>
                  <Ionicons name={a.icon} size={24} color={a.color} />
                </View>
                <ThemedText style={styles.actionLabel}>{a.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* My plan */}
        <View style={[styles.section, { backgroundColor: surfaceBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>My Plan</ThemedText>
          <TouchableOpacity onPress={() => router.push('/plan-detail')} activeOpacity={0.8}>
          <View style={[styles.planCard, { backgroundColor: cardBg }]}>
            <View style={styles.planRow}>
              <Ionicons name="layers-outline" size={18} color={colors.tint} />
              <ThemedText style={styles.planName}>CirclesCare 20GB</ThemedText>
              <View style={[styles.activePill, { backgroundColor: colors.tint + '22' }]}>
                <ThemedText style={[styles.activePillText, { color: colors.tint }]}>Active</ThemedText>
              </View>
            </View>
            <View style={styles.planMeta}>
              <View style={styles.planMetaItem}>
                <ThemedText style={styles.planMetaLabel}>Monthly</ThemedText>
                <ThemedText style={[styles.planMetaValue, { color: colors.tint }]}>$28.00</ThemedText>
              </View>
              <View style={[styles.planDivider, { backgroundColor: borderColor }]} />
              <View style={styles.planMetaItem}>
                <ThemedText style={styles.planMetaLabel}>Valid until</ThemedText>
                <ThemedText style={[styles.planMetaValue, { color: colors.tint }]}>May 21, 2026</ThemedText>
              </View>
            </View>
          </View>
          </TouchableOpacity>
        </View>

        {/* Recent activity */}
        <View style={[styles.section, { backgroundColor: surfaceBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
          {RECENT.map((item, i) => (
            <View key={i} style={[styles.activityRow, i < RECENT.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }]}>
              <View style={[styles.activityDot, { backgroundColor: item.positive ? '#059669' : colors.tint }]} />
              <View style={styles.activityInfo}>
                <ThemedText style={styles.activityLabel}>{item.label}</ThemedText>
                <ThemedText style={styles.activitySub}>{item.sub}</ThemedText>
              </View>
              <ThemedText style={[styles.activityAmount, { color: item.positive ? '#059669' : colors.text }]}>
                {item.amount}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
  greeting: { fontSize: 22, fontWeight: '700' },
  planBadge: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  usageCard: { borderRadius: 20, padding: 22, marginBottom: 16 },
  usageLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500', marginBottom: 6 },
  usageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14 },
  usageNumber: { color: '#fff', fontSize: 48, fontWeight: '800', lineHeight: 52 },
  usageUnit: { color: 'rgba(255,255,255,0.75)', fontSize: 18, fontWeight: '500', paddingBottom: 6 },
  trackBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, marginBottom: 10 },
  trackFill: { height: 8, backgroundColor: '#fff', borderRadius: 4 },
  usageFooter: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },

  section: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 14 },

  actionsGrid: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '600' },

  planCard: { borderRadius: 12, padding: 14 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  planName: { fontSize: 15, fontWeight: '700', flex: 1 },
  activePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  activePillText: { fontSize: 11, fontWeight: '700' },
  planMeta: { flexDirection: 'row', alignItems: 'center' },
  planMetaItem: { flex: 1, alignItems: 'center', gap: 4 },
  planMetaLabel: { fontSize: 12, opacity: 0.6 },
  planMetaValue: { fontSize: 15, fontWeight: '700' },
  planDivider: { width: 1, height: 32 },

  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityInfo: { flex: 1 },
  activityLabel: { fontSize: 14, fontWeight: '600' },
  activitySub: { fontSize: 12, opacity: 0.5, marginTop: 2 },
  activityAmount: { fontSize: 14, fontWeight: '700' },
});
