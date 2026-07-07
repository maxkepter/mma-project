import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from './themed-text';

export type PickerOption<T extends string | number> = {
  value: T;
  label: string;
  hint?: string;
};

type PickerProps<T extends string | number> = {
  label: string;
  value: T | undefined;
  options: PickerOption<T>[];
  onChange: (v: T) => void;
  placeholder?: string;
  labelAccessory?: React.ReactNode;
};

/**
 * A friendly inline picker — tap to open a bottom-sheet style modal.
 * Uses native Modal (no extra deps) and matches the surrounding theme.
 */
export function Picker<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Chọn…',
  labelAccessory,
}: PickerProps<T>) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [open, setOpen] = useState(false);

  const current = options.find((o) => o.value === value);

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelContainer}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        {labelAccessory}
      </View>
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          {
            backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#f3f4f6',
            borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
          },
        ]}
      >
        <ThemedText
          style={{
            color: current ? colors.text : colors.icon,
            fontSize: 16,
          }}
        >
          {current ? current.label : placeholder}
        </ThemedText>
        <Text style={{ color: colors.icon, fontSize: 14 }}>▾</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[
              styles.sheet,
              { backgroundColor: colors.background },
            ]}
            onPress={() => {}}
          >
            <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
              {label}
            </ThemedText>
            <ScrollView style={{ maxHeight: 400 }}>
              {options.map((opt) => {
                const selected = opt.value === value;
                return (
                  <Pressable
                    key={String(opt.value)}
                    onPress={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    style={[
                      styles.option,
                      {
                        backgroundColor: selected
                          ? (colorScheme === 'dark' ? '#0e7490' : '#cffafe')
                          : 'transparent',
                        borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                      },
                    ]}
                  >
                    <ThemedText
                      style={{
                        fontSize: 16,
                        fontWeight: selected ? '600' : '400',
                      }}
                    >
                      {opt.label}
                    </ThemedText>
                    {opt.hint && (
                      <ThemedText style={{ color: colors.icon, fontSize: 13, marginTop: 2 }}>
                        {opt.hint}
                      </ThemedText>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: { fontSize: 14, fontWeight: '500' },
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
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
  option: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
});