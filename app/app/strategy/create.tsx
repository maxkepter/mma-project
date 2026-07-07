import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeView } from '@/components/safe-view';
import { ThemedText } from '@/components/themed-text';
import { ConditionEditor } from '@/components/condition-editor';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { strategyApi, type StrategyCondition } from '@/services/strategy-api';

const MAX_NAME = 80;
const MAX_DESC = 500;

const emptyCondition = (): StrategyCondition => ({
  type: 'frequency',
  field: 'count',
  operator: 'gte',
  value: 5,
});

export default function CreateStrategyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [conditions, setConditions] = useState<StrategyCondition[]>([]);
  const [loading, setLoading] = useState(false);

  const updateCondition = (idx: number, c: StrategyCondition) => {
    setConditions((prev) => prev.map((p, i) => (i === idx ? c : p)));
  };

  const removeCondition = (idx: number) => {
    setConditions((prev) =>
      prev
        .filter((_, i) => i !== idx)
        // Reset logic so first remaining condition has no AND/OR badge
        .map((c, i) => (i === 0 ? { ...c, logic: undefined } : c)),
    );
  };

  const addCondition = () => {
    setConditions((prev) => [
      ...prev,
      {
        ...emptyCondition(),
        logic: prev.length > 0 ? 'AND' : undefined,
      },
    ]);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Thiếu tên', 'Vui lòng nhập tên chiến lược.');
      return;
    }
    if (conditions.length === 0) {
      Alert.alert(
        'Chưa có điều kiện',
        'Thêm ít nhất một điều kiện trước khi lưu.',
      );
      return;
    }

    setLoading(true);
    try {
      await strategyApi.create({
        name: trimmedName,
        description: description.trim() || undefined,
        conditions,
      });
      router.back();
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo chiến lược. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [
    styles.input,
    {
      color: colors.text,
      borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
      backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#fff',
    },
  ];

  return (
    <SafeView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText style={styles.label}>
            Tên chiến lược <ThemedText style={{ color: '#ef4444' }}>*</ThemedText>
          </ThemedText>
          <TextInput
            style={inputStyle}
            value={name}
            onChangeText={(t) => setName(t.slice(0, MAX_NAME))}
            placeholder="VD: Chiến lược bắt đáy lô gan"
            placeholderTextColor={colors.icon}
            maxLength={MAX_NAME}
          />
          <ThemedText style={styles.helper}>
            {name.length}/{MAX_NAME} ký tự
          </ThemedText>

          <ThemedText style={styles.label}>Mô tả</ThemedText>
          <TextInput
            style={[
              inputStyle,
              { height: 90, textAlignVertical: 'top' },
            ]}
            value={description}
            onChangeText={(t) => setDescription(t.slice(0, MAX_DESC))}
            placeholder="Mô tả chi tiết chiến lược (tuỳ chọn)"
            placeholderTextColor={colors.icon}
            multiline
            maxLength={MAX_DESC}
          />

          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Điều kiện</ThemedText>
            <Pressable
              onPress={addCondition}
              style={[styles.addBtn, { borderColor: colors.tint }]}
            >
              <ThemedText style={{ color: colors.tint, fontWeight: '600' }}>
                + Thêm điều kiện
              </ThemedText>
            </Pressable>
          </View>

          {conditions.length === 0 ? (
            <View
              style={[
                styles.empty,
                {
                  borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                },
              ]}
            >
              <ThemedText style={{ color: colors.icon, textAlign: 'center' }}>
                Chưa có điều kiện nào.{'\n'}
                Nhấn &ldquo;Thêm điều kiện&rdquo; để bắt đầu.
              </ThemedText>
            </View>
          ) : (
            conditions.map((c, i) => (
              <ConditionEditor
                key={i}
                index={i}
                total={conditions.length}
                condition={c}
                onChange={(next) => updateCondition(i, next)}
                onRemove={() => removeCondition(i)}
              />
            ))
          )}

          <Pressable
            style={[
              styles.saveButton,
              { backgroundColor: colors.tint, opacity: loading ? 0.7 : 1 },
            ]}
            onPress={handleSave}
            disabled={loading}
          >
            <ThemedText style={styles.saveButtonText}>
              {loading ? 'Đang lưu…' : 'Lưu chiến lược'}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 60 },
  label: { marginBottom: 6, marginTop: 12, fontSize: 16, fontWeight: '500' },
  helper: { fontSize: 12, opacity: 0.6, marginTop: 4, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 8,
  },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  },
  saveButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 28,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});