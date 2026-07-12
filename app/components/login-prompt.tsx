/**
 * LoginPrompt - Modal overlay shown when a guest user tries to access a protected screen.
 *
 * Behavior:
 *   - Tap "Đăng nhập" → navigate to /login (returnTo query param is handled by RootLayoutNav).
 *   - Tap "Hủy" → close the prompt, leave user on the current screen.
 *
 * Why not redirect: avoids losing the user's context (e.g. they were deep-linking into
 * /strategy/123). They can still tap back themselves if they want.
 */
import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type Props = {
  visible: boolean;
  onClose: () => void;
  message?: string;
};

export function LoginPrompt({ visible, onClose, message }: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleLogin = () => {
    onClose();
    router.push('/login');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ThemedView
          style={styles.content}
          lightColor="#ffffff"
          darkColor="#1f2223"
        >
          <View style={styles.iconContainer}>
            <MaterialIcons name="lock-outline" size={56} color={colors.tint} />
          </View>

          <ThemedText style={styles.title} type="subtitle">
            Đăng nhập để tiếp tục
          </ThemedText>

          <ThemedText style={styles.message}>
            {message ?? 'Tính năng này yêu cầu đăng nhập. Vui lòng đăng nhập để tiếp tục.'}
          </ThemedText>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.tint }]}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.primaryButtonText,
                { color: colorScheme === 'dark' ? '#151718' : '#fff' },
              ]}
            >
              Đăng nhập
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.icon }]}>
              Hủy
            </Text>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '90%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    opacity: 0.8,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});