import { supabase, validateQueryResult, safeAccess, isValidDatabaseResult } from '../lib/supabase';
import { 
  Message, 
  Conversation, 
  CreateMessageData,
  CreateConversationData,
  MessageEncryption
} from '../models/message';
import { MessageType, ConversationType, MessageStatus, MESSAGE_STATUS } from '../types/common';
import { UserId } from '../models/value-objects';

export class MessagingService {
  /**
   * Create a new conversation between participants
   */
  async createConversation(data: CreateConversationData): Promise<Conversation> {
    try {
      const conversation = Conversation.create(data);
      
      const { data: conversationData, error } = await supabase
        .from('conversations')
        .insert({
          participants: conversation.participants.map(p => p.value),
          type: (conversation.type === 'user_host' || conversation.type === 'user_operator' || conversation.type === 'user_support') 
            ? conversation.type 
            : 'user_support',
          is_active: conversation.isActive,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create conversation: ${error.message}`);
      }

      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Get or create a conversation between two users
   */
  async getOrCreateConversation(
    userId1: UserId, 
    userId2: UserId, 
    type: ConversationType
  ): Promise<Conversation> {
    try {
      // First, try to find existing conversation
      const { data: existingConversations, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('type', (type === 'user_host' || type === 'user_operator' || type === 'user_support') ? type : 'user_support')
        .contains('participants', [userId1.value, userId2.value]);

      if (searchError) {
        throw new Error(`Failed to search conversations: ${searchError.message}`);
      }

      // Find conversation with exactly these two participants
      const existingConversation = existingConversations?.find(conv => 
        conv.participants.length === 2 &&
        conv.participants.includes(userId1.value) &&
        conv.participants.includes(userId2.value)
      );

      if (existingConversation) {
        return this.mapToConversation(existingConversation);
      }

      // Create new conversation if none exists
      return await this.createConversation({
        participants: [userId1, userId2],
        type,
        metadata: {}
      });
    } catch (error) {
      console.error('Error getting or creating conversation:', error);
      throw error;
    }
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(data: CreateMessageData): Promise<Message> {
    try {
      const message = Message.create(data);
      
      // Encrypt content if required
      let content = message.content;
      if (message.isEncrypted) {
        content = MessageEncryption.encrypt(content);
      }

      const { data: messageData, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: message.conversationId,
          sender_id: message.senderId.value,
          receiver_id: message.receiverId.value,
          content: content,
          type: (message.type === 'text' || message.type === 'file') ? message.type : 'text',
          is_encrypted: message.isEncrypted,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to send message: ${error.message}`);
      }

      // Update conversation's last message and updated_at
      await this.updateConversationLastMessage(message.conversationId, message);

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation with pagination
   */
  async getMessages(
    conversationId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<Message[]> {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to get messages: ${error.message}`);
      }

      return messagesData?.map(msg => this.mapToMessage(msg)) || [];
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  /**
   * Get conversations for a user
   */
  async getUserConversations(userId: UserId): Promise<Conversation[]> {
    try {
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select(`
          *,
          last_message:messages(*)
        `)
        .contains('participants', [userId.value])
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get conversations: ${error.message}`);
      }

      return conversationsData?.map(conv => this.mapToConversation(conv)) || [];
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string, userId: UserId): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          read_at: new Date().toISOString() 
        })
        .eq('id', messageId)
        .eq('receiver_id', userId.value);

      if (error) {
        throw new Error(`Failed to mark message as read: ${error.message}`);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  /**
   * Mark all messages in conversation as read
   */
  async markConversationAsRead(conversationId: string, userId: UserId): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          read_at: new Date().toISOString() 
        })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId.value)
        .is('read_at', null);

      if (error) {
        throw new Error(`Failed to mark conversation as read: ${error.message}`);
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  }

  /**
   * Get unread message count for user
   */
  async getUnreadMessageCount(userId: UserId): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId.value)
        .is('read_at', null);

      if (error) {
        throw new Error(`Failed to get unread count: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      throw error;
    }
  }

  /**
   * Search messages by content
   */
  async searchMessages(
    userId: UserId, 
    query: string, 
    limit: number = 20
  ): Promise<Message[]> {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          conversation:conversations(*)
        `)
        .or(`sender_id.eq.${userId.value},receiver_id.eq.${userId.value}`)
        .ilike('content', `%${query}%`)
        .eq('is_encrypted', false) // Only search non-encrypted messages
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to search messages: ${error.message}`);
      }

      return messagesData?.map(msg => this.mapToMessage(msg)) || [];
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string, userId: UserId): Promise<void> {
    try {
      // First verify the user owns the message
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch message: ${fetchError.message}`);
      }

      if (message.sender_id !== userId.value) {
        throw new Error('Unauthorized: Cannot delete message from another user');
      }

      // Soft delete by updating content
      const { error } = await supabase
        .from('messages')
        .update({ 
          content: '[Message deleted]',
          type: 'text'
        })
        .eq('id', messageId);

      if (error) {
        throw new Error(`Failed to delete message: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: string, userId: UserId): Promise<void> {
    try {
      // Verify user is participant
      const { data: conversation, error: fetchError } = await supabase
        .from('conversations')
        .select('participants')
        .eq('id', conversationId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch conversation: ${fetchError.message}`);
      }

      if (!conversation.participants.includes(userId.value)) {
        throw new Error('Unauthorized: User is not a participant in this conversation');
      }

      const { error } = await supabase
        .from('conversations')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        throw new Error(`Failed to archive conversation: ${error.message}`);
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time messages for a conversation
   */
  subscribeToConversation(
    conversationId: string, 
    onMessage: (message: Message) => void
  ) {
    return supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const message = this.mapToMessage(payload.new);
          onMessage(message);
        }
      )
      .subscribe();
  }

  /**
   * Subscribe to real-time conversations for a user
   */
  subscribeToUserConversations(
    userId: UserId, 
    onConversationUpdate: (conversation: Conversation) => void
  ) {
    return supabase
      .channel(`user_conversations:${userId.value}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participants.cs.{${userId.value}}`
        },
        (payload) => {
          const conversation = this.mapToConversation(payload.new);
          onConversationUpdate(conversation);
        }
      )
      .subscribe();
  }

  /**
   * Update conversation's last message
   */
  private async updateConversationLastMessage(
    conversationId: string, 
    message: Message
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        throw new Error(`Failed to update conversation: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating conversation last message:', error);
      throw error;
    }
  }

  /**
   * Map database row to Message model
   */
  private mapToMessage(data: any): Message {
    let content = data.content;
    
    // Decrypt content if encrypted
    if (data.is_encrypted) {
      try {
        content = MessageEncryption.decrypt(content);
      } catch (error) {
        console.error('Failed to decrypt message:', error);
        content = '[Encrypted message]';
      }
    }

    return new Message(
      data.id,
      data.conversation_id,
      new UserId(data.sender_id),
      new UserId(data.receiver_id),
      content,
      data.type as MessageType,
      data.is_encrypted,
      data.read_at ? MESSAGE_STATUS.READ : MESSAGE_STATUS.SENT,
      new Date(data.created_at),
      data.read_at ? new Date(data.read_at) : undefined
    );
  }

  /**
   * Map database row to Conversation model
   */
  private mapToConversation(data: any): Conversation {
    const participants = data.participants.map((id: string) => new UserId(id));
    
    const conversation = new Conversation(
      data.id,
      participants,
      data.type as ConversationType,
      data.last_message ? this.mapToMessage(data.last_message) : undefined,
      data.is_active,
      new Date(data.created_at),
      new Date(data.updated_at)
    );

    return conversation;
  }
}

export const messagingService = new MessagingService();