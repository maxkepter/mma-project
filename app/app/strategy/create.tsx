import React, { useState } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeView } from '@/components/safe-view';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { strategyApi, StrategyCondition } from '@/services/strategy-api';

export default function CreateStrategyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên chiến lược');
      return;
    }

    setLoading(true);
    try {
      // Basic mock condition for YAGNI, real builder could be complex
      const mockCondition: StrategyCondition = {
        type: 'frequency',
        parameters: { minCount: 5, window: 30 }
      };

      await strategyApi.create({
        name,
        description,
        conditions: [mockCondition],
      });
      router.back();
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo chiến lược');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [
    styles.input,
    { color: colors.text, borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb' }
  ];

  return (
    <SafeView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.label}>Tên chiến lược</ThemedText>
        <TextInput
          style={inputStyle}
          value={name}
          onChangeText={setName}
          placeholder="VD: Chiến lược bắt đáy lô gan"
          placeholderTextColor={colors.icon}
        />

        <ThemedText style={styles.label}>Mô tả</ThemedText>
        <TextInput
          style={[inputStyle, { height: 100, textAlignVertical: 'top' }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Mô tả chi tiết chiến lược của bạn"
          placeholderTextColor={colors.icon}
          multiline
        />

        <ThemedText style={[styles.label, { color: colors.icon, marginTop: 16, fontSize: 14 }]}>
          * Các điều kiện mặc định sẽ được thêm vào (YAGNI).
        </ThemedText>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.tint, opacity: loading ? 0.7 : 1 }]}
          onPress={handleSave}
          disabled={loading}
        >
          <ThemedText style={styles.saveButtonText}>Lưu chiến lược</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  label: { marginBottom: 8, fontSize: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
