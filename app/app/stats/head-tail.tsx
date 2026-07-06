import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { statisticsApi, HeadTailResponse } from '@/services/statistics-api';

const LIMIT_OPTIONS = [30, 100, 300];

export default function HeadTailScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [data, setData] = useState<HeadTailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    statisticsApi
      .getHeadTail({ limit })
      .then((res) => {
        if (!cancelled) {
          setData(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message ?? 'Tải dữ liệu thất bại');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  const renderRow = (
    digit: { digit: number; count: number; percentage: number },
    max: number,
    isHead: boolean,
  ) => (
    <View key={digit.digit} style={styles.row}>
      <ThemedText style={[styles.digit, { color: isHead ? '#0ea5e9' : '#a855f7' }]}>
        {digit.digit}
      </ThemedText>
      <View style={styles.barWrap}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.max((digit.count / max) * 100, 2)}%`,
              backgroundColor: isHead ? '#0ea5e9' : '#a855f7',
            },
          ]}
        />
      </View>
      <ThemedText style={[styles.value, { color: colors.icon }]}>
        {digit.count} ({digit.percentage}%)
      </ThemedText>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.filterLabel}>Số kỳ:</ThemedText>
        {LIMIT_OPTIONS.map((opt) => (
          <ThemedText
            key={opt}
            style={[
              styles.filterChip,
              limit === opt ? { color: colors.tint, fontWeight: '600' } : { color: colors.icon },
            ]}
            onPress={() => setLimit(opt)}
          >
            {opt}
          </ThemedText>
        ))}
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      )}

      {error && (
        <View style={styles.center}>
          <ThemedText style={{ color: '#ef4444' }}>{error}</ThemedText>
        </View>
      )}

      {!loading && !error && data && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Đầu số</ThemedText>
            {data.heads.map((item) => renderRow(item, Math.max(...data.heads.map((h) => h.count), 1), true))}
          </ThemedView>

          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Đuôi số</ThemedText>
            {data.tails.map((item) => renderRow(item, Math.max(...data.tails.map((t) => t.count), 1), false))}
          </ThemedView>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
  },
  filterLabel: { fontSize: 14 },
  filterChip: { fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 20 },
  section: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  digit: { width: 18, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  barWrap: { flex: 1, height: 18, justifyContent: 'center' },
  barFill: { height: 14, borderRadius: 7 },
  value: { width: 100, fontSize: 12, textAlign: 'right' },
});
