import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeView } from '@/components/safe-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function LotteryLookupScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [dateInput, setDateInput] = useState(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  });
  const [error, setError] = useState<string | null>(null);

  const handleLookup = () => {
    setError(null);
    if (!ISO_DATE_RE.test(dateInput)) {
      setError('Vui lòng nhập ngày theo định dạng yyyy-mm-dd');
      return;
    }
    // Navigate to detail with explicit date param
    router.push(`/(tabs)/lottery/detail?date=${dateInput}` as any);
  };

  const cardBg = colorScheme === 'dark' ? '#1f2937' : '#f9fafb';
  const cardBorder = colorScheme === 'dark' ? '#374151' : '#e5e7eb';

  return (
    <SafeView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Tra cứu kết quả</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
            Xem kết quả xổ số miền Bắc (XSMB) theo ngày
          </ThemedText>
        </ThemedView>

        <ThemedView
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <ThemedText style={styles.label}>Ngày cần tra cứu</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: error ? '#ef4444' : cardBorder,
                color: colors.text,
                backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#ffffff',
              },
            ]}
            value={dateInput}
            onChangeText={(t) => {
              setDateInput(t);
              if (error) setError(null);
            }}
            placeholder="yyyy-mm-dd"
            placeholderTextColor={colors.icon}
            keyboardType="numbers-and-punctuation"
            autoCorrect={false}
          />
          {error && <ThemedText style={styles.error}>{error}</ThemedText>}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={handleLookup}
            activeOpacity={0.85}
          >
            <ThemedText style={styles.buttonText}>Tra cứu</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <ThemedText style={[styles.helper, { color: colors.icon }]}>
            Mẹo: nhập ngày từ 2003-01-01 trở đi (dữ liệu có sẵn từ JSON seed).
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  header: { marginBottom: 16 },
  subtitle: { fontSize: 14, marginTop: 4 },
  card: { borderRadius: 12, borderWidth: 1, padding: 20, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { height: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16 },
  error: { color: '#ef4444', fontSize: 12, marginTop: 6 },
  button: { height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  helper: { fontSize: 13, lineHeight: 20 },
});