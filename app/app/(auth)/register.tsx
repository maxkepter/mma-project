import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ScrollView,
  Modal,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '../../contexts/auth-context';
import { SafeView } from '@/components/safe-view';

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { register } = useAuth();

  // Form state based on User entity fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  // Ref to track the auto-redirect timer so we can clear it on manual interaction
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inline field errors
  const [errors, setErrors] = useState<{
    username: string;
    email: string;
    displayName: string;
    password: string;
    confirmPassword: string;
    _server?: string;
  }>({
    username: '',
    email: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });

  // Manually close the success modal and navigate to /login (also cancel the timer)
  const handleRedirectToLogin = useCallback(() => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    setSuccessModalVisible(false);
    router.replace('/login');
  }, [router]);

  // Schedule an auto-redirect to /login 3 seconds after the success modal appears.
  // Cleans up the timer if the modal closes early or the screen unmounts.
  useEffect(() => {
    if (!successModalVisible) return;

    redirectTimerRef.current = setTimeout(() => {
      setSuccessModalVisible(false);
      router.replace('/login');
    }, 3000);

    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [successModalVisible, router]);

  const validateForm = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const newErrors = {
      username: '',
      email: '',
      displayName: '',
      password: '',
      confirmPassword: '',
    };
    let isValid = true;

    if (!username.trim()) {
      newErrors.username = 'Tên đăng nhập là bắt buộc.';
      isValid = false;
    } else if (username.trim().length < 3) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự.';
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = 'Email là bắt buộc.';
      isValid = false;
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Địa chỉ email không hợp lệ.';
      isValid = false;
    }

    if (!displayName.trim()) {
      newErrors.displayName = 'Tên hiển thị là bắt buộc.';
      isValid = false;
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'Tên hiển thị phải có ít nhất 2 ký tự.';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Mật khẩu là bắt buộc.';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register(username, email, displayName, password);
      setLoading(false);
      setSuccessModalVisible(true);
    } catch (error: any) {
      setLoading(false);
      // Show server error inline at the top of the form
      const serverMessage =
        error?.response?.data?.message?.[0] ||
        error?.message ||
        'Đăng ký thất bại. Vui lòng thử lại.';
      setErrors((prev) => ({ ...prev, _server: serverMessage }));
    }
  };

  const formContent = (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
            {/* Header */}
            <View style={styles.headerContainer}>
              <Text style={[styles.title, { color: colors.text }]}>Tạo Tài Khoản</Text>
              <Text style={[styles.subtitle, { color: colors.icon }]}>
                Đăng ký để sử dụng các tính năng phân tích
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {/* Server error banner */}
              {errors._server ? (
                <View style={styles.serverErrorBanner}>
                  <Text style={styles.serverErrorText}>{errors._server}</Text>
                </View>
              ) : null}

              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Tên đăng nhập *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.username ? '#e74c3c' : colors.icon,
                      color: colors.text,
                      backgroundColor: colorScheme === 'dark' ? '#1f2223' : '#f5f5f5',
                    },
                  ]}
                  placeholder="Nhập tên đăng nhập (duy nhất)"
                  placeholderTextColor={colors.icon}
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (errors.username) setErrors((p) => ({ ...p, username: '' }));
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.username ? (
                  <Text style={styles.fieldError}>{errors.username}</Text>
                ) : null}
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Email *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.email ? '#e74c3c' : colors.icon,
                      color: colors.text,
                      backgroundColor: colorScheme === 'dark' ? '#1f2223' : '#f5f5f5',
                    },
                  ]}
                  placeholder="Nhập địa chỉ email"
                  placeholderTextColor={colors.icon}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors((p) => ({ ...p, email: '' }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.email ? (
                  <Text style={styles.fieldError}>{errors.email}</Text>
                ) : null}
              </View>

              {/* Display Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Tên hiển thị *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.displayName ? '#e74c3c' : colors.icon,
                      color: colors.text,
                      backgroundColor: colorScheme === 'dark' ? '#1f2223' : '#f5f5f5',
                    },
                  ]}
                  placeholder="Nhập tên hiển thị của bạn"
                  placeholderTextColor={colors.icon}
                  value={displayName}
                  onChangeText={(text) => {
                    setDisplayName(text);
                    if (errors.displayName) setErrors((p) => ({ ...p, displayName: '' }));
                  }}
                />
                {errors.displayName ? (
                  <Text style={styles.fieldError}>{errors.displayName}</Text>
                ) : null}
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Mật khẩu *</Text>
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
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.password ? (
                  <Text style={styles.fieldError}>{errors.password}</Text>
                ) : null}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Xác nhận mật khẩu *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.confirmPassword ? '#e74c3c' : colors.icon,
                      color: colors.text,
                      backgroundColor: colorScheme === 'dark' ? '#1f2223' : '#f5f5f5',
                    },
                  ]}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor={colors.icon}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: '' }));
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.confirmPassword ? (
                  <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
                ) : null}
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.tint }]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Đăng ký</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={[styles.footerText, { color: colors.icon }]}>
                Đã có tài khoản?{' '}
              </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={[styles.linkText, { color: colors.tint }]}>Đăng nhập</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </ScrollView>
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

      {/* Success Modal */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleRedirectToLogin}
      >
        <View style={styles.modalOverlay}>
          <ThemedView
            style={styles.modalContent}
            lightColor="#ffffff"
            darkColor="#1f2223"
          >
            <View style={styles.iconContainer}>
              <MaterialIcons name="check-circle" size={64} color="#2ecc71" />
            </View>
            <ThemedText style={styles.modalTitle} type="subtitle">
              Đăng ký thành công!
            </ThemedText>
            <ThemedText style={styles.modalMessage}>
              Tài khoản của bạn đã được tạo thành công. Hệ thống sẽ tự động chuyển
              hướng đến trang đăng nhập sau 3 giây.
            </ThemedText>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.tint }]}
              onPress={handleRedirectToLogin}
            >
              <Text
                style={[
                  styles.modalButtonText,
                  {
                    color: colorScheme === 'dark' ? '#151718' : '#fff',
                  },
                ]}
              >
                Đăng nhập ngay
              </Text>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </Modal>
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
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
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
    marginTop: 14,
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
    marginTop: 10,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '90%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    opacity: 0.8,
  },
  modalButton: {
    width: '100%',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
