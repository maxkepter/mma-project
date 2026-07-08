import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeView } from '@/components/safe-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { JournalService, HistoryResponse } from '@/services/journal.service';

export default function HistoryScreen() {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const response = await JournalService.getHistory();
      setData(response);
    } catch (error) {
      console.error('Lỗi tải lịch sử:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderItem = ({ item }: { item: any }) => {
    const isWin = item.status === 'Won';
    return (
      <ThemedView style={styles.card}>
        <View style={styles.cardHeader}>
          <ThemedText type="subtitle">Số đánh: {item.number}</ThemedText>
          <ThemedText style={[styles.statusText, { color: isWin ? '#2ecc71' : '#e74c3c' }]}>
            {isWin ? 'Trúng' : 'Trượt'}
          </ThemedText>
        </View>
        <View style={styles.cardBody}>
          <ThemedText>Tiền cược: {item.amount.toLocaleString()}đ</ThemedText>
          <ThemedText>Ngày xổ: {new Date(item.betDate).toLocaleDateString('vi-VN')}</ThemedText>
          {isWin && item.result && (
            <ThemedText style={styles.winText}>Tiền nhận: +{item.result.payout.toLocaleString()}đ</ThemedText>
          )}
        </View>
      </ThemedView>
    );
  };

  return (
    <SafeView style={styles.container}>
      <View style={styles.summaryContainer}>
        <ThemedView style={styles.summaryBox}>
          <ThemedText style={styles.summaryLabel}>Tổng nạp</ThemedText>
          <ThemedText style={styles.summaryValue}>{data?.totalSpent.toLocaleString() || 0}đ</ThemedText>
        </ThemedView>
        <ThemedView style={styles.summaryBox}>
          <ThemedText style={styles.summaryLabel}>Lợi nhuận</ThemedText>
          <ThemedText
            style={[
              styles.summaryValue,
              { color: (data?.profit || 0) >= 0 ? '#2ecc71' : '#e74c3c' }
            ]}
          >
            {(data?.profit || 0) > 0 ? '+' : ''}{(data?.profit || 0).toLocaleString()}đ
          </ThemedText>
        </ThemedView>
      </View>

      <FlatList
        data={data?.bets || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <ThemedText>Chưa có lịch sử đánh nào.</ThemedText>
            </View>
          ) : null
        }
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  summaryBox: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardBody: {
    gap: 4,
  },
  statusText: {
    fontWeight: 'bold',
  },
  winText: {
    color: '#2ecc71',
    fontWeight: 'bold',
    marginTop: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
});
