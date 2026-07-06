import React from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeView } from '@/components/safe-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type StatSection = {
  id: string;
  title: string;
  description: string;
  route: `/stats/${string}`;
};

const STAT_SECTIONS: StatSection[] = [
  {
    id: 'frequency',
    title: 'Tần suất xuất hiện',
    description: 'Thống kê tần suất xuất hiện của các số trong khoảng thời gian nhất định.',
    route: '/stats/frequency',
  },
  {
    id: 'gan',
    title: 'Thống kê gan',
    description: 'Theo dõi số ngày gan của từng cặp số lô.',
    route: '/stats/gan',
  },
  {
    id: 'lo-roi',
    title: 'Lô rơi',
    description: 'Theo dõi các số lô tiếp tục xuất hiện từ đề hoặc lô ngày hôm trước.',
    route: '/stats/lo-roi',
  },
  {
    id: 'head-tail',
    title: 'Đầu đuôi',
    description: 'Thống kê tần suất đầu và đuôi trong kết quả xổ số.',
    route: '/stats/head-tail',
  },
  {
    id: 'pairs',
    title: 'Cặp số liên kết',
    description: 'Phân tích các cặp số thường xuất hiện cùng nhau.',
    route: '/stats/pairs',
  },
  {
    id: 'heatmap',
    title: 'Bản đồ nhiệt',
    description: 'Trực quan hóa tần suất xuất hiện theo bản đồ nhiệt màu sắc.',
    route: '/stats/heatmap',
  },
  {
    id: 'analytics',
    title: 'Phân tích & Dự báo',
    description: 'Phân tích xu hướng, chu kỳ, tương quan và dự báo các số tiềm năng.',
    route: '/stats/analytics',
  },
];

export default function StatsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const cardBg = colorScheme === 'dark' ? '#1f2937' : '#f9fafb';
  const cardBorder = colorScheme === 'dark' ? '#374151' : '#e5e7eb';

  return (
    <SafeView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText type="title">Thống kê & Phân tích</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
            Phân tích dữ liệu và nhận định chuyên sâu
          </ThemedText>
        </ThemedView>

        {/* Stat Section Cards */}
        <ThemedView style={styles.sectionList}>
          {STAT_SECTIONS.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={[
                styles.card,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => router.push(section.route)}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                    {section.title}
                  </ThemedText>
                  <ThemedText style={[styles.arrow, { color: colors.icon }]}>›</ThemedText>
                </View>
                <ThemedText style={[styles.cardDescription, { color: colors.icon }]}>
                  {section.description}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </ThemedView>
      </ScrollView>
    </SafeView>
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
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  sectionList: {
    gap: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    gap: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 17,
    flex: 1,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
  arrow: {
    fontSize: 22,
    fontWeight: '300',
  },
});
