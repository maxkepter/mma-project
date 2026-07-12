import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeView } from '@/components/safe-view';
import { LoginPrompt } from '@/components/login-prompt';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { JournalService, PortfolioResponse } from '@/services/journal.service';
import { useAuth } from '@/contexts/auth-context';

export default function PortfolioScreen() {
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated } = useAuth();

  const fetchData = async () => {
    try {
      const response = await JournalService.getPortfolio();
      setData(response);
    } catch (error) {
      console.error('Lỗi tải danh mục:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      fetchData();
    }, [isAuthenticated]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCancel = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn hủy con số này?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy bỏ',
        style: 'destructive',
        onPress: async () => {
          try {
            await JournalService.cancelBet(id);
            fetchData();
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể hủy số này');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <ThemedView style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText type="subtitle">Số: {item.number}</ThemedText>
        <ThemedText style={styles.pendingText}>Đang ôm</ThemedText>
      </View>
      <View style={styles.cardBody}>
        <ThemedText>Tiền cược: {item.amount.toLocaleString()}đ</ThemedText>
        <ThemedText>
          Ngày xổ: {new Date(item.betDate).toLocaleDateString('vi-VN')}
        </ThemedText>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleCancel(item.id)}
      >
        <IconSymbol name="trash" size={20} color='#e74c3c' />
      </TouchableOpacity>
    </ThemedView>
  );

  // Defense in depth: if a guest somehow lands here (deep link, race), show the prompt
  // directly so user-specific data never flashes.
  if (!isAuthenticated) {
    return (
      <SafeView style={[styles.container, { backgroundColor: isDark ? '#151718' : '#fff' }]}>
        <View style={styles.guestContainer}>
          <LoginPrompt
            visible
            onClose={() => router.replace('/(tabs)' as any)}
            message="Vui lòng đăng nhập để xem sổ đề cá nhân của bạn."
          />
        </View>
      </SafeView>
    );
  }

  return (
    <SafeView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Sổ đề hôm nay</ThemedText>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/portfolio/history')}
        >
          <IconSymbol
            name="clock.arrow.circlepath"
            size={24}
            color={isDark ? Colors.dark.tint : Colors.light.tint}
          />
        </TouchableOpacity>
      </View>

      <ThemedView style={styles.summaryCard}>
        <ThemedText>Tổng vốn đang ôm</ThemedText>
        <ThemedText type="title" style={styles.totalAmount}>
          {data?.totalInvestment.toLocaleString() || 0}đ
        </ThemedText>
      </ThemedView>

      <FlatList
        data={data?.bets || []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <ThemedText>Chưa ghi số nào hôm nay.</ThemedText>
            </View>
          ) : null
        }
      />

      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: Colors[colorScheme ?? 'light'].tint },
        ]}
        onPress={() => router.push('/(tabs)/portfolio/create')}
      >
        <IconSymbol name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  totalAmount: {
    fontSize: 28,
    marginTop: 8,
    color: '#e74c3c',
  },
  list: {
    paddingBottom: 100,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardBody: {
    gap: 4,
  },
  pendingText: {
    color: '#f39c12',
    fontWeight: 'bold',
  },
  deleteButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    padding: 8,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
