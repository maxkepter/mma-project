import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  SafeAreaView,
} from 'react-native';
import { SafeView } from '@/components/safe-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { aiInsightApi, ChatConversation } from '@/services/ai-insight-api';
import { Stack } from 'expo-router';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  'Phân tích tần suất lô tô gần đây',
  'Gợi ý chiến lược chơi an toàn',
  'Đánh giá hiệu suất nhật ký cá cược',
  'Tóm tắt tin tức xổ số mới nhất',
];

export default function AIAssistantChatScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Xin chào! Tôi là Trợ lý AI phân tích xổ số. Tôi có thể giúp bạn phân tích thống kê, chiến lược, nhật ký cá cược và tin tức xổ số.\n\n*Lưu ý: Mọi phân tích chỉ mang tính chất tham khảo kỹ thuật, không khuyến khích cờ bạc.*',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  
  const [isHistoryVisible, setHistoryVisible] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await aiInsightApi.getConversations();
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await aiInsightApi.deleteConversation(id);
      // Remove from list
      setConversations(prev => prev.filter(c => c.id !== id));
      // If deleted the current conversation, reset chat
      if (conversationId === id) {
        startNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  };

  const startNewChat = () => {
    setConversationId(undefined);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Xin chào! Tôi là Trợ lý AI phân tích xổ số. Tôi có thể giúp bạn phân tích thống kê, chiến lược, nhật ký cá cược và tin tức xổ số.\n\n*Lưu ý: Mọi phân tích chỉ mang tính chất tham khảo kỹ thuật, không khuyến khích cờ bạc.*',
      },
    ]);
    setHistoryVisible(false);
  };

  const loadConversation = async (id: string) => {
    setHistoryVisible(false);
    setLoading(true);
    try {
      const res = await aiInsightApi.getConversationMessages(id);
      setConversationId(id);
      setMessages(res.data.map(m => ({ id: m.id, role: m.role, content: m.content })));
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      console.error('Failed to load conversation', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Scroll to bottom
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await aiInsightApi.chatAssistant({
        message: text,
        conversationId,
      });

      if (res.data.conversationId) {
        setConversationId(res.data.conversationId);
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.message,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Đã xảy ra lỗi khi kết nối với máy chủ AI. Vui lòng thử lại sau.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageRow,
          isUser ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
        ]}
      >
        <ThemedView
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: colors.tint }
              : { backgroundColor: colors.bubbleBackground },
          ]}
        >
          <ThemedText style={isUser ? { color: '#ffffff' } : { color: colors.text }}>
            {item.content}
          </ThemedText>
        </ThemedView>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'AI Assistant', 
          headerBackTitleVisible: false, 
          headerBackTitle: '',
          headerRight: () => (
            <TouchableOpacity onPress={() => { setHistoryVisible(true); loadHistory(); }}>
              <IconSymbol name="list.bullet" size={24} color={colors.tint} />
            </TouchableOpacity>
          )
        }} 
      />

      <Modal visible={isHistoryVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setHistoryVisible(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setHistoryVisible(false)}>
              <ThemedText style={{ color: colors.tint, fontSize: 16 }}>Đóng</ThemedText>
            </TouchableOpacity>
            <ThemedText type="defaultSemiBold" style={{ fontSize: 18 }}>Lịch sử trò chuyện</ThemedText>
            <TouchableOpacity onPress={startNewChat}>
              <ThemedText style={{ color: colors.tint, fontSize: 16, fontWeight: 'bold' }}>Tạo mới</ThemedText>
            </TouchableOpacity>
          </View>
          
          {loadingHistory ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.tint} />
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={[styles.historyItem, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}>
                  <TouchableOpacity 
                    style={{ flex: 1 }}
                    onPress={() => loadConversation(item.id)}
                  >
                    <ThemedText numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: 16, flexShrink: 1 }}>{item.title}</ThemedText>
                    <ThemedText style={{ fontSize: 12, color: colors.icon, marginTop: 4 }}>
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Mới đây'}
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteConversation(item.id)} style={{ padding: 8 }}>
                    <IconSymbol name="trash" size={20} color={colors.tint} />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <ThemedText style={{ textAlign: 'center', marginTop: 40, color: colors.icon }}>
                  Chưa có lịch sử trò chuyện nào.
                </ThemedText>
              }
            />
          )}
        </SafeAreaView>
      </Modal>

      <SafeView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Chat Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Quick Prompts */}
        {messages.length === 1 && (
          <View style={styles.quickPromptsContainer}>
            <ThemedText style={[styles.quickPromptTitle, { color: colors.icon }]}>
              Gợi ý câu hỏi:
            </ThemedText>
            <View style={styles.quickPromptsGrid}>
              {QUICK_PROMPTS.map((prompt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.quickPromptButton,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleSend(prompt)}
                >
                  <ThemedText style={[styles.quickPromptText, { color: colors.tint }]}>
                    {prompt}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input Bar */}
        <View
          style={[
            styles.inputContainer,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.bubbleBackground,
                borderColor: colors.border,
              },
            ]}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={colors.icon}
            value={input}
            onChangeText={setInput}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.tint }]}
            onPress={() => handleSend(input)}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <ThemedText style={styles.sendButtonText}>Gửi</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  quickPromptsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  quickPromptTitle: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  quickPromptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickPromptButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickPromptText: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 14,
  },
  sendButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  historyItem: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  }
});
