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
import { statisticsApi, LoRoiItem } from '@/services/statistics-api';

const LIMIT_OPTIONS = [10, 30, 60];

export default function LoRoiScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [data, setData] = useState<LoRoiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(30);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    statisticsApi
      .getLoRoi({ limit })
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

      {!loading && !error && data.length === 0 && (
        <View style={styles.center}>
          <ThemedText style={{ color: colors.icon }}>
            Không có lô rơi nào trong khoảng này.
          </ThemedText>
        </View>
      )}

      {!loading && !error && data.length > 0 && (
        <ScrollView contentContainerStyle={styles.scroll}>
          {data.map((item) => (
            <ThemedView
              key={item.date}
              style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#f9fafb' }]}
            >
              <View style={styles.cardHeader}>
                <ThemedText type="defaultSemiBold">{item.date}</ThemedText>
                <ThemedText style={{ color: colors.icon }}>Đề {item.specialLoto}</ThemedText>
              </View>
              {item.loRoiTuDe.length > 0 && (
                <View style={styles.row}>
                  <ThemedText style={[styles.rowLabel, { color: colors.icon }]}>
                    Rơi từ đề:
                  </ThemedText>
                  <ThemedText style={{ color: '#10b981' }}>{item.loRoiTuDe.join(', ')}</ThemedText>
                </View>
              )}
              {item.loRoiTuLo.length > 0 && (
                <View style={styles.row}>
                  <ThemedText style={[styles.rowLabel, { color: colors.icon }]}>
                    Rơi từ lô:
                  </ThemedText>
                  <ThemedText>{item.loRoiTuLo.join(', ')}</ThemedText>
                </View>
              )}
            </ThemedView>
          ))}
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
  scroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  card: {
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rowLabel: { fontSize: 13 },
});
