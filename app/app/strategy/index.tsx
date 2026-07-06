import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeView } from '@/components/safe-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { strategyApi, Strategy } from '@/services/strategy-api';

export default function StrategyListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStrategies = async () => {
    setLoading(true);
    try {
      const res = await strategyApi.getAll();
      setStrategies(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStrategies();
    }, [])
  );

  return (
    <SafeView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Quản lý chiến lược đầu tư</ThemedText>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.tint }]}
            onPress={() => router.push('/strategy/create')}
          >
            <ThemedText style={styles.addButtonText}>+ Tạo mới</ThemedText>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.tint} />
        ) : strategies.length === 0 ? (
          <ThemedText style={{ textAlign: 'center', marginTop: 40, color: colors.icon }}>
            Bạn chưa có chiến lược nào.
          </ThemedText>
        ) : (
          strategies.map((strat) => (
            <TouchableOpacity
              key={strat.id}
              style={[
                styles.card,
                {
                  backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#f9fafb',
                  borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                }
              ]}
              onPress={() => router.push(`/strategy/${strat.id}` as any)}
            >
              <ThemedText type="defaultSemiBold" style={{ fontSize: 18, marginBottom: 8 }}>
                {strat.name}
              </ThemedText>
              <ThemedText style={{ color: colors.icon, marginBottom: 12 }}>
                {strat.description || 'Không có mô tả'}
              </ThemedText>
              <ThemedText style={{ fontSize: 12, color: colors.icon }}>
                {strat.conditions?.length || 0} điều kiện
              </ThemedText>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
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
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
});
