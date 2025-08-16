import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { messagingService } from '@park-angel/shared/src/services/messaging';
import { 
  Message, 
  Conversation, 
  ConversationType, 
  MessageType 
} from '@park-angel/shared/src/models/message';
import { UserId } from '@park-angel/shared/src/models/value-objects';
import { useAuth } from '../../hooks/useAuth';

interface MessagingSystemProps {
  conversationId?: string;
  recipientId?: string;
  conversationType?: ConversationType;
  onClose?: () => void;
}

export const MessagingSystem: React.FC<MessagingSystemProps> = ({
  conversationId,
  recipientId,
  conversationType = ConversationType.USER_SUPPORT,
  onClose,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (user) {
      initializeConversation();
    }
  }, [conversationId, recipientId, user]);

  useEffect(() => {
    if (conversation) {
      loadMessages();
      subscribeToMessages();
    }
  }, [conversation]);

  const initializeConversation = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let conv: Conversation;

      if (conversationId) {
        // Load existing conversation
        const conversations = await messagingService.getUserConversations(new UserId(user.id));
        conv = conversations.find(c => c.id === conversationId)!;
      } else if (recipientId) {
        // Get or create conversation with recipient
        conv = await messagingService.getOrCreateConversation(
          new UserId(user.id),
          new UserId(recipientId),
          conversationType
        );
      } else {
        throw new Error('Either conversationId or recipientId must be provided');
      }

      setConversation(conv);
    } catch (error) {
      console.error('Error initializing conversation:', error);
      Alert.alert('Error', 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!conversation) return;

    try {
      const messageList = await messagingService.getMessages(conversation.id);
      setMessages(messageList.reverse()); // Reverse to show oldest first
      
      // Mark messages as read
      await messagingService.markConversationAsRead(
        conversation.id, 
        new UserId(user!.id)
      );
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!conversation) return;

    const subscription = messagingService.subscribeToConversation(
      conversation.id,
      (message: Message) => {
        setMessages(prev => [...prev, message]);
        
        // Auto-scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);

        // Mark as read if not sent by current user
        if (message.senderId.value !== user!.id) {
          messagingService.markMessageAsRead(message.id, new UserId(user!.id));
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || !user || sending) return;

    try {
      setSending(true);
      const recipientId = conversation.participants.find(p => p.value !== user.id);
      
      if (!recipientId) {
        throw new Error('No recipient found');
      }

      await messagingService.sendMessage({
        conversationId: conversation.id,
        senderId: new UserId(user.id),
        receiverId: recipientId,
        content: newMessage.trim(),
        type: MessageType.TEXT,
        isEncrypted: false,
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item: message }: { item: Message }) => {
    const isOwnMessage = message.senderId.value === user?.id;
    const isSystemMessage = message.type === MessageType.SYSTEM;

    if (isSystemMessage) {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{message.content}</Text>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {message.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {formatMessageTime(message.createdAt)}
          </Text>
        </View>
        {isOwnMessage && (
          <View style={styles.messageStatus}>
            <Ionicons
              name={message.isRead() ? 'checkmark-done' : 'checkmark'}
              size={12}
              color={message.isRead() ? '#7C3AED' : '#9CA3AF'}
            />
          </View>
        )}
      </View>
    );
  };

  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    
    if (now.toDateString() === messageDate.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#7C3AED" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {conversationType === ConversationType.USER_SUPPORT ? 'Support' : 'Chat'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {conversation?.isActive ? 'Active' : 'Archived'}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!newMessage.trim() || sending) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={(!newMessage.trim() || sending) ? '#9CA3AF' : '#FFFFFF'} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  moreButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: '#7C3AED',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#111827',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  ownMessageTime: {
    color: '#E5E7EB',
  },
  otherMessageTime: {
    color: '#9CA3AF',
  },
  messageStatus: {
    marginTop: 4,
    marginRight: 8,
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
});