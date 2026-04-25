import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const CATEGORIES = ['All', 'Roaming', 'Data Add-ons', 'Deals', 'Voice & SMS'];

const OFFERS: { title: string; sub: string; price: string; tag: string; color: string }[] = [
  { title: 'Asia Roaming Pack', sub: '15 days · 5 GB data', price: '$18', tag: 'Popular', color: '#7c3aed' },
  { title: 'Data Booster 10GB', sub: 'Valid 30 days', price: '$12', tag: 'Best Value', color: '#0a7ea4' },
  { title: 'Weekend Unlimited', sub: 'Sat & Sun data', price: '$6', tag: 'Limited', color: '#0891b2' },
];

const ADDONS: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; desc: string; price: string }[] = [
  { icon: 'globe-outline', title: 'Global Roaming', desc: '50+ countries covered', price: '$25/mo' },
  { icon: 'wifi-outline', title: 'Extra 5 GB', desc: 'One-time top-up', price: '$8' },
  { icon: 'call-outline', title: 'Unlimited Calls', desc: 'Local & IDD to 10 countries', price: '$15/mo' },
  { icon: 'shield-checkmark-outline', title: 'Device Protection', desc: 'Repair & replacement cover', price: '$5/mo' },
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const inputBg = scheme === 'dark' ? '#1e2b30' : '#f0f6f8';
  const surfaceBg = scheme === 'dark' ? '#1a1f20' : '#f5f9fa';
  const borderColor = scheme === 'dark' ? '#2a3538' : '#ddedf2';

  return (
    <ThemedView style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.heading}>Explore</ThemedText>
          <ThemedText style={styles.headingSub}>Plans, add-ons & deals</ThemedText>
        </View>

        {/* Search */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.searchBar, { backgroundColor: inputBg }]}
          onPress={() => inputRef.current?.focus()}
        >
          <Ionicons name="search-outline" size={18} color={colors.icon} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search plans, add-ons…"
            placeholderTextColor={colors.icon}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.icon} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsScroll}
        >
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                style={[
                  styles.chip,
                  { borderColor: active ? colors.tint : borderColor },
                  active && { backgroundColor: colors.tint },
                ]}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Featured offers */}
        <ThemedText style={styles.sectionTitle}>Featured Offers</ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offersScroll}
          style={styles.offersRow}
        >
          {OFFERS.map((offer) => (
            <TouchableOpacity
              key={offer.title}
              style={[styles.offerCard, { backgroundColor: offer.color }]}
              activeOpacity={0.85}
            >
              <View style={[styles.offerTag, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <ThemedText style={styles.offerTagText}>{offer.tag}</ThemedText>
              </View>
              <ThemedText style={styles.offerTitle}>{offer.title}</ThemedText>
              <ThemedText style={styles.offerSub}>{offer.sub}</ThemedText>
              <View style={styles.offerBottom}>
                <ThemedText style={styles.offerPrice}>{offer.price}</ThemedText>
                <View style={styles.offerBtn}>
                  <ThemedText style={styles.offerBtnText}>Get</ThemedText>
                  <Ionicons name="arrow-forward" size={13} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Add-ons list */}
        <ThemedText style={[styles.sectionTitle, { marginTop: 8 }]}>Popular Add-ons</ThemedText>
        <View style={[styles.addonsContainer, { backgroundColor: surfaceBg, borderColor }]}>
          {ADDONS.map((item, i) => (
            <TouchableOpacity
              key={item.title}
              style={[
                styles.addonRow,
                i < ADDONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor },
              ]}
              activeOpacity={0.7}
            >
              <View style={[styles.addonIcon, { backgroundColor: colors.tint + '18' }]}>
                <Ionicons name={item.icon} size={22} color={colors.tint} />
              </View>
              <View style={styles.addonInfo}>
                <ThemedText style={styles.addonTitle}>{item.title}</ThemedText>
                <ThemedText style={styles.addonDesc}>{item.desc}</ThemedText>
              </View>
              <View style={styles.addonRight}>
                <ThemedText style={[styles.addonPrice, { color: colors.tint }]}>{item.price}</ThemedText>
                <Ionicons name="chevron-forward" size={16} color={colors.icon} />
              </View>
            </TouchableOpacity>
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

  header: { paddingVertical: 20 },
  heading: { fontSize: 28, fontWeight: '800' },
  headingSub: { fontSize: 14, opacity: 0.5, marginTop: 2 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },

  chipsScroll: { marginBottom: 24 },
  chips: { gap: 8, paddingRight: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },

  offersRow: { marginHorizontal: -20 },
  offersScroll: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
  offerCard: { width: 220, borderRadius: 20, padding: 18, gap: 8 },
  offerTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  offerTagText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  offerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  offerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  offerBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  offerPrice: { color: '#fff', fontSize: 24, fontWeight: '800' },
  offerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  offerBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  addonsContainer: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  addonRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  addonIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addonInfo: { flex: 1 },
  addonTitle: { fontSize: 14, fontWeight: '700' },
  addonDesc: { fontSize: 12, opacity: 0.5, marginTop: 2 },
  addonRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addonPrice: { fontSize: 14, fontWeight: '700' },
});
