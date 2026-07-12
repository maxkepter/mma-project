import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../contexts/auth-context';
import { isProtectedRoute } from '@/constants/protected-routes';
import { LoginPrompt } from '@/components/login-prompt';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  // Filter out route group wrappers ("(tabs)", "(auth)") for matching, but keep them
  // for the inAuthGroup check. isProtectedRoute now accepts the segments array directly.
  const inAuthGroup = segments[0] === '(auth)';
  const onProtectedRoute = isProtectedRoute(segments);

  // LoginPrompt state
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // After login/register → bounce back to tabs (preserves any returnTo handled by login screen itself)
    if (isAuthenticated && inAuthGroup) {
      setShowLoginPrompt(false);
      router.replace('/(tabs)');
      return;
    }

    // Guest trying to access a protected route → open prompt instead of redirecting.
    if (!isAuthenticated && !inAuthGroup && onProtectedRoute) {
      setShowLoginPrompt(true);
      return;
    }

    // Otherwise (public route, or authed user on protected route) → ensure prompt is closed.
    setShowLoginPrompt(false);
  }, [isAuthenticated, isLoading, segments, router, onProtectedRoute, inAuthGroup]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
      <LoginPrompt
        visible={showLoginPrompt}
        onClose={() => {
          setShowLoginPrompt(false);
          // If the user cancels while sitting on a protected route, kick them back
          // to the public home — otherwise they're stranded between the protected
          // screen and the prompt with no way out.
          if (onProtectedRoute) {
            router.replace('/(tabs)');
          }
        }}
      />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}