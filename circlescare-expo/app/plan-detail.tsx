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

const FEATURES = [
  { icon: 'cellular-outline' as const, label: '20 GB Data', sub: 'Local + roaming pool' },
  { icon: 'call-outline' as const, label: 'Unlimited Calls', sub: 'Local & IDD to 10 countries' },
  { icon: 'chatbubble-outline' as const, label: 'Unlimited SMS', sub: 'Local only' },
  { icon: 'globe-outline' as const, label: 'Roaming Ready', sub: 'Activate any time from app' },
  { icon: 'shield-checkmark-outline' as const, label: 'Spam Protection', sub: 'Powered by Circles Guard' },
];

const USAGE_BREAKDOWN = [
  { label: 'Streaming', gb: 6.1, color: '#0a7ea4' },
  { label: 'Social', gb: 4.3, color: '#7c3aed' },
  { label: 'Browsing', gb: 2.8, color: '#059669' },
  { label: 'Other', gb: 1.0, color: '#f59e0b' },
];

export default function PlanDetailScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const surfaceBg = scheme === 'dark' ? '#1a1f20' : '#f5f9fa';
  const borderColor = scheme === 'dark' ? '#2a3538' : '#ddedf2';
  const cardBg = scheme === 'dark' ? '#1e2b30' : '#e8f4f8';

  return (
    <ThemedView style={[styles.root, { paddingTop: insets.top }]}>
      {/* Custom header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Plan Details</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Plan hero */}
        <View style={[styles.heroCard, { backgroundColor: colors.tint }]}>
          <View style={styles.heroTop}>
            <View>
              <ThemedText style={styles.heroName}>CirclesCare 20GB</ThemedText>
              <ThemedText style={styles.heroBilling}>Billed monthly</ThemedText>
            </View>
            <View style={styles.heroPriceBox}>
              <ThemedText style={styles.heroPrice}>$28</ThemedText>
              <ThemedText style={styles.heroPriceSub}>/mo</ThemedText>
            </View>
          </View>
          <View style={styles.heroMeta}>
            <View style={styles.heroMetaItem}>
              <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.75)" />
              <ThemedText style={styles.heroMetaText}>Renews May 21, 2026</ThemedText>
            </View>
            <View style={[styles.activePill, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <ThemedText style={styles.activePillText}>Active</ThemedText>
            </View>
          </View>
        </View>

        {/* Data usage */}
        <View style={[styles.section, { backgroundColor: surfaceBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>Data Usage This Month</ThemedText>
          <View style={styles.usageNumbers}>
            <ThemedText style={[styles.usedBig, { color: colors.tint }]}>{USED_GB} GB</ThemedText>
            <ThemedText style={styles.usedOf}> used of {TOTAL_GB} GB</ThemedText>
          </View>
          <View style={styles.trackBg}>
            <View style={[styles.trackFill, { width: `${USAGE_PCT * 100}%`, backgroundColor: colors.tint }]} />
          </View>
          <ThemedText style={styles.usedRemaining}>
            {(TOTAL_GB - USED_GB).toFixed(1)} GB remaining · resets in 9 days
          </ThemedText>

          {/* Breakdown bars */}
          <View style={styles.breakdownList}>
            {USAGE_BREAKDOWN.map((item) => (
              <View key={item.label} style={styles.breakdownRow}>
                <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
                <ThemedText style={styles.breakdownLabel}>{item.label}</ThemedText>
                <View style={styles.breakdownBarBg}>
                  <View style={[styles.breakdownBarFill, {
                    width: `${(item.gb / TOTAL_GB) * 100}%`,
                    backgroundColor: item.color,
                  }]} />
                </View>
                <ThemedText style={styles.breakdownGb}>{item.gb} GB</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Included features */}
        <View style={[styles.section, { backgroundColor: surfaceBg, borderColor }]}>
          <ThemedText style={styles.sectionTitle}>What's Included</ThemedText>
          {FEATURES.map((f, i) => (
            <View key={f.label} style={[
              styles.featureRow,
              i < FEATURES.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor },
            ]}>
              <View style={[styles.featureIcon, { backgroundColor: colors.tint + '18' }]}>
                <Ionicons name={f.icon} size={20} color={colors.tint} />
              </View>
              <View style={styles.featureInfo}>
                <ThemedText style={styles.featureLabel}>{f.label}</ThemedText>
                <ThemedText style={styles.featureSub}>{f.sub}</ThemedText>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btnSecondary, { borderColor: colors.tint }]} activeOpacity={0.7}>
            <ThemedText style={[styles.btnSecondaryText, { color: colors.tint }]}>Change Plan</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: colors.tint }]} activeOpacity={0.8}>
            <ThemedText style={styles.btnPrimaryText}>Upgrade</ThemedText>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={[styles.cancelRow]}>
          <TouchableOpacity activeOpacity={0.6}>
            <ThemedText style={styles.cancelText}>Cancel Plan</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },

  scroll: { paddingHorizontal: 20 },

  heroCard: { borderRadius: 20, padding: 22, marginVertical: 16 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  heroName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  heroBilling: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  heroPriceBox: { flexDirection: 'row', alignItems: 'flex-end' },
  heroPrice: { color: '#fff', fontSize: 36, fontWeight: '800', lineHeight: 40 },
  heroPriceSub: { color: 'rgba(255,255,255,0.75)', fontSize: 15, paddingBottom: 4 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroMetaText: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  activePill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  activePillText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  section: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 14 },

  usageNumbers: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  usedBig: { fontSize: 28, fontWeight: '800' },
  usedOf: { fontSize: 15, opacity: 0.5, paddingBottom: 3 },
  trackBg: { height: 8, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 4, marginBottom: 8 },
  trackFill: { height: 8, borderRadius: 4 },
  usedRemaining: { fontSize: 13, opacity: 0.5, marginBottom: 16 },

  breakdownList: { gap: 10 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { fontSize: 13, width: 72 },
  breakdownBarBg: { flex: 1, height: 6, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 3 },
  breakdownBarFill: { height: 6, borderRadius: 3 },
  breakdownGb: { fontSize: 12, fontWeight: '600', width: 44, textAlign: 'right', opacity: 0.7 },

  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  featureIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featureInfo: { flex: 1 },
  featureLabel: { fontSize: 14, fontWeight: '600' },
  featureSub: { fontSize: 12, opacity: 0.5, marginTop: 2 },

  actions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  btnSecondary: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnSecondaryText: { fontSize: 15, fontWeight: '700' },
  btnPrimary: { flex: 1, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  cancelRow: { alignItems: 'center' },
  cancelText: { fontSize: 14, color: '#ef4444', fontWeight: '500' },
});
