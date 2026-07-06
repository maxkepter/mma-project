import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  aiInsightApi,
  AIInsightItem,
} from '@/services/ai-insight-api';

export default function AIInsightScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [latest, setLatest] = useState<AIInsightItem | null>(null);
  const [history, setHistory] = useState<AIInsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [latestRes, listRes] = await Promise.all([
        aiInsightApi.getLatestInsight(),
        aiInsightApi.getInsights(5),
      ]);
      setLatest(latestRes.data);
      setHistory(listRes.data);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message ?? 'Tải dữ liệu thất bại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const onGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await aiInsightApi.generate();
      const newItem = res.data;
      setLatest(newItem);
      setHistory((prev) => [newItem, ...prev].slice(0, 5));
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message ?? 'Sinh phân tích thất bại');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <Pressable
          style={[styles.generateBtn, { backgroundColor: colors.tint }]}
          onPress={onGenerate}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <ThemedText style={styles.generateBtnText}>
              Tạo phân tích mới
            </ThemedText>
          )}
        </Pressable>
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
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Phân tích mới nhất
          </ThemedText>
          {latest ? (
            <InsightCard item={latest} highlighted />
          ) : (
            <ThemedView
              style={[
                styles.emptyCard,
                { backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#f9fafb' },
              ]}
            >
              <ThemedText style={{ color: colors.icon }}>
                Chưa có phân tích nào. Bấm nút phía trên để sinh phân tích.
              </ThemedText>
            </ThemedView>
          )}

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Lịch sử phân tích
          </ThemedText>
          {history.length === 0 ? (
            <ThemedText style={[styles.emptyText, { color: colors.icon }]}>
              Không có lịch sử.
            </ThemedText>
          ) : (
            history.map((item) => <InsightCard key={item.id} item={item} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function InsightCard({
  item,
  highlighted,
}: {
  item: AIInsightItem;
  highlighted?: boolean;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <ThemedView
      style={[
        styles.card,
        {
          backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#f9fafb',
          borderColor: highlighted ? colors.tint : 'transparent',
          borderWidth: highlighted ? 1 : 0,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <ThemedText style={[styles.date, { color: colors.icon }]}>
          {new Date(item.createdAt).toLocaleString('vi-VN')}
        </ThemedText>
        <View style={[styles.confBadge, { backgroundColor: colors.tint }]}>
          <ThemedText style={styles.confText}>
            {Math.round(item.confidenceScore * 100)}%
          </ThemedText>
        </View>
      </View>
      <ThemedText style={styles.content}>{item.content}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'flex-end',
  },
  generateBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  generateBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 16 },
  sectionTitle: { marginBottom: 4 },
  emptyCard: { padding: 16, borderRadius: 12 },
  emptyText: { textAlign: 'center', padding: 24 },
  card: { padding: 16, borderRadius: 12, gap: 8 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  date: { fontSize: 12, flexShrink: 1 },
  confBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confText: { color: '#ffffff', fontSize: 11, fontWeight: '600' },
  content: { fontSize: 14, lineHeight: 22 },
});
