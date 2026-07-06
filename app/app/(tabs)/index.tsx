import React from 'react';
import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth-context';

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuth();

  // Mock lottery result data
  const latestResult = {
    province: 'TP. Hồ Chí Minh',
    date: '06/07/2026',
    specialPrize: '123456',
    firstPrize: '78901',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Greeting */}
        <ThemedView style={styles.header}>
          <ThemedText type="title">Trang chủ</ThemedText>
          <ThemedText style={[styles.greeting, { color: colors.icon }]}>
            Xin chào, {user?.displayName || 'Người dùng'}
          </ThemedText>
        </ThemedView>

        {/* Latest Result Card */}
        <ThemedView
          style={[
            styles.card,
            {
              backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#f9fafb',
              borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <ThemedText type="subtitle">Kết quả mới nhất</ThemedText>
            <ThemedText style={[styles.date, { color: colors.icon }]}>
              {latestResult.date}
            </ThemedText>
          </View>
          <ThemedText style={[styles.province, { color: colors.icon }]}>
            {latestResult.province}
          </ThemedText>
          <View style={styles.resultRow}>
            <ThemedText style={styles.resultLabel}>Giải đặc biệt:</ThemedText>
            <ThemedText
              type="defaultSemiBold"
              style={[styles.resultValue, { color: colors.tint }]}
            >
              {latestResult.specialPrize}
            </ThemedText>
          </View>
          <View style={styles.resultRow}>
            <ThemedText style={styles.resultLabel}>Giải nhất:</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.resultValue}>
              {latestResult.firstPrize}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.viewDetailButton, { borderColor: colors.tint }]}
          >
            <ThemedText style={[styles.viewDetailText, { color: colors.tint }]}>
              Xem chi tiết
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Quick Actions Grid */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Chức năng
          </ThemedText>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#f9fafb',
                  borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                },
              ]}
            >
              <IconSymbol name="chart.bar.fill" size={32} color={colors.tint} />
              <ThemedText style={styles.actionLabel}>Thống kê</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#f9fafb',
                  borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                },
              ]}
            >
              <IconSymbol name="paperplane.fill" size={32} color={colors.tint} />
              <ThemedText style={styles.actionLabel}>Soi cầu</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#f9fafb',
                  borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                },
              ]}
            >
              <IconSymbol name="chevron.right" size={32} color={colors.tint} />
              <ThemedText style={styles.actionLabel}>Chiến lược</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#f9fafb',
                  borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                },
              ]}
            >
              <IconSymbol name="house.fill" size={32} color={colors.tint} />
              <ThemedText style={styles.actionLabel}>Nhật ký</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    marginTop: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
  },
  province: {
    fontSize: 14,
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 16,
  },
  resultValue: {
    fontSize: 20,
    letterSpacing: 2,
  },
  viewDetailButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  viewDetailText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionLabel: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});
