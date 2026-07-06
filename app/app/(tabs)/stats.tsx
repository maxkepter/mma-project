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
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type StatSection = {
  id: string;
  title: string;
  description: string;
};

const STAT_SECTIONS: StatSection[] = [
  {
    id: 'frequency',
    title: 'Tần suất xuất hiện',
    description: 'Thống kê tần suất xuất hiện của các số trong khoảng thời gian nhất định.',
  },
  {
    id: 'gan',
    title: 'Thống kê gan',
    description: 'Theo dõi số ngày gan của từng cặp số lô.',
  },
  {
    id: 'head-tail',
    title: 'Đầu đuôi',
    description: 'Thống kê tần suất đầu và đuôi trong kết quả xổ số.',
  },
  {
    id: 'pairs',
    title: 'Cặp số liên kết',
    description: 'Phân tích các cặp số thường xuất hiện cùng nhau.',
  },
  {
    id: 'heatmap',
    title: 'Bản đồ nhiệt',
    description: 'Trực quan hóa tần suất xuất hiện theo bản đồ nhiệt màu sắc.',
  },
];

export default function StatsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const cardBg = colorScheme === 'dark' ? '#1f2937' : '#f9fafb';
  const cardBorder = colorScheme === 'dark' ? '#374151' : '#e5e7eb';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText type="title">Thống kê</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
            Phân tích dữ liệu xổ số
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
            >
              <View style={styles.cardContent}>
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                  {section.title}
                </ThemedText>
                <ThemedText style={[styles.cardDescription, { color: colors.icon }]}>
                  {section.description}
                </ThemedText>
              </View>
              <ThemedText style={[styles.comingSoon, { color: colors.tint }]}>
                Sắp ra mắt
              </ThemedText>
            </TouchableOpacity>
          ))}
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
  comingSoon: {
    fontSize: 13,
    fontWeight: '600',
  },
});
