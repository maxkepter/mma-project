import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeView } from '@/components/safe-view';
import { ThemedText } from '@/components/themed-text';
import { ConditionEditor } from '@/components/condition-editor';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  strategyApi,
  type Strategy,
  type BacktestRun,
  type StrategyCondition,
  CONDITION_TYPE_LABELS,
  OPERATOR_LABELS,
} from '@/services/strategy-api';

const MAX_NAME = 80;
const MAX_DESC = 500;
const MIN_DAYS = 1;
const MAX_DAYS = 99;
const DEFAULT_DAYS = 30;

const PRESET_DAYS = [7, 14, 30, 60, 90];

type Props = {
  visible: boolean;
  initialDays: number;
  onClose: () => void;
  onConfirm: (days: number) => void;
};

function DayPickerModal({ visible, initialDays, onClose, onConfirm }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [days, setDays] = useState(String(initialDays));

  useEffect(() => {
    if (visible) setDays(String(initialDays));
  }, [visible, initialDays]);

  const numeric = Number(days);
  const valid = !isNaN(numeric) && numeric >= MIN_DAYS && numeric <= MAX_DAYS;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.background }]}
          onPress={() => {}}
        >
          <ThemedText type="subtitle">Số ngày backtest</ThemedText>
          <ThemedText style={{ color: colors.icon, marginTop: 4, marginBottom: 16 }}>
            Từ {MIN_DAYS} đến {MAX_DAYS} ngày
          </ThemedText>

          <View style={styles.presetRow}>
            {PRESET_DAYS.map((d) => (
              <Pressable
                key={d}
                onPress={() => setDays(String(d))}
                style={[
                  styles.presetChip,
                  {
                    borderColor: colors.tint,
                    backgroundColor:
                      Number(days) === d ? colors.tint : 'transparent',
                  },
                ]}
              >
                <ThemedText
                  style={{
                    color: Number(days) === d ? 'white' : colors.tint,
                    fontWeight: '600',
                  }}
                >
                  {d} ngày
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={{ marginTop: 16 }}>
            <ThemedText style={styles.fieldLabel}>Hoặc nhập tuỳ chỉnh:</ThemedText>
            <TextInput
              style={[
                styles.dayInput,
                {
                  color: colors.text,
                  borderColor: valid
                    ? (colorScheme === 'dark' ? '#374151' : '#e5e7eb')
                    : '#ef4444',
                  backgroundColor: colorScheme === 'dark' ? '#111827' : '#fff',
                },
              ]}
              value={days}
              onChangeText={setDays}
              keyboardType="numeric"
              maxLength={3}
              placeholder={`${MIN_DAYS}-${MAX_DAYS}`}
              placeholderTextColor={colors.icon}
            />
            {!valid && (
              <ThemedText style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>
                Vui lòng nhập số từ {MIN_DAYS} đến {MAX_DAYS}
              </ThemedText>
            )}
          </View>

          <View style={styles.sheetActions}>
            <Pressable
              style={[styles.sheetBtn, { backgroundColor: colors.icon }]}
              onPress={onClose}
            >
              <ThemedText style={styles.actionText}>Hủy</ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.sheetBtn,
                {
                  backgroundColor: valid ? colors.tint : colors.icon,
                  marginLeft: 12,
                  opacity: valid ? 1 : 0.5,
                },
              ]}
              disabled={!valid}
              onPress={() => valid && onConfirm(numeric)}
            >
              <ThemedText style={styles.actionText}>Chạy</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function StrategyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backtesting, setBacktesting] = useState(false);
  const [latestRun, setLatestRun] = useState<BacktestRun | null>(null);

  // Day picker
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number>(DEFAULT_DAYS);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editConditions, setEditConditions] = useState<StrategyCondition[]>([]);

  const fetchStrategy = useCallback(async () => {
    try {
      const res = await strategyApi.getById(id as string);
      setStrategy(res.data);
      setEditName(res.data.name);
      setEditDesc(res.data.description || '');
      setEditConditions(res.data.conditions || []);
    } catch {
      Alert.alert('Lỗi', 'Không thể tải chiến lược');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchStrategy();
  }, [fetchStrategy]);

  const handleDelete = () => {
    Alert.alert('Xóa chiến lược', 'Bạn có chắc chắn muốn xóa chiến lược này?', [
      { text: 'Hủy' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await strategyApi.delete(id as string);
            router.back();
          } catch {
            Alert.alert('Lỗi', 'Xóa chiến lược thất bại');
          }
        },
      },
    ]);
  };

  const handleRunWithDays = async (days: number) => {
    setPickerOpen(false);
    setBacktesting(true);
    try {
      const res = await strategyApi.runBacktest(id as string, { days });
      setLatestRun(res.data);
    } catch {
      Alert.alert('Lỗi', 'Chạy backtest thất bại');
    } finally {
      setBacktesting(false);
    }
  };

  const handleSaveRun = async (run: BacktestRun) => {
    try {
      const res = await strategyApi.saveBacktestRun(id as string, run.id, {
        saved: !run.saved,
      });
      // Update both latestRun and the saved list inside strategy
      setLatestRun(res.data);
      if (strategy) {
        setStrategy({
          ...strategy,
          backtestRuns: (strategy.backtestRuns ?? []).map((r) =>
            r.id === res.data.id ? res.data : r,
          ),
        });
      }
    } catch {
      Alert.alert('Lỗi', 'Lưu kết quả thất bại');
    }
  };

  const handleUpdate = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      Alert.alert('Thiếu tên', 'Tên chiến lược không được để trống.');
      return;
    }
    if (editConditions.length === 0) {
      Alert.alert('Thiếu điều kiện', 'Chiến lược phải có ít nhất một điều kiện.');
      return;
    }

    setSaving(true);
    try {
      const res = await strategyApi.update(id as string, {
        name: trimmedName,
        description: editDesc.trim() || undefined,
        conditions: editConditions,
      });
      setStrategy(res.data);
      setIsEditing(false);
    } catch {
      Alert.alert('Lỗi', 'Cập nhật chiến lược thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const addCondition = () => {
    setEditConditions((prev) => [
      ...prev,
      {
        type: 'frequency',
        field: 'count',
        operator: 'gte',
        value: 5,
        logic: prev.length > 0 ? 'AND' : undefined,
      },
    ]);
  };

  const updateCondition = (idx: number, c: StrategyCondition) => {
    setEditConditions((prev) => prev.map((p, i) => (i === idx ? c : p)));
  };

  const removeCondition = (idx: number) => {
    setEditConditions((prev) =>
      prev.filter((_, i) => i !== idx).map((c, i) => (i === 0 ? { ...c, logic: undefined } : c)),
    );
  };

  if (loading || !strategy) {
    return (
      <SafeView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.tint} />
      </SafeView>
    );
  }

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#f9fafb',
      borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
    },
  ];

  const inputStyle = [
    styles.input,
    {
      color: colors.text,
      borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
      backgroundColor: colorScheme === 'dark' ? '#111827' : '#fff',
    },
  ];

  const savedRuns = (strategy.backtestRuns ?? []).filter((r) => r.saved);

  return (
    <SafeView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {isEditing ? (
            // Edit Mode UI
            <View>
              <ThemedText style={styles.label}>Tên chiến lược</ThemedText>
              <TextInput
                style={inputStyle}
                value={editName}
                onChangeText={(t) => setEditName(t.slice(0, MAX_NAME))}
                maxLength={MAX_NAME}
              />

              <ThemedText style={styles.label}>Mô tả</ThemedText>
              <TextInput
                style={[
                  inputStyle,
                  { height: 90, textAlignVertical: 'top' },
                ]}
                value={editDesc}
                onChangeText={(t) => setEditDesc(t.slice(0, MAX_DESC))}
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

              {editConditions.length === 0 ? (
                <View
                  style={[
                    styles.empty,
                    { borderColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb' },
                  ]}
                >
                  <ThemedText style={{ color: colors.icon, textAlign: 'center' }}>
                    Chưa có điều kiện nào. Nhấn &ldquo;Thêm điều kiện&rdquo; để bắt đầu.
                  </ThemedText>
                </View>
              ) : (
                editConditions.map((c, i) => (
                  <ConditionEditor
                    key={i}
                    index={i}
                    total={editConditions.length}
                    condition={c}
                    onChange={(next) => updateCondition(i, next)}
                    onRemove={() => removeCondition(i)}
                  />
                ))
              )}

              <View style={styles.editActions}>
                <Pressable
                  style={[styles.actionBtn, { flex: 1, backgroundColor: colors.icon }]}
                  onPress={() => {
                    setIsEditing(false);
                    setEditName(strategy.name);
                    setEditDesc(strategy.description || '');
                    setEditConditions(strategy.conditions || []);
                  }}
                  disabled={saving}
                >
                  <ThemedText style={styles.actionText}>Hủy</ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.actionBtn,
                    { flex: 1, backgroundColor: colors.tint, marginLeft: 12 },
                  ]}
                  onPress={handleUpdate}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <ThemedText style={styles.actionText}>Lưu</ThemedText>
                  )}
                </Pressable>
              </View>
            </View>
          ) : (
            // View Mode UI
            <View>
              <View style={cardStyle}>
                <View style={styles.row}>
                  <ThemedText type="subtitle" style={{ flex: 1, marginRight: 8 }}>
                    {strategy.name}
                  </ThemedText>
                  <Pressable
                    onPress={() => setIsEditing(true)}
                    style={[
                      styles.editBtn,
                      {
                        backgroundColor: colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                      },
                    ]}
                  >
                    <ThemedText style={{ fontSize: 13, fontWeight: '600' }}>
                      Sửa
                    </ThemedText>
                  </Pressable>
                </View>
                <ThemedText style={{ color: colors.icon, marginVertical: 12 }}>
                  {strategy.description || 'Không có mô tả'}
                </ThemedText>

                <ThemedText type="defaultSemiBold" style={{ marginBottom: 8 }}>
                  Điều kiện ({strategy.conditions?.length || 0}):
                </ThemedText>
                {strategy.conditions?.map((c, i) => {
                  const typeLabel = CONDITION_TYPE_LABELS[c.type] || c.type;
                  const opLabel = c.operator ? OPERATOR_LABELS[c.operator] || c.operator : '';
                  const valString = Array.isArray(c.value)
                    ? `[${(c.value as number[]).join(', ')}]`
                    : String(c.value ?? '');
                  const logicLabel = c.logic ? `${c.logic} ` : '';

                  return (
                    <View
                      key={i}
                      style={[
                        styles.conditionRow,
                        {
                          backgroundColor:
                            colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                        },
                      ]}
                    >
                      <ThemedText style={{ fontWeight: '500' }}>
                        {logicLabel}#{i + 1}: {typeLabel}
                      </ThemedText>
                      {c.field && (
                        <ThemedText style={{ fontSize: 14, marginTop: 2, opacity: 0.8 }}>
                          Trường: {c.field} {opLabel} {valString}
                        </ThemedText>
                      )}
                      {c.parameters && (
                        <ThemedText style={{ fontSize: 13, marginTop: 2, opacity: 0.6 }}>
                          Tham số (cũ): {JSON.stringify(c.parameters)}
                        </ThemedText>
                      )}
                    </View>
                  );
                })}
              </View>

              <Pressable
                style={[
                  styles.actionBtn,
                  { backgroundColor: colors.tint, opacity: backtesting ? 0.7 : 1 },
                ]}
                onPress={() => setPickerOpen(true)}
                disabled={backtesting}
              >
                {backtesting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <ThemedText style={styles.actionText}>
                    Chạy Backtest ({selectedDays} ngày)
                  </ThemedText>
                )}
              </Pressable>

              <Pressable
                style={[styles.actionBtn, { backgroundColor: 'transparent', marginTop: 8 }]}
                onPress={() => setPickerOpen(true)}
              >
                <ThemedText style={{ color: colors.tint, fontWeight: '600' }}>
                  Thay đổi số ngày
                </ThemedText>
              </Pressable>

              {latestRun && (
                <View style={[cardStyle, { marginTop: 24 }]}>
                  <ThemedText type="subtitle" style={{ marginBottom: 4 }}>
                    Kết quả Backtest mới nhất
                  </ThemedText>
                  <ThemedText style={{ color: colors.icon, fontSize: 12, marginBottom: 12 }}>
                    {new Date(latestRun.startDate).toLocaleDateString('vi-VN')} →{' '}
                    {new Date(latestRun.endDate).toLocaleDateString('vi-VN')}
                  </ThemedText>
                  <View style={styles.statRow}>
                    <ThemedText>Tổng số đánh:</ThemedText>
                    <ThemedText>{latestRun.result.totalBets}</ThemedText>
                  </View>
                  <View style={styles.statRow}>
                    <ThemedText>Số trận thắng:</ThemedText>
                    <ThemedText>{latestRun.result.wonBets}</ThemedText>
                  </View>
                  <View style={styles.statRow}>
                    <ThemedText>Tỉ lệ thắng:</ThemedText>
                    <ThemedText>{latestRun.winRate.toFixed(1)}%</ThemedText>
                  </View>
                  <View style={styles.statRow}>
                    <ThemedText>Lợi nhuận:</ThemedText>
                    <ThemedText
                      style={{
                        color: latestRun.profit >= 0 ? '#10b981' : '#ef4444',
                        fontWeight: 'bold',
                      }}
                    >
                      {latestRun.profit.toLocaleString()} điểm
                    </ThemedText>
                  </View>

                  <Pressable
                    onPress={() => handleSaveRun(latestRun)}
                    style={[
                      styles.saveBadge,
                      {
                        backgroundColor: latestRun.saved ? '#10b981' : 'transparent',
                        borderColor: latestRun.saved ? '#10b981' : colors.tint,
                      },
                    ]}
                  >
                    <ThemedText
                      style={{
                        color: latestRun.saved ? 'white' : colors.tint,
                        fontWeight: '600',
                      }}
                    >
                      {latestRun.saved ? '✓ Đã lưu' : '+ Lưu kết quả'}
                    </ThemedText>
                  </Pressable>
                </View>
              )}

              {savedRuns.length > 0 && (
                <View style={{ marginTop: 32 }}>
                  <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
                    Kết quả đã lưu ({savedRuns.length})
                  </ThemedText>
                  {savedRuns.map((run) => (
                    <View
                      key={run.id}
                      style={[
                        styles.historyCard,
                        {
                          backgroundColor:
                            colorScheme === 'dark' ? '#1f2937' : '#f9fafb',
                          borderColor:
                            colorScheme === 'dark' ? '#374151' : '#e5e7eb',
                        },
                      ]}
                    >
                      <View style={styles.historyHeader}>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={{ fontWeight: '600' }}>
                            {run.name || 'Backtest'}
                          </ThemedText>
                          <ThemedText
                            style={{ color: colors.icon, fontSize: 12, marginTop: 2 }}
                          >
                            {new Date(run.startDate).toLocaleDateString('vi-VN')} →{' '}
                            {new Date(run.endDate).toLocaleDateString('vi-VN')}
                          </ThemedText>
                        </View>
                        <Pressable
                          onPress={() => handleSaveRun(run)}
                          hitSlop={8}
                        >
                          <ThemedText
                            style={{ color: '#ef4444', fontSize: 13, fontWeight: '600' }}
                          >
                            Bỏ lưu
                          </ThemedText>
                        </Pressable>
                      </View>
                      <View style={[styles.statRow, { marginTop: 8 }]}>
                        <ThemedText style={{ fontSize: 13 }}>Tỉ lệ thắng:</ThemedText>
                        <ThemedText style={{ fontSize: 13 }}>
                          {run.winRate.toFixed(1)}%
                        </ThemedText>
                      </View>
                      <View style={styles.statRow}>
                        <ThemedText style={{ fontSize: 13 }}>Lợi nhuận:</ThemedText>
                        <ThemedText
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: run.profit >= 0 ? '#10b981' : '#ef4444',
                          }}
                        >
                          {run.profit.toLocaleString()} điểm
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <Pressable
                style={[styles.actionBtn, { backgroundColor: '#ef4444', marginTop: 40 }]}
                onPress={handleDelete}
              >
                <ThemedText style={styles.actionText}>Xóa chiến lược</ThemedText>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <DayPickerModal
        visible={pickerOpen}
        initialDays={selectedDays}
        onClose={() => setPickerOpen(false)}
        onConfirm={(d) => {
          setSelectedDays(d);
          handleRunWithDays(d);
        }}
      />
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 60 },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: { marginBottom: 6, marginTop: 12, fontSize: 16, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
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
  editActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
  actionBtn: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  conditionRow: {
    marginTop: 8,
    padding: 10,
    borderRadius: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  saveBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  historyCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  // Day picker modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  fieldLabel: { marginBottom: 6, fontWeight: '500' },
  dayInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  sheetActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
  sheetBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
});