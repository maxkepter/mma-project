import { Stack } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function StrategyLayout() {
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
        name="index"
        options={{
          title: 'Chiến lược',
          headerBackTitle: 'Trang chủ'
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: 'Tạo chiến lược mới',
          presentation: 'modal'
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Chi tiết chiến lược',
        }}
      />
    </Stack>
  );
}
