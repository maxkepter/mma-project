import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { statisticsApi, GanItem } from '@/services/statistics-api';

const LIMIT_OPTIONS = [100, 500, 1000];

type GanMode = 'current' | 'max';
type SortField = 'number' | 'currentGan';
type SortOrder = 'asc' | 'desc';

export default function GanScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [data, setData] = useState<GanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(1000);
  const [mode, setMode] = useState<GanMode>('current');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('currentGan');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    statisticsApi
      .getGan({ limit })
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

  const filtered = search
    ? data.filter((item) => item.number.includes(search.padStart(2, '0')))
    : data;

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'number':
        cmp = parseInt(a.number, 10) - parseInt(b.number, 10);
        break;
      case 'currentGan':
        cmp = a.currentGan - b.currentGan;
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

      {/* Mode Toggle */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        <ThemedText style={[styles.filterLabel, { color: colors.icon }]}>Xem:</ThemedText>
        <TouchableOpacity onPress={() => setMode('current')} activeOpacity={0.7}>
          <ThemedText
            style={mode === 'current' ? { color: colors.tint, fontWeight: '600' } : { color: colors.icon }}
          >
            Gan hiện tại
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode('max')} activeOpacity={0.7}>
          <ThemedText
            style={mode === 'max' ? { color: colors.tint, fontWeight: '600' } : { color: colors.icon }}
          >
            Gan cực đại
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#f3f4f6',
              color: colors.text,
            },
          ]}
          placeholder="Tìm số (00-99)..."
          placeholderTextColor={colors.icon}
          value={search}
          onChangeText={setSearch}
          keyboardType="number-pad"
          maxLength={2}
        />
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
            <TouchableOpacity style={styles.colNumberHeader} onPress={() => handleSort('number')} activeOpacity={0.7}>
              <ThemedText style={[styles.headerText, { color: sortField === 'number' ? colors.tint : colors.icon }]}>Số</ThemedText>
              <SortIcon field="number" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.colGanHeader} onPress={() => handleSort('currentGan')} activeOpacity={0.7}>
              <ThemedText style={[styles.headerText, { color: sortField === 'currentGan' ? colors.tint : colors.icon }]}>
                {mode === 'current' ? 'Gan hiện tại' : 'Gan max'}
              </ThemedText>
              <SortIcon field="currentGan" />
            </TouchableOpacity>
            <View style={styles.colDateHeader}>
              <ThemedText style={[styles.headerText, { color: colors.icon }]}>Ngày về gần nhất</ThemedText>
            </View>
          </View>

          {sorted.map((item) => {
            const ganValue = mode === 'current' ? item.currentGan : item.maxGan;
            const isHighGan = ganValue > 20;
            return (
              <ThemedView
                key={item.number}
                style={[styles.row, { borderBottomColor: colors.border }]}
              >
                <ThemedText
                  type="defaultSemiBold"
                  style={[
                    styles.colNumber,
                    isHighGan ? { color: '#f59e0b' } : { color: colors.text },
                  ]}
                >
                  {item.number}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.colGan,
                    isHighGan ? { color: '#f59e0b', fontWeight: '600' } : { color: colors.text },
                  ]}
                >
                  {ganValue} ngày
                </ThemedText>
                <ThemedText style={[styles.colDate, { color: colors.icon }]}>
                  {item.lastSeenDate ?? '-'}
                </ThemedText>
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
    flexWrap: 'wrap',
  },
  filterLabel: { fontSize: 14, marginRight: 2 },
  filterChip: { fontSize: 14, paddingHorizontal: 8, paddingVertical: 4 },
  searchRow: { paddingHorizontal: 16, paddingVertical: 8 },
  searchInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
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
  colNumberHeader: { width: 50, flexDirection: 'row', alignItems: 'center', gap: 2, justifyContent: 'center' },
  colGanHeader: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, justifyContent: 'center' },
  colDateHeader: { width: 100, alignItems: 'flex-end' },
  headerText: { fontSize: 12, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  colNumber: { width: 50, fontSize: 15, textAlign: 'center' },
  colGan: { flex: 1, fontSize: 14, textAlign: 'center' },
  colDate: { width: 100, fontSize: 12, textAlign: 'right', paddingRight: 4 },
});
