import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function SettingsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Settings</ThemedText>
      <ThemedText>Manage your app preferences here.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
});
