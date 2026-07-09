import { Stack } from 'expo-router';

export default function PortfolioLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="history" options={{ title: 'Lịch sử đánh', headerShown: true }} />
      <Stack.Screen name="create" options={{ title: 'Ghi số mới', presentation: 'modal' }} />
    </Stack>
  );
}
