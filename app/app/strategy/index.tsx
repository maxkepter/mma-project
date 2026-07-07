import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeView } from '@/components/safe-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { strategyApi, type Strategy } from '@/services/strategy-api';

export default function StrategyListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStrategies = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await strategyApi.getAll();
      setStrategies(res.data);
    } catch {
      setError('Không thể tải danh sách. Nhấn để thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStrategies();
    }, []),
  );

  const cardBg = colorScheme === 'dark' ? '#1f2937' : '#f9fafb';
  const cardBorder = colorScheme === 'dark' ? '#374151' : '#e5e7eb';

  return (
    <SafeView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchStrategies(true)}
            tintColor={colors.tint}
          />
        }
      >
        <View style={styles.header}>
          <ThemedText type="subtitle">Quản lý chiến lược</ThemedText>
          <Pressable
            style={[styles.addButton, { backgroundColor: colors.tint }]}
            onPress={() => router.push('/strategy/create')}
          >
            <ThemedText style={styles.addButtonText}>+ Tạo mới</ThemedText>
          </Pressable>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={colors.tint} />
        ) : error ? (
          <Pressable style={styles.errorBox} onPress={() => fetchStrategies()}>
            <ThemedText style={{ color: '#ef4444', textAlign: 'center' }}>
              {error}
            </ThemedText>
          </Pressable>
        ) : strategies.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyIcon}>📋</ThemedText>
            <ThemedText type="defaultSemiBold" style={{ marginTop: 12 }}>
              Chưa có chiến lược nào
            </ThemedText>
            <ThemedText
              style={{ color: colors.icon, textAlign: 'center', marginTop: 8, lineHeight: 22 }}
            >
              Tạo chiến lược đầu tiên{'\n'}để bắt đầu phân tích.
            </ThemedText>
            <Pressable
              style={[styles.createFirstBtn, { backgroundColor: colors.tint }]}
              onPress={() => router.push('/strategy/create')}
            >
              <ThemedText style={{ color: 'white', fontWeight: '600' }}>
                Tạo chiến lược
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          strategies.map((strat) => (
            <Pressable
              key={strat.id}
              style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
              onPress={() => router.push(`/strategy/${strat.id}` as any)}
              accessibilityRole="button"
              accessibilityLabel={`Chiến lược ${strat.name}`}
            >
              <View style={styles.cardTop}>
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                  {strat.name}
                </ThemedText>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        strat.conditions.length > 0 ? '#10b981' : '#f59e0b',
                    },
                  ]}
                >
                  <ThemedText style={styles.badgeText}>
                    {strat.conditions.length}{' '}
                    {strat.conditions.length === 1 ? 'điều kiện' : 'điều kiện'}
                  </ThemedText>
                </View>
              </View>

              <ThemedText
                style={{ color: colors.icon, marginTop: 6 }}
                numberOfLines={2}
              >
                {strat.description || 'Không có mô tả'}
              </ThemedText>

              <ThemedText style={{ fontSize: 12, color: colors.icon, marginTop: 10 }}>
                Tạo: {new Date(strat.createdAt).toLocaleDateString('vi-VN')}
              </ThemedText>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: { color: 'white', fontWeight: 'bold' },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 17, flex: 1, marginRight: 8 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { color: 'white', fontSize: 12, fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 56 },
  createFirstBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorBox: {
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
});