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
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '../../contexts/auth-context';

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

  const handleRegister = async () => {
    // Validate required fields
    if (!username.trim() || !email.trim() || !displayName.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường thông tin.');
      return;
    }

    // Check password match
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi', 'Địa chỉ email không hợp lệ.');
      return;
    }

    setLoading(true);
    try {
      await register(username, email, displayName, password);
      setLoading(false);
      Alert.alert(
        'Thành công',
        'Đăng ký tài khoản thành công! Vui lòng đăng nhập.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Lỗi', error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
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
              {/* Username */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Tên đăng nhập *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.icon,
                      color: colors.text,
                      backgroundColor: colorScheme === 'dark' ? '#1f2223' : '#f5f5f5',
                    },
                  ]}
                  placeholder="Nhập tên đăng nhập (duy nhất)"
                  placeholderTextColor={colors.icon}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Email *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.icon,
                      color: colors.text,
                      backgroundColor: colorScheme === 'dark' ? '#1f2223' : '#f5f5f5',
                    },
                  ]}
                  placeholder="Nhập địa chỉ email"
                  placeholderTextColor={colors.icon}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Display Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Tên hiển thị *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.icon,
                      color: colors.text,
                      backgroundColor: colorScheme === 'dark' ? '#1f2223' : '#f5f5f5',
                    },
                  ]}
                  placeholder="Nhập tên hiển thị của bạn"
                  placeholderTextColor={colors.icon}
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Mật khẩu *</Text>
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

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Xác nhận mật khẩu *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: colors.icon,
                      color: colors.text,
                      backgroundColor: colorScheme === 'dark' ? '#1f2223' : '#f5f5f5',
                    },
                  ]}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor={colors.icon}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
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
});
