import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { SafeView } from '@/components/safe-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function formatDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function toIsoDate(d: Date): string {
  // Normalize to local midnight to avoid TZ drift when comparing with backend stored DATE.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function LotteryLookupScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (event.type === 'dismissed' || !date) return;
    }
    if (date) {
      setSelectedDate(date);
      setError(null);
    }
  };

  const handleLookup = () => {
    setError(null);
    if (selectedDate.getTime() > today.getTime()) {
      setError('Không thể tra cứu ngày trong tương lai.');
      return;
    }
    router.push(`/(tabs)/lottery/detail?date=${toIsoDate(selectedDate)}` as any);
  };

  const cardBg = colorScheme === 'dark' ? '#1f2937' : '#f9fafb';
  const cardBorder = colorScheme === 'dark' ? '#374151' : '#e5e7eb';

  return (
    <SafeView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Tra cứu kết quả</ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.icon }]}>
            Xem kết quả xổ số miền Bắc (XSMB) theo ngày
          </ThemedText>
        </ThemedView>

        <ThemedView
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <ThemedText style={styles.label}>Ngày cần tra cứu</ThemedText>

          {/* Android: tap-to-open pattern. iOS: inline wheel picker for nicer UX. */}
          {Platform.OS === 'android' && (
            <TouchableOpacity
              style={[
                styles.dateField,
                {
                  borderColor: error ? '#ef4444' : cardBorder,
                  backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#ffffff',
                },
              ]}
              onPress={() => setShowPicker(true)}
              activeOpacity={0.7}
            >
              <ThemedText style={[styles.dateFieldText, { color: colors.text }]}>
                {formatDate(selectedDate)}
              </ThemedText>
              <ThemedText style={{ color: colors.icon, fontSize: 14 }}>▾</ThemedText>
            </TouchableOpacity>
          )}

          {showPicker && (
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                maximumDate={today}
                minimumDate={new Date(2003, 0, 1)}
                onChange={handleChange}
              />
            </View>
          )}

          {error && <ThemedText style={styles.error}>{error}</ThemedText>}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={handleLookup}
            activeOpacity={0.85}
          >
            <ThemedText style={styles.buttonText}>Tra cứu</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView
          style={[
            styles.card,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <ThemedText style={[styles.helper, { color: colors.icon }]}>
            Dữ liệu có sẵn từ ngày 01/01/2003 đến hôm nay.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  header: { marginBottom: 16 },
  subtitle: { fontSize: 14, marginTop: 4 },
  card: { borderRadius: 12, borderWidth: 1, padding: 20, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  dateField: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateFieldText: { fontSize: 16 },
  pickerWrapper: { marginTop: 8 },
  error: { color: '#ef4444', fontSize: 12, marginTop: 6 },
  button: { height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  helper: { fontSize: 13, lineHeight: 20 },
});