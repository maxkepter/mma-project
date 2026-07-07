import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Picker } from './picker';
import { ConditionInfoModal } from './condition-info-modal';
import { ThemedText } from './themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  CONDITION_FIELDS,
  CONDITION_TYPE_LABELS,
  OPERATOR_LABELS,
  type ConditionOperator,
  type ConditionType,
  type StrategyCondition,
} from '@/services/strategy-api';

const TYPE_OPTIONS = (Object.keys(CONDITION_TYPE_LABELS) as ConditionType[]).map(
  (v) => ({ value: v, label: CONDITION_TYPE_LABELS[v] }),
);

const OPERATOR_OPTIONS = (Object.keys(OPERATOR_LABELS) as ConditionOperator[]).map(
  (v) => ({ value: v, label: OPERATOR_LABELS[v] }),
);

type Props = {
  condition: StrategyCondition;
  index: number;
  total: number;
  onChange: (c: StrategyCondition) => void;
  onRemove: () => void;
};

/**
 * One editable strategy condition row.
 * Auto-fills sensible defaults when type/field change so the user never
 * lands on a half-typed state.
 */
export function ConditionEditor({
  condition,
  index,
  total,
  onChange,
  onRemove,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [infoOpen, setInfoOpen] = useState(false);

  const fieldOptions =
    CONDITION_FIELDS[condition.type] ?? [];

  const handleType = (type: ConditionType) => {
    const fields = CONDITION_FIELDS[type] ?? [];
    const firstField = fields[0]?.value;
    onChange({
      ...condition,
      type,
      field: firstField,
      operator: condition.operator ?? 'gte',
      value: condition.value ?? '',
      // Drop field/operator if incompatible
      parameters: undefined,
    });
  };

  const handleField = (field: string) => {
    onChange({ ...condition, field });
  };

  const handleOperator = (op: ConditionOperator) => {
    onChange({ ...condition, operator: op });
  };

  const handleValue = (raw: string) => {
    if (condition.operator === 'in' || condition.operator === 'between') {
      const numbers = raw
        .split(/[,;\s]+/)
        .map((s) => Number(s))
        .filter((n) => !Number.isNaN(n));
      onChange({ ...condition, value: numbers });
    } else {
      const num = Number(raw);
      onChange({
        ...condition,
        value: Number.isNaN(num) ? raw : num,
      });
    }
  };

  const handleLogic = (logic: 'AND' | 'OR') => {
    onChange({ ...condition, logic });
  };

  const valueText =
    Array.isArray(condition.value)
      ? (condition.value as number[]).join(', ')
      : condition.value !== undefined && condition.value !== null
        ? String(condition.value)
        : '';

  const isMulti = condition.operator === 'in' || condition.operator === 'between';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#f9fafb',
          borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
        },
      ]}
    >
      <View style={styles.header}>
        <ThemedText type="defaultSemiBold" style={{ fontSize: 15 }}>
          Điều kiện #{index + 1}
        </ThemedText>
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          accessibilityLabel="Xóa điều kiện"
        >
          <ThemedText style={{ color: '#ef4444', fontSize: 14, fontWeight: '600' }}>
            Xóa
          </ThemedText>
        </Pressable>
      </View>

      {index > 0 && (
        <View style={styles.logicRow}>
          <Pressable
            onPress={() => handleLogic('AND')}
            style={[
              styles.logicChip,
              {
                backgroundColor:
                  condition.logic !== 'OR' ? colors.tint : 'transparent',
                borderColor: colors.tint,
              },
            ]}
          >
            <ThemedText
              style={{
                color: condition.logic !== 'OR' ? 'white' : colors.tint,
                fontSize: 13,
                fontWeight: '600',
              }}
            >
              VÀ
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => handleLogic('OR')}
            style={[
              styles.logicChip,
              {
                backgroundColor:
                  condition.logic === 'OR' ? colors.tint : 'transparent',
                borderColor: colors.tint,
              },
            ]}
          >
            <ThemedText
              style={{
                color: condition.logic === 'OR' ? 'white' : colors.tint,
                fontSize: 13,
                fontWeight: '600',
              }}
            >
              HOẶC
            </ThemedText>
          </Pressable>
          <ThemedText style={{ color: colors.icon, fontSize: 12, marginLeft: 8 }}>
            kết hợp với điều kiện trước
          </ThemedText>
        </View>
      )}

      <Picker
        label="Loại thống kê"
        value={condition.type}
        options={TYPE_OPTIONS}
        onChange={handleType}
        labelAccessory={
          <Pressable
            onPress={() => setInfoOpen(true)}
            hitSlop={6}
            accessibilityLabel="Giải thích loại thống kê"
          >
            <View
              style={[
                styles.infoButton,
                { backgroundColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb' },
              ]}
            >
              <ThemedText style={{ color: colors.tint, fontSize: 13, fontWeight: '700' }}>
                ?
              </ThemedText>
            </View>
          </Pressable>
        }
      />

      <ConditionInfoModal
        type={condition.type}
        visible={infoOpen}
        onClose={() => setInfoOpen(false)}
      />

      <Picker
        label="Trường dữ liệu"
        value={condition.field as any}
        options={fieldOptions}
        onChange={handleField}
        placeholder="Chọn trường…"
      />

      <Picker
        label="Phép so sánh"
        value={condition.operator}
        options={OPERATOR_OPTIONS}
        onChange={handleOperator}
      />

      <View style={{ marginBottom: 4 }}>
        <ThemedText style={styles.valueLabel}>
          {isMulti ? 'Giá trị (phân tách bằng dấu phẩy)' : 'Giá trị'}
        </ThemedText>
        <TextInput
          style={[
            styles.valueInput,
            {
              color: colors.text,
              borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
              backgroundColor: colorScheme === 'dark' ? '#111827' : '#fff',
            },
          ]}
          value={valueText}
          onChangeText={handleValue}
          placeholder={isMulti ? 'VD: 3, 5, 7 hoặc 10-20' : 'VD: 5'}
          placeholderTextColor={colors.icon}
          keyboardType={isMulti ? 'default' : 'numeric'}
        />
        {total === 0 && (
          <ThemedText style={{ color: colors.icon, fontSize: 12, marginTop: 6 }}>
            Mẹo: thêm ít nhất một điều kiện để chiến lược có ý nghĩa.
          </ThemedText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  logicChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 999,
    marginRight: 8,
  },
  valueLabel: { fontSize: 14, marginBottom: 6, fontWeight: '500' },
  valueInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  infoButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});