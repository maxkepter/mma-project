import React from 'react';
import {
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth-context';

type SettingItem = {
  id: string;
  label: string;
};

const SETTINGS: SettingItem[] = [
  { id: 'account', label: 'Thông tin tài khoản' },
  { id: 'notifications', label: 'Thông báo' },
  { id: 'appearance', label: 'Giao diện' },
  { id: 'privacy', label: 'Bảo mật & Quyền riêng tư' },
  { id: 'about', label: 'Về ứng dụng' },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0] || '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user, logout } = useAuth();

  const cardBg = colorScheme === 'dark' ? '#1f2937' : '#f9fafb';
  const cardBorder = colorScheme === 'dark' ? '#374151' : '#e5e7eb';

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất không?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
      { cancelable: true },
    );
  };

  const displayName = user?.displayName || 'Người dùng';
  const initials = getInitials(displayName);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ThemedView style={styles.header}>
          <ThemedText type="title">Cá nhân</ThemedText>
        </ThemedView>

        {/* User Info Card */}
        <ThemedView
          style={[styles.userCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
        >
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
            <ThemedText
              style={[
                styles.avatarText,
                { color: colorScheme === 'dark' ? '#151718' : '#fff' },
              ]}
            >
              {initials}
            </ThemedText>
          </View>

          {/* Info */}
          <ThemedText type="subtitle" style={styles.displayName}>
            {displayName}
          </ThemedText>
          {user?.username && (
            <ThemedText style={[styles.username, { color: colors.icon }]}>
              @{user.username}
            </ThemedText>
          )}
          {user?.email && (
            <ThemedText style={[styles.email, { color: colors.icon }]}>
              {user.email}
            </ThemedText>
          )}
        </ThemedView>

        {/* Settings Section */}
        <ThemedView style={styles.settingsSection}>
          <ThemedText type="defaultSemiBold" style={[styles.sectionLabel, { color: colors.icon }]}>
            CÀI ĐẶT
          </ThemedText>
          <ThemedView
            style={[styles.settingsList, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            {SETTINGS.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.settingRow,
                  index < SETTINGS.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: cardBorder,
                  },
                ]}
                activeOpacity={0.6}
              >
                <ThemedText style={styles.settingLabel}>{item.label}</ThemedText>
                <ThemedText style={[styles.chevron, { color: colors.icon }]}>›</ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        </ThemedView>

        {/* Logout Button */}
        <TouchableOpacity style={[styles.logoutButton]} onPress={handleLogout} activeOpacity={0.8}>
          <ThemedText style={styles.logoutText}>Đăng xuất</ThemedText>
        </TouchableOpacity>
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  userCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  displayName: {
    marginBottom: 6,
    textAlign: 'center',
  },
  username: {
    fontSize: 14,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingsList: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  settingLabel: {
    fontSize: 16,
  },
  chevron: {
    fontSize: 20,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
