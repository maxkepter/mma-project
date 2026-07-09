import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeViewModal } from '@/components/safe-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { JournalService } from '@/services/journal.service';

export default function CreateBetScreen() {
  const [number, setNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();

  const handleSave = async () => {
    // Validate matching DTO on backend
    if (!number || number.length < 2 || number.length > 5) {
      Alert.alert('Lỗi', 'Số đánh phải từ 2 đến 5 chữ số');
      return;
    }

    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Lỗi', 'Số tiền không hợp lệ');
      return;
    }

    setLoading(true);
    try {
      await JournalService.createBet({
        number,
        amount: numAmount,
        betDate: new Date().toISOString(),
      });
      router.back();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeViewModal style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Nhập con số (VD: 68, 86)</ThemedText>
          <TextInput
            style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
            value={number}
            onChangeText={setNumber}
            keyboardType="numeric"
            maxLength={5}
            placeholder="Nhập 2-5 chữ số"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.label}>Số tiền (VNĐ)</ThemedText>
          <TextInput
            style={[styles.input, { color: Colors[colorScheme ?? 'light'].text }]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="10000"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => router.back()}
            disabled={loading}
          >
            <ThemedText style={styles.cancelButtonText}>Hủy</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.saveButtonText}>Ghi số</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ThemedView>
    </SafeViewModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '50%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f2f6',
  },
  cancelButtonText: {
    color: '#2f3640',
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
