import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '../../contexts/auth-context';
import { SafeView } from '@/components/safe-view';

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    username: string;
    password: string;
    _server?: string;
  }>({ username: '', password: '' });

  const validateForm = (): boolean => {
    const newErrors = { username: '', password: '' };
    let isValid = true;

    if (!username.trim()) {
      newErrors.username = 'Tên đăng nhập là bắt buộc.';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Mật khẩu là bắt buộc.';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(username, password);
      // Navigation to /(tabs) will be handled automatically by the auth guard in _layout.tsx
    } catch (error: any) {
      setLoading(false);
      const serverMessage =
        error?.response?.data?.message?.[0] ||
        error?.message ||
        'Đăng nhập thất bại. Vui lòng thử lại.';
      setErrors((prev) => ({ ...prev, _server: serverMessage }));
    }
  };

  const formContent = (
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
              {errors._server ? (
                <View style={styles.serverErrorBanner}>
                  <Text style={styles.serverErrorText}>{errors._server}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Tên đăng nhập</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.username ? '#e74c3c' : colors.icon,
                      color: colors.text,
                      backgroundColor: colorScheme === 'dark' ? '#1f2223' : '#f5f5f5',
                    },
                  ]}
                  placeholder="Nhập tên đăng nhập"
                  placeholderTextColor={colors.icon}
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (errors.username) setErrors((p) => ({ ...p, username: '' }));
                    if (errors._server) setErrors((p) => ({ ...p, _server: undefined }));
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.username ? (
                  <Text style={styles.fieldError}>{errors.username}</Text>
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Mật khẩu</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.password ? '#e74c3c' : colors.icon,
                      color: colors.text,
                      backgroundColor: colorScheme === 'dark' ? '#1f2223' : '#f5f5f5',
                    },
                  ]}
                  placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                  placeholderTextColor={colors.icon}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors((p) => ({ ...p, password: '' }));
                    if (errors._server) setErrors((p) => ({ ...p, _server: undefined }));
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.password ? (
                  <Text style={styles.fieldError}>{errors.password}</Text>
                ) : null}
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
  );

  return (
    <SafeView style={[styles.container, { backgroundColor: colors.background }]}>
      {Platform.OS === 'web' ? (
        formContent
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            {formContent}
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}
    </SafeView>
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
  serverErrorBanner: {
    backgroundColor: '#fdecea',
    borderColor: '#e74c3c',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  serverErrorText: {
    color: '#c0392b',
    fontSize: 14,
    textAlign: 'center',
  },
  fieldError: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
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
