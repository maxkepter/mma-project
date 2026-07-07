import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from './themed-text';
import {
  CONDITION_FIELDS,
  CONDITION_TYPE_DESCRIPTIONS,
  CONDITION_TYPE_LABELS,
  CONDITION_FIELD_DESCRIPTIONS,
  type ConditionType,
} from '@/services/strategy-api';

type Props = {
  type: ConditionType;
  visible: boolean;
  onClose: () => void;
};

export function ConditionInfoModal({ type, visible, onClose }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const typeLabel = CONDITION_TYPE_LABELS[type];
  const typeDescription = CONDITION_TYPE_DESCRIPTIONS[type];
  const fields = CONDITION_FIELDS[type] ?? [];
  const fieldDescriptions = CONDITION_FIELD_DESCRIPTIONS[type] ?? {};

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.background }]}
          onPress={() => {}}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="subtitle">{typeLabel}</ThemedText>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityLabel="Đóng"
            >
              <ThemedText style={{ color: colors.icon, fontSize: 18 }}>✕</ThemedText>
            </Pressable>
          </View>

          {/* Type description */}
          <ThemedText
            style={{ color: colors.text, fontSize: 14, lineHeight: 20, marginBottom: 16 }}
          >
            {typeDescription}
          </ThemedText>

          <View style={[styles.divider, { borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb' }]} />

          {/* Fields list */}
          <ThemedText style={{ fontWeight: '600', marginBottom: 10 }}>
            Trường dữ liệu
          </ThemedText>
          <ScrollView style={{ maxHeight: 300 }}>
            {fields.map((field) => (
              <View
                key={field.value}
                style={[
                  styles.fieldItem,
                  {
                    backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#f3f4f6',
                    borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                  },
                ]}
              >
                <ThemedText style={{ fontWeight: '600', fontSize: 14 }}>
                  {field.label}
                </ThemedText>
                <ThemedText
                  style={{ color: colors.icon, fontSize: 13, marginTop: 2, lineHeight: 18 }}
                >
                  {fieldDescriptions[field.value] ?? ''}
                </ThemedText>
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  divider: {
    borderTopWidth: 1,
    marginBottom: 14,
  },
  fieldItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
});
