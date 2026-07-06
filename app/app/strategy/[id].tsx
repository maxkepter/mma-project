import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeView } from '@/components/safe-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { strategyApi, Strategy, BacktestRun } from '@/services/strategy-api';

export default function StrategyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [backtesting, setBacktesting] = useState(false);
  const [latestRun, setLatestRun] = useState<BacktestRun | null>(null);

  const fetchStrategy = useCallback(async () => {
    try {
      const res = await strategyApi.getById(id as string);
      setStrategy(res.data);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải chiến lược');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchStrategy();
  }, [fetchStrategy]);

  const handleDelete = async () => {
    Alert.alert('Xóa', 'Bạn có chắc muốn xóa?', [
      { text: 'Hủy' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await strategyApi.delete(id as string);
            router.back();
          } catch {
            Alert.alert('Lỗi', 'Xóa thất bại');
          }
        }
      }
    ]);
  };

  const handleBacktest = async () => {
    setBacktesting(true);
    try {
      const start = new Date();
      start.setDate(start.getDate() - 30); // backtest 30 days
      const end = new Date();

      const res = await strategyApi.runBacktest(id as string, {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      });
      setLatestRun(res.data);
      Alert.alert('Thành công', 'Đã chạy backtest xong!');
    } catch {
      Alert.alert('Lỗi', 'Chạy backtest thất bại');
    } finally {
      setBacktesting(false);
    }
  };

  if (loading || !strategy) {
    return (
      <SafeView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.tint} />
      </SafeView>
    );
  }

  const cardStyle = [
    styles.card,
    { backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#f9fafb', borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb' }
  ];

  return (
    <SafeView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={cardStyle}>
          <ThemedText type="subtitle" style={{ marginBottom: 8 }}>{strategy.name}</ThemedText>
          <ThemedText style={{ color: colors.icon, marginBottom: 16 }}>{strategy.description}</ThemedText>

          <ThemedText type="defaultSemiBold">Điều kiện ({strategy.conditions?.length || 0}):</ThemedText>
          {strategy.conditions?.map((c, i) => (
            <View key={i} style={{ marginTop: 8, padding: 8, backgroundColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb', borderRadius: 4 }}>
              <ThemedText>Loại: {c.type}</ThemedText>
              <ThemedText>Tham số: {JSON.stringify(c.parameters)}</ThemedText>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.tint, opacity: backtesting ? 0.7 : 1 }]}
          onPress={handleBacktest}
          disabled={backtesting}
        >
          {backtesting ? <ActivityIndicator color="white" /> : <ThemedText style={styles.actionText}>Chạy Backtest (30 ngày)</ThemedText>}
        </TouchableOpacity>

        {latestRun && (
          <View style={[cardStyle, { marginTop: 24 }]}>
            <ThemedText type="subtitle" style={{ marginBottom: 16 }}>Kết quả Backtest</ThemedText>
            <View style={styles.row}><ThemedText>Tổng số đánh:</ThemedText><ThemedText>{latestRun.result.totalBets}</ThemedText></View>
            <View style={styles.row}><ThemedText>Số trận thắng:</ThemedText><ThemedText>{latestRun.result.wonBets}</ThemedText></View>
            <View style={styles.row}><ThemedText>Tỉ lệ thắng:</ThemedText><ThemedText>{latestRun.winRate.toFixed(1)}%</ThemedText></View>
            <View style={styles.row}>
              <ThemedText>Lợi nhuận:</ThemedText>
              <ThemedText style={{ color: latestRun.profit >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                {latestRun.profit.toLocaleString()} điểm
              </ThemedText>
            </View>
          </View>
        )}

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444', marginTop: 40 }]} onPress={handleDelete}>
          <ThemedText style={styles.actionText}>Xóa chiến lược</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionBtn: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  }
});
