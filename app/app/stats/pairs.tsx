import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { statisticsApi, NumberPairItem } from '@/services/statistics-api';

const LIMIT_OPTIONS = [30, 100, 300];

type SortField = 'pair' | 'count' | 'percentage';
type SortOrder = 'asc' | 'desc';

export default function PairsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [data, setData] = useState<NumberPairItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(100);
  const [sortField, setSortField] = useState<SortField>('count');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    statisticsApi
      .getNumberPairs({ limit })
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

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortOrder('asc');
      return field;
    });
  }, []);

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const sorted = [...data].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'pair':
        const aPair = a.pair.join('');
        const bPair = b.pair.join('');
        cmp = aPair.localeCompare(bPair);
        break;
      case 'count':
        cmp = a.count - b.count;
        break;
      case 'percentage':
        cmp = a.percentage - b.percentage;
        break;
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ThemedText style={{ color: colors.icon, fontSize: 10 }}>⇅</ThemedText>;
    return (
      <ThemedText style={{ color: colors.tint, fontSize: 10, fontWeight: '600' }}>
        {sortOrder === 'asc' ? '↑' : '↓'}
      </ThemedText>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      {/* Limit Filter */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        <ThemedText style={[styles.filterLabel, { color: colors.icon }]}>Số kỳ:</ThemedText>
        {LIMIT_OPTIONS.map((opt) => (
          <TouchableOpacity key={opt} onPress={() => setLimit(opt)} activeOpacity={0.7}>
            <ThemedText
              style={[
                styles.filterChip,
                limit === opt ? { color: colors.tint, fontWeight: '600' } : { color: colors.icon },
              ]}
            >
              {opt}
            </ThemedText>
          </TouchableOpacity>
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

      {!loading && !error && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Sort Header */}
          <View style={[styles.tableHeader, { backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#f3f4f6' }]}>
            <TouchableOpacity style={styles.colPairHeader} onPress={() => handleSort('pair')} activeOpacity={0.7}>
              <ThemedText style={[styles.headerText, { color: sortField === 'pair' ? colors.tint : colors.icon }]}>Cặp</ThemedText>
              <SortIcon field="pair" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.colCountHeader} onPress={() => handleSort('count')} activeOpacity={0.7}>
              <ThemedText style={[styles.headerText, { color: sortField === 'count' ? colors.tint : colors.icon }]}>Lần</ThemedText>
              <SortIcon field="count" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.colBarHeader} onPress={() => handleSort('percentage')} activeOpacity={0.7}>
              <ThemedText style={[styles.headerText, { color: sortField === 'percentage' ? colors.tint : colors.icon }]}>Tỷ lệ</ThemedText>
              <SortIcon field="percentage" />
            </TouchableOpacity>
          </View>

          {sorted.map((item) => {
            const key = item.pair.join('-');
            return (
              <ThemedView key={key} style={[styles.row, { borderBottomColor: colors.border }]}>
                <View style={styles.colPair}>
                  <ThemedText type="defaultSemiBold" style={[styles.num, { color: colors.text }]}>
                    {item.pair[0]}
                  </ThemedText>
                  <ThemedText style={{ color: colors.icon }}>–</ThemedText>
                  <ThemedText type="defaultSemiBold" style={[styles.num, { color: colors.text }]}>
                    {item.pair[1]}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.colCount, { color: colors.text }]}>{item.count}</ThemedText>
                <View style={styles.colBar}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.max((item.count / maxCount) * 100, 2)}%`,
                        backgroundColor: colors.tint,
                      },
                    ]}
                  />
                  <ThemedText style={[styles.barPct, { color: colors.icon }]}>
                    {item.percentage}%
                  </ThemedText>
                </View>
              </ThemedView>
            );
          })}
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
  filterLabel: { fontSize: 14, marginRight: 4 },
  filterChip: { fontSize: 14, paddingHorizontal: 8, paddingVertical: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 12, paddingBottom: 24 },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginBottom: 4,
    alignItems: 'center',
  },
  colPairHeader: { width: 80, flexDirection: 'row', alignItems: 'center', gap: 2, justifyContent: 'center' },
  colCountHeader: { width: 40, flexDirection: 'row', alignItems: 'center', gap: 2, justifyContent: 'center' },
  colBarHeader: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  headerText: { fontSize: 12, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  colPair: { width: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  num: { fontSize: 15 },
  colCount: { width: 40, fontSize: 14, textAlign: 'center' },
  colBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  barFill: { height: 6, borderRadius: 3, minWidth: 2 },
  barPct: { fontSize: 11, width: 38, textAlign: 'right' },
});
