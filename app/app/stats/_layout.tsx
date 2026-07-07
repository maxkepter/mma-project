import { Stack } from 'expo-router';
import React from 'react';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function StatsLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.tint,
        headerBackTitle: 'Quay lại',
      }}
    >
      <Stack.Screen name="frequency" options={{ title: 'Tần suất' }} />
      <Stack.Screen name="gan" options={{ title: 'Thống kê Gan' }} />
      <Stack.Screen name="lo-roi" options={{ title: 'Lô rơi' }} />
      <Stack.Screen name="head-tail" options={{ title: 'Đầu đuôi' }} />
      <Stack.Screen name="pairs" options={{ title: 'Cặp số' }} />
      <Stack.Screen name="heatmap" options={{ title: 'Bản đồ nhiệt' }} />
      <Stack.Screen name="analytics" options={{ title: 'Phân tích & Dự báo' }} />
    </Stack>
  );
}
