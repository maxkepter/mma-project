import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LotteryLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="detail"
        options={{ title: 'Chi tiết kết quả', headerBackTitle: 'Trang chủ' }}
      />
      <Stack.Screen
        name="lookup"
        options={{ title: 'Tra cứu kết quả', headerBackTitle: 'Trang chủ' }}
      />
    </Stack>
  );
}