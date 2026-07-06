import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  ActivityIndicator,
  Pressable,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { statisticsApi, HeatmapResponse, HeatmapCell } from '@/services/statistics-api';

const LIMIT_OPTIONS = [30, 100, 300];

/**
 * Color interpolation helper
 * Purple (high) -> Green (mid) -> Red (low)
 */
function getHeatmapColor(intensity: number): { bg: string; text: string } {
  // intensity: 0 = low (red), 0.5 = mid (green), 1 = high (purple)
  if (intensity >= 0.7) {
    // Purple range (high frequency)
    const t = (intensity - 0.7) / 0.3; // 0 to 1
    const r = Math.round(139 + (168 - 139) * t);
    const g = Math.round(0 + (85 - 0) * t);
    const b = Math.round(160 + (200 - 160) * t);
    return { bg: `rgb(${r},${g},${b})`, text: '#ffffff' };
  } else if (intensity >= 0.3) {
    // Green range (medium frequency)
    const t = (intensity - 0.3) / 0.4; // 0 to 1
    const r = Math.round(239 + (139 - 239) * t);
    const g = Math.round(68 + (68 - 68) * t);
    const b = Math.round(68 + (160 - 68) * t);
    return { bg: `rgb(${r},${g},${b})`, text: '#ffffff' };
  } else {
    // Red range (low frequency)
    const t = intensity / 0.3; // 0 to 1
    const r = Math.round(220 + (239 - 220) * t);
    const g = Math.round(50 + (68 - 50) * t);
    const b = Math.round(50 + (68 - 50) * t);
    return { bg: `rgb(${r},${g},${b})`, text: '#ffffff' };
  }
}

function getGanColor(intensity: number): { bg: string; text: string } {
  // Gan: high = purple (long overdue), mid = green, low = red
  if (intensity >= 0.7) {
    const t = (intensity - 0.7) / 0.3;
    const r = Math.round(139 + (168 - 139) * t);
    const g = Math.round(0 + (85 - 0) * t);
    const b = Math.round(160 + (200 - 160) * t);
    return { bg: `rgb(${r},${g},${b})`, text: '#ffffff' };
  } else if (intensity >= 0.3) {
    const t = (intensity - 0.3) / 0.4;
    const r = Math.round(239 + (139 - 239) * t);
    const g = Math.round(68 + (68 - 68) * t);
    const b = Math.round(68 + (160 - 68) * t);
    return { bg: `rgb(${r},${g},${b})`, text: '#ffffff' };
  } else {
    const t = intensity / 0.3;
    const r = Math.round(220 + (239 - 220) * t);
    const g = Math.round(50 + (68 - 50) * t);
    const b = Math.round(50 + (68 - 68) * t);
    return { bg: `rgb(${r},${g},${b})`, text: '#ffffff' };
  }
}

export default function HeatmapScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'frequency' | 'gan'>('frequency');
  const [limit, setLimit] = useState(100);
  const [selected, setSelected] = useState<HeatmapCell | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    statisticsApi
      .getHeatmap({ limit, mode })
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
  }, [limit, mode]);

  const allValues = data?.rows.flatMap((row) => row.cells.map((c) => c.value)) ?? [];
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);

  const getColor = (value: number) => {
    const intensity = maxValue > minValue ? (value - minValue) / (maxValue - minValue) : 0;
    return mode === 'frequency' ? getHeatmapColor(intensity) : getGanColor(intensity);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      {/* Mode Toggle */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        <ThemedText style={[styles.filterLabel, { color: colors.icon }]}>Chế độ:</ThemedText>
        <Pressable onPress={() => setMode('frequency')} style={styles.filterChip}>
          <ThemedText
            style={mode === 'frequency' ? { color: colors.tint, fontWeight: '600' } : { color: colors.icon }}
          >
            Tần suất
          </ThemedText>
        </Pressable>
        <Pressable onPress={() => setMode('gan')} style={styles.filterChip}>
          <ThemedText
            style={mode === 'gan' ? { color: colors.tint, fontWeight: '600' } : { color: colors.icon }}
          >
            Số ngày gan
          </ThemedText>
        </Pressable>
      </View>

      {/* Limit Filter */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        <ThemedText style={[styles.filterLabel, { color: colors.icon }]}>Số kỳ:</ThemedText>
        {LIMIT_OPTIONS.map((opt) => (
          <Pressable key={opt} onPress={() => setLimit(opt)} style={styles.filterChip}>
            <ThemedText
              style={[
                styles.filterChipText,
                limit === opt ? { color: colors.tint, fontWeight: '600' } : { color: colors.icon },
              ]}
            >
              {opt}
            </ThemedText>
          </Pressable>
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
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Legend with color scale */}
          <ThemedView style={[styles.legendContainer, { backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#f9fafb' }]}>
            <ThemedText style={[styles.legendTitle, { color: colors.icon }]}>
              Mật độ {mode === 'frequency' ? 'tần suất' : 'gan'}
            </ThemedText>
            <View style={styles.legendRow}>
              <View style={[styles.legendBox, { backgroundColor: '#dc2626' }]} />
              <ThemedText style={styles.legendLabel}>Ít nhất</ThemedText>
              <View style={[styles.legendBox, { backgroundColor: '#22c55e' }]} />
              <ThemedText style={styles.legendLabel}>Trung bình</ThemedText>
              <View style={[styles.legendBox, { backgroundColor: '#a855f7' }]} />
              <ThemedText style={styles.legendLabel}>Nhiều nhất</ThemedText>
            </View>
            <View style={styles.colorScaleRow}>
              <View style={[styles.colorScale, { backgroundColor: '#dc2626' }]} />
              <View style={[styles.colorScale, { backgroundColor: '#f59e0b' }]} />
              <View style={[styles.colorScale, { backgroundColor: '#22c55e' }]} />
              <View style={[styles.colorScale, { backgroundColor: '#0ea5e9' }]} />
              <View style={[styles.colorScale, { backgroundColor: '#a855f7' }]} />
            </View>
            <View style={styles.scaleLabels}>
              <ThemedText style={[styles.scaleLabel, { color: colors.icon }]}>
                {minValue} ({mode === 'frequency' ? 'lần' : 'ngày'})
              </ThemedText>
              <ThemedText style={[styles.scaleLabel, { color: colors.icon }]}>
                {maxValue} ({mode === 'frequency' ? 'lần' : 'ngày'})
              </ThemedText>
            </View>
          </ThemedView>

          {/* Heatmap Grid */}
          <View style={styles.grid}>
            {data.rows.map((row) => (
              <View key={row.head} style={styles.gridRow}>
                <ThemedText style={[styles.axisLabel, { color: colors.icon }]}>
                  {row.head}
                </ThemedText>
                <View style={styles.cellsRow}>
                  {row.cells.map((cell) => {
                    const { bg, text } = getColor(cell.value);
                    return (
                      <Pressable
                        key={cell.number}
                        onPress={() => setSelected(cell)}
                        style={[styles.cell, { backgroundColor: bg }]}
                      >
                        <Text style={[styles.cellNumber, { color: text }]}>
                          {cell.number}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
            {/* Tail axis labels */}
            <View style={styles.gridRow}>
              <View style={styles.axisLabel} />
              <View style={styles.cellsRow}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((tail) => (
                  <Text key={`tail-${tail}`} style={[styles.tailLabel, { color: colors.icon }]}>
                    {tail}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {/* Selected Cell Detail */}
          {selected && (
            <ThemedView
              style={[styles.detailCard, { backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#f9fafb' }]}
            >
              <View style={styles.detailHeader}>
                <ThemedText type="subtitle">Số {selected.number}</ThemedText>
              </View>
              <ThemedText style={{ color: colors.text }}>
                {mode === 'frequency'
                  ? `Xuất hiện ${selected.value} lần`
                  : `Gan ${selected.value} ngày`}
              </ThemedText>
              <View style={styles.detailBar}>
                <View
                  style={[
                    styles.detailBarFill,
                    {
                      width: `${maxValue > 0 ? (selected.value / maxValue) * 100 : 0}%`,
                      backgroundColor: getColor(selected.value).bg,
                    },
                  ]}
                />
              </View>
            </ThemedView>
          )}
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
  filterLabel: { fontSize: 14, marginRight: 4 },
  filterChip: { paddingHorizontal: 4 },
  filterChipText: { fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 12, paddingVertical: 16, gap: 16 },
  legendContainer: {
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  legendTitle: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  legendBox: { width: 16, height: 16, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: '#6b7280' },
  colorScaleRow: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  colorScale: { flex: 1 },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleLabel: { fontSize: 10 },
  grid: { gap: 3 },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  axisLabel: { width: 14, fontSize: 11, textAlign: 'center', color: '#6b7280' },
  cellsRow: {
    flexDirection: 'row',
    gap: 3,
    flex: 1,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 32,
    minWidth: 24,
  },
  cellNumber: { fontSize: 9, fontWeight: '600' },
  tailLabel: { flex: 1, fontSize: 10, textAlign: 'center', maxWidth: 32, minWidth: 24 },
  detailCard: { padding: 16, borderRadius: 12, gap: 8 },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  detailBarFill: { height: 8, borderRadius: 4 },
});
