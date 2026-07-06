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
import {
  analyticsApi,
  PredictionItem,
  TrendItem,
} from '@/services/analytics-api';

type Tab = 'prediction' | 'trend';

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [tab, setTab] = useState<Tab>('prediction');

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        <ThemedText
          style={[styles.tab, tab === 'prediction' ? { color: colors.tint, fontWeight: '600' } : { color: colors.icon }]}
          onPress={() => setTab('prediction')}
        >
          Dự báo
        </ThemedText>
        <ThemedText
          style={[styles.tab, tab === 'trend' ? { color: colors.tint, fontWeight: '600' } : { color: colors.icon }]}
          onPress={() => setTab('trend')}
        >
          Xu hướng
        </ThemedText>
      </View>

      {tab === 'prediction' ? <PredictionView /> : <TrendView />}
    </SafeAreaView>
  );
}

function PredictionView() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [data, setData] = useState<PredictionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    analyticsApi
      .getPredictions({ topN: 10 })
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
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <ThemedText style={{ color: '#ef4444' }}>{error}</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      {data.map((item, idx) => {
        const conf = item.confidence;
        const confColor =
          conf === 'high' ? '#10b981' : conf === 'medium' ? '#f59e0b' : '#6b7280';
        return (
          <ThemedView
            key={item.number}
            style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#f9fafb' }]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.rank, { backgroundColor: colors.tint }]}>
                <ThemedText style={[styles.rankText, { color: colors.background }]}>
                  {idx + 1}
                </ThemedText>
              </View>
              <ThemedText type="defaultSemiBold" style={styles.bigNumber}>
                {item.number}
              </ThemedText>
              <View style={{ flex: 1 }} />
              <ThemedText
                style={[styles.confBadge, { backgroundColor: confColor }]}
              >
                {conf === 'high'
                  ? 'Cao'
                  : conf === 'medium'
                  ? 'Trung bình'
                  : 'Thấp'}
              </ThemedText>
            </View>
            <View style={styles.factors}>
              <FactorBar label="Tần suất" value={item.frequencyFactor} colors={colors} />
              <FactorBar label="Quá hạn" value={item.overdueFactor} colors={colors} />
              <FactorBar label="Xu hướng" value={item.trendFactor} colors={colors} />
            </View>
            <ThemedText style={[styles.reasoning, { color: colors.icon }]}>
              {item.reasoning}
            </ThemedText>
            <ThemedText style={styles.scoreText}>
              Score: {item.score}
            </ThemedText>
          </ThemedView>
        );
      })}
    </ScrollView>
  );
}

function FactorBar({
  label,
  value,
  colors,
}: {
  label: string;
  value: number;
  colors: ReturnType<typeof Colors[typeof Colors extends never ? never : 'light'] | any>;
}) {
  return (
    <View style={styles.factorRow}>
      <ThemedText style={[styles.factorLabel, { color: colors.icon }]}>
        {label}
      </ThemedText>
      <View style={styles.factorBarBg}>
        <View
          style={[
            styles.factorBarFill,
            { width: `${Math.min(value * 100, 100)}%`, backgroundColor: colors.tint },
          ]}
        />
      </View>
      <ThemedText style={[styles.factorValue, { color: colors.icon }]}>
        {(value * 100).toFixed(0)}%
      </ThemedText>
    </View>
  );
}

function TrendView() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [data, setData] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'up' | 'down' | 'stable'>('all');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    analyticsApi
      .getTrend({ limit: 90 })
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
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <ThemedText style={{ color: '#ef4444' }}>{error}</ThemedText>
      </View>
    );
  }

  const filtered = filter === 'all' ? data : data.filter((d) => d.trend === filter);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        {(['all', 'up', 'down', 'stable'] as const).map((f) => (
          <ThemedText
            key={f}
            style={[
              styles.filterChip,
              filter === f ? { color: colors.tint, fontWeight: '600' } : { color: colors.icon },
            ]}
            onPress={() => setFilter(f)}
          >
            {f === 'all' ? 'Tất cả' : f === 'up' ? 'Tăng' : f === 'down' ? 'Giảm' : 'Ổn định'}
          </ThemedText>
        ))}
      </View>

      {filtered.map((item) => {
        const arrow = item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→';
        const arrowColor =
          item.trend === 'up' ? '#10b981' : item.trend === 'down' ? '#ef4444' : '#6b7280';
        return (
          <ThemedView
            key={item.number}
            style={[styles.trendRow, { borderBottomColor: colors.border }]}
          >
            <ThemedText type="defaultSemiBold" style={styles.numberSmall}>
              {item.number}
            </ThemedText>
            <ThemedText style={[styles.arrow, { color: arrowColor }]}>{arrow}</ThemedText>
            <ThemedText style={[styles.slope, { color: colors.icon }]}>
              slope {item.slope}
            </ThemedText>
          </ThemedView>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 18,
    borderBottomWidth: 1,
  },
  tab: { fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  card: { padding: 14, borderRadius: 12, gap: 8 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 40,
  },
  rank: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  rankText: { fontSize: 14, fontWeight: '700' },
  bigNumber: { fontSize: 22, fontWeight: '700', flexShrink: 1, minWidth: 40 },
  confBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    overflow: 'hidden',
    flexShrink: 0,
  },
  factors: { gap: 4 },
  factorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  factorLabel: { fontSize: 12, width: 80, flexShrink: 0 },
  factorBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  factorBarFill: { height: 6, borderRadius: 3 },
  factorValue: { fontSize: 12, width: 36, textAlign: 'right' },
  reasoning: { fontSize: 13 },
  scoreText: { fontSize: 13, fontWeight: '600' },
  filterBar: {
    flexDirection: 'row',
    paddingBottom: 12,
    gap: 12,
  },
  filterChip: { fontSize: 14 },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  numberSmall: { width: 50, fontSize: 16 },
  arrow: { fontSize: 22, fontWeight: '600', width: 30, textAlign: 'center' },
  slope: { flex: 1, fontSize: 12 },
});
