import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { messagingService } from '@park-angel/shared/src/services/messaging';
import { Conversation, ConversationType } from '@park-angel/shared/src/models/message';
import { UserId } from '@park-angel/shared/src/models/value-objects';
import { useAuth } from '../../hooks/useAuth';

interface ConversationsListProps {
  onConversationSelect: (conversation: Conversation) => void;
  onNewConversation: () => void;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  onConversationSelect,
  onNewConversation,
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadConversations();
      loadUnreadCount();
      subscribeToConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const conversationList = await messagingService.getUserConversations(new UserId(user.id));
      setConversations(conversationList);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!user) return;

    try {
      const count = await messagingService.getUnreadMessageCount(new UserId(user.id));
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const subscribeToConversations = () => {
    if (!user) return;

    const subscription = messagingService.subscribeToUserConversations(
      new UserId(user.id),
      (updatedConversation: Conversation) => {
        setConversations(prev => {
          const index = prev.findIndex(c => c.id === updatedConversation.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = updatedConversation;
            return updated.sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
          } else {
            return [updatedConversation, ...prev];
          }
        });
        
        // Update unread count
        loadUnreadCount();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadConversations(), loadUnreadCount()]);
    setRefreshing(false);
  };

  const archiveConversation = async (conversation: Conversation) => {
    if (!user) return;

    try {
      await messagingService.archiveConversation(conversation.id, new UserId(user.id));
      setConversations(prev => prev.filter(c => c.id !== conversation.id));
    } catch (error) {
      console.error('Error archiving conversation:', error);
      Alert.alert('Error', 'Failed to archive conversation');
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    switch (conversation.type) {
      case ConversationType.USER_SUPPORT:
        return 'Support';
      case ConversationType.USER_HOST:
        return 'Host Chat';
      case ConversationType.USER_OPERATOR:
        return 'Operator Chat';
      default:
        return 'Chat';
    }
  };

  const getConversationIcon = (conversation: Conversation) => {
    switch (conversation.type) {
      case ConversationType.USER_SUPPORT:
        return 'help-circle-outline';
      case ConversationType.USER_HOST:
        return 'home-outline';
      case ConversationType.USER_OPERATOR:
        return 'business-outline';
      default:
        return 'chatbubble-outline';
    }
  };

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderConversation = ({ item: conversation }: { item: Conversation }) => {
    const hasUnreadMessages = conversation.lastMessage && 
      !conversation.lastMessage.isRead() && 
      conversation.lastMessage.receiverId.value === user?.id;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => onConversationSelect(conversation)}
        onLongPress={() => {
          Alert.alert(
            'Conversation Options',
            'What would you like to do?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Archive', 
                style: 'destructive',
                onPress: () => archiveConversation(conversation)
              },
            ]
          );
        }}
      >
        <View style={styles.conversationIcon}>
          <Ionicons
            name={getConversationIcon(conversation) as any}
            size={24}
            color="#7C3AED"
          />
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationTitle}>
              {getConversationTitle(conversation)}
            </Text>
            {conversation.lastMessage && (
              <Text style={styles.conversationTime}>
                {formatLastMessageTime(conversation.lastMessage.createdAt)}
              </Text>
            )}
          </View>

          {conversation.lastMessage && (
            <View style={styles.lastMessageContainer}>
              <Text 
                style={[
                  styles.lastMessage,
                  hasUnreadMessages && styles.unreadMessage
                ]}
                numberOfLines={1}
              >
                {conversation.lastMessage.senderId.value === user?.id ? 'You: ' : ''}
                {conversation.lastMessage.getDisplayContent()}
              </Text>
              {hasUnreadMessages && (
                <View style={styles.unreadIndicator} />
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No conversations yet</Text>
      <Text style={styles.emptyStateText}>
        Start a conversation with a host or contact support
      </Text>
      <TouchableOpacity style={styles.newConversationButton} onPress={onNewConversation}>
        <Text style={styles.newConversationButtonText}>Start New Chat</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.newChatButton} onPress={onNewConversation}>
          <Ionicons name="add" size={24} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        style={styles.conversationsList}
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : undefined}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7C3AED']}
            tintColor="#7C3AED"
          />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  newChatButton: {
    padding: 8,
  },
  conversationsList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  conversationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  conversationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  unreadMessage: {
    color: '#111827',
    fontWeight: '500',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7C3AED',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  newConversationButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newConversationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});