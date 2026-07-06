import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '../../contexts/auth-context';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      // Navigation to /(tabs) will be handled automatically by the auth guard in _layout.tsx
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Lỗi', error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            {/* Header / Logo */}
            <View style={styles.headerContainer}>
              <Text style={[styles.title, { color: colors.text }]}>Đăng Nhập</Text>
              <Text style={[styles.subtitle, { color: colors.icon }]}>
                Hệ thống phân tích xổ số
              </Text>
            </View>

            {/* Form Inputs */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Tên đăng nhập</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.icon,
                      color: colors.text,
                      backgroundColor: colorScheme === 'dark' ? '#1f2223' : '#f5f5f5',
                    },
                  ]}
                  placeholder="Nhập tên đăng nhập"
                  placeholderTextColor={colors.icon}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Mật khẩu</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.icon,
                      color: colors.text,
                      backgroundColor: colorScheme === 'dark' ? '#1f2223' : '#f5f5f5',
                    },
                  ]}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor={colors.icon}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.tint }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Đăng nhập</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer / Navigation */}
            <View style={styles.footerContainer}>
              <Text style={[styles.footerText, { color: colors.icon }]}>
                Chưa có tài khoản?{' '}
              </Text>
              <Link href="/register" asChild>
                <TouchableOpacity>
                  <Text style={[styles.linkText, { color: colors.tint }]}>Đăng ký ngay</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
