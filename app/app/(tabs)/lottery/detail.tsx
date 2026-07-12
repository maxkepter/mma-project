import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeView } from '@/components/safe-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  lotteryApi,
  LotteryResultDetail,
  PRIZE_LABELS,
  PrizeLevel,
} from '@/services/lottery-api';

const PRIZE_ORDER: PrizeLevel[] = [
  'Special',
  'First',
  'Second',
  'Third',
  'Fourth',
  'Fifth',
  'Sixth',
  'Seventh',
];

function formatDate(iso: string): string {
  // yyyy-mm-dd → dd/mm/yyyy
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function LotteryDetailScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date?: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<LotteryResultDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = date
          ? await lotteryApi.getByDate(date)
          : await lotteryApi.getLatest();
        if (!cancelled) setDetail(res.data);
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.status === 404
              ? 'Không tìm thấy kết quả cho ngày này.'
              : err?.message || 'Tải kết quả thất bại',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const cardBg = colorScheme === 'dark' ? '#1f2937' : '#f9fafb';
  const cardBorder = colorScheme === 'dark' ? '#374151' : '#e5e7eb';
  const accentPrize = 'Special';

  return (
    <SafeView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">
            {date ? 'Kết quả ngày ' + formatDate(date) : 'Kết quả mới nhất'}
          </ThemedText>
          {detail && (
            <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
              {formatDate(detail.date)} • XSMB • Miền Bắc
            </ThemedText>
          )}
        </ThemedView>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : error ? (
          <ThemedView
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <ThemedText style={{ color: '#ef4444', textAlign: 'center' }}>
              {error}
            </ThemedText>
          </ThemedView>
        ) : detail ? (
          <ThemedView style={styles.prizeList}>
            {PRIZE_ORDER.map((level) => {
              const group = detail.prizes.find((p) => p.prizeLevel === level);
              if (!group) return null;
              const isAccent = level === accentPrize;
              return (
                <ThemedView
                  key={level}
                  style={[
                    styles.prizeCard,
                    {
                      backgroundColor: cardBg,
                      borderColor: isAccent ? colors.tint : cardBorder,
                      borderWidth: isAccent ? 2 : 1,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.prizeLabel,
                      isAccent && { color: colors.tint },
                    ]}
                  >
                    {PRIZE_LABELS[level]}
                  </ThemedText>
                  <View style={styles.prizeValues}>
                    {group.values.map((v, i) => (
                      <ThemedText
                        key={i}
                        type={isAccent ? 'defaultSemiBold' : 'default'}
                        style={[
                          styles.prizeValue,
                          isAccent && { color: colors.tint, fontSize: 22 },
                        ]}
                      >
                        {v}
                      </ThemedText>
                    ))}
                  </View>
                </ThemedView>
              );
            })}
          </ThemedView>
        ) : null}
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  header: { marginBottom: 16 },
  subtitle: { fontSize: 14, marginTop: 4 },
  center: { padding: 32, alignItems: 'center' },
  card: { borderRadius: 12, borderWidth: 1, padding: 20 },
  prizeList: { gap: 12 },
  prizeCard: { borderRadius: 12, padding: 16 },
  prizeLabel: { fontSize: 14, marginBottom: 8, fontWeight: '600' },
  prizeValues: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  prizeValue: { fontSize: 18, letterSpacing: 2 },
});