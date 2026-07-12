import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeView } from '@/components/safe-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth-context';
import { aiInsightApi, AIInsightItem } from '@/services/ai-insight-api';
import { lotteryApi, getPrizeValues, LotteryResultDetail } from '@/services/lottery-api';

const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

const isSameCalendarDay = (date1: Date, date2Str: string) => {
  const date2 = new Date(date2Str);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const getDayLabel = (d: Date) => {
  const today = new Date();
  const date1Str = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const date2Str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (date1Str === date2Str) return 'Hôm nay';
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return `${days[d.getDay()]}\n${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const last7Days = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i);
  return d;
});

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [insights, setInsights] = useState<AIInsightItem[]>([]);
  const [latest, setLatest] = useState<LotteryResultDetail | null>(null);
  const [latestLoading, setLatestLoading] = useState(true);
  const [latestError, setLatestError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(last7Days[0]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiInsightApi.getDailyInsights();
      setInsights(res.data);
    } catch (err: any) {
      setError(err.message || 'Tải phân tích thất bại');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      // Guard: only fetch when authenticated. HomeScreen can mount briefly
      // before RootLayoutNav redirects to /login, which would otherwise hit
      // /ai/insights/daily without a valid token and produce a 401.
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      fetchInsights();
    }, [isAuthenticated]),
  );

  // Latest XSMB result is public — refresh on focus so the home card stays current.
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      const loadLatest = async () => {
        setLatestLoading(true);
        setLatestError(null);
        try {
          const res = await lotteryApi.getLatest();
          if (!cancelled) setLatest(res.data);
        } catch (err: any) {
          if (!cancelled) {
            setLatestError(err?.message || 'Không tải được kết quả mới nhất');
          }
        } finally {
          if (!cancelled) setLatestLoading(false);
        }
      };
      loadLatest();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const handleGenerateInsight = async () => {
    setGenerating(true);
    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      await aiInsightApi.generateInsight({ targetDate: dateStr });
      await fetchInsights();
      Alert.alert('Thành công', 'Đã tạo insight mới');
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Tạo insight thất bại');
    } finally {
      setGenerating(false);
    }
  };

  const selectedInsight = insights.find((item) => {
    if (item.targetDate) {
      const date2 = new Date(item.targetDate);
      return (
        selectedDate.getFullYear() === date2.getFullYear() &&
        selectedDate.getMonth() === date2.getMonth() &&
        selectedDate.getDate() === date2.getDate()
      );
    }
    return isSameCalendarDay(selectedDate, item.createdAt);
  });

  // Mock lottery result data
  const latestResult = useMemo(() => {
    if (!latest) return null;
    const [y, m, d] = latest.date.split('-');
    return {
      province: 'Miền Bắc',
      date: `${d}/${m}/${y}`,
      specialPrize: getPrizeValues(latest, 'Special')[0] ?? '',
      firstPrize: getPrizeValues(latest, 'First')[0] ?? '',
    };
  }, [latest]);

  return (
    <SafeView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Greeting */}
        <ThemedView style={styles.header}>
          <ThemedText type="title">Trang chủ</ThemedText>
          <ThemedText style={[styles.greeting, { color: colors.icon }]}>
            Xin chào, {isAuthenticated ? (user?.displayName || 'bạn') : 'bạn'}
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
          {latestLoading ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator color={colors.tint} />
            </View>
          ) : latestError || !latestResult ? (
            <ThemedText style={{ color: '#ef4444', textAlign: 'center' }}>
              {latestError || 'Không có dữ liệu kết quả'}
            </ThemedText>
          ) : (
            <>
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
                  {latestResult.specialPrize || '—'}
                </ThemedText>
              </View>
              <View style={styles.resultRow}>
                <ThemedText style={styles.resultLabel}>Giải nhất:</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.resultValue}>
                  {latestResult.firstPrize || '—'}
                </ThemedText>
              </View>
              <TouchableOpacity
                style={[styles.viewDetailButton, { borderColor: colors.tint }]}
                onPress={() => router.push('/(tabs)/lottery/detail' as any)}
              >
                <ThemedText style={[styles.viewDetailText, { color: colors.tint }]}>
                  Xem chi tiết
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewDetailButton, { borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb', marginTop: 8 }]}
                onPress={() => router.push('/(tabs)/lottery/lookup' as any)}
              >
                <ThemedText style={[styles.viewDetailText, { color: colors.text }]}>
                  Tra cứu theo ngày
                </ThemedText>
              </TouchableOpacity>
            </>
          )}
        </ThemedView>

        {/* Investment Suggestions  */}
        <ThemedView style={styles.section}>
          <ThemedView style={styles.sectionTitleRow}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Phân tích hôm nay
            </ThemedText>
            {DEV_MODE && (
              <TouchableOpacity
                style={[styles.generateButton, { backgroundColor: colors.tint }]}
                onPress={handleGenerateInsight}
                disabled={generating}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.generateButtonText}>+ Gen Insight</ThemedText>
                )}
              </TouchableOpacity>
            )}
          </ThemedView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateSelectorScroll}
          >
            {last7Days.map((date, index) => {
              const date1Str = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
              const date2Str = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              const isSelected = date1Str === date2Str;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateButton,
                    isSelected
                      ? {
                          backgroundColor: colors.tint,
                          borderColor: colors.tint,
                        }
                      : {
                          backgroundColor:
                            colorScheme === 'dark' ? '#1f2937' : '#f9fafb',
                          borderColor:
                            colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                        },
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <ThemedText
                    style={[
                      styles.dateButtonText,
                      isSelected
                        ? { color: '#ffffff', fontWeight: 'bold' }
                        : { color: colors.text },
                    ]}
                  >
                    {getDayLabel(date)}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {loading ? (
            <View style={styles.cardCenter}>
              <ActivityIndicator size="small" color={colors.tint} />
            </View>
          ) : error ? (
            <View style={styles.cardCenter}>
              <ThemedText style={{ color: '#ef4444' }}>{error}</ThemedText>
            </View>
          ) : selectedInsight ? (
            <ThemedView
              style={[
                styles.insightCard,
                {
                  backgroundColor:
                    colorScheme === 'dark' ? '#1f2937' : '#f9fafb',
                  borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                },
              ]}
            >
              <View style={styles.insightCardHeader}>
                <ThemedText
                  style={[styles.insightDate, { color: colors.icon }]}
                >
                  Cập nhật:{' '}
                  {new Date(selectedInsight.createdAt).toLocaleTimeString(
                    'vi-VN',
                    { hour: '2-digit', minute: '2-digit' },
                  )}
                </ThemedText>
                <View
                  style={[styles.confBadge, { backgroundColor: colors.tint }]}
                >
                  <ThemedText style={styles.confText}>
                    Độ tin cậy:{' '}
                    {Math.round(selectedInsight.confidenceScore * 100)}%
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.insightContent}>
                {selectedInsight.content}
              </ThemedText>
            </ThemedView>
          ) : !isAuthenticated ? (
            <ThemedView
              style={[
                styles.insightCard,
                {
                  backgroundColor:
                    colorScheme === 'dark' ? '#1f2937' : '#f9fafb',
                  borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                  alignItems: 'center',
                  paddingVertical: 24,
                  gap: 12,
                },
              ]}
            >
              <ThemedText style={{ color: colors.icon, textAlign: 'center' }}>
                Đăng nhập để nhận phân tích cá nhân.
              </ThemedText>
              <TouchableOpacity
                style={[styles.viewDetailButton, { borderColor: colors.tint }]}
                onPress={() => router.push('/login' as any)}
              >
                <ThemedText style={[styles.viewDetailText, { color: colors.tint }]}>
                  Đăng nhập
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          ) : (
            <ThemedView
              style={[
                styles.insightCard,
                {
                  backgroundColor:
                    colorScheme === 'dark' ? '#1f2937' : '#f9fafb',
                  borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                  alignItems: 'center',
                  paddingVertical: 24,
                },
              ]}
            >
              <ThemedText style={{ color: colors.icon, textAlign: 'center' }}>
                Không có phân tích cho ngày này.
              </ThemedText>
            </ThemedView>
          )}
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
                  backgroundColor:
                    colorScheme === 'dark' ? '#1f2937' : '#f9fafb',
                  borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                },
              ]}
              onPress={() => router.push('/ai-assistant/chat' as any)}
            >
              <IconSymbol
                name="paperplane.fill"
                size={32}
                color={colors.tint}
              />
              <ThemedText style={styles.actionLabel}>Trợ lý AI</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  backgroundColor:
                    colorScheme === 'dark' ? '#1f2937' : '#f9fafb',
                  borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                },
              ]}
              onPress={() => router.push('/strategy' as any)}
            >
              <IconSymbol name="chevron.right" size={32} color={colors.tint} />
              <ThemedText style={styles.actionLabel}>Chiến lược</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                {
                  backgroundColor:
                    colorScheme === 'dark' ? '#1f2937' : '#f9fafb',
                  borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                },
              ]}
              onPress={() => router.push('/(tabs)/portfolio/history' as any)}
            >
              <IconSymbol name="house.fill" size={32} color={colors.tint} />
              <ThemedText style={styles.actionLabel}>Nhật ký</ThemedText>
            </TouchableOpacity>
          </View>
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
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  generateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
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
  dateSelectorScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  dateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  dateButtonText: {
    fontSize: 13,
    textAlign: 'center',
  },
  insightCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  insightCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  insightDate: {
    fontSize: 12,
  },
  confBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  confText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  insightContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardCenter: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
