import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { 
  HostGuestConversation, 
  HostGuestMessage 
} from '@park-angel/shared/types';

interface HostMessagingProps {
  hostId: string;
  conversations: HostGuestConversation[];
  onSendMessage: (conversationId: string, content: string) => Promise<void>;
  onMarkAsRead: (conversationId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export default function HostMessaging({
  hostId,
  conversations,
  onSendMessage,
  onMarkAsRead,
  onRefresh,
}: HostMessagingProps) {
  const router = useRouter();
  const [selectedConversation, setSelectedConversation] = useState<HostGuestConversation | null>(null);
  const [messages, setMessages] = useState<HostGuestMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      onMarkAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      // This would call the hosted parking service to get messages
      // For now, using mock data
      const mockMessages: HostGuestMessage[] = [
        {
          id: '1',
          conversationId,
          senderId: selectedConversation?.guestId || '',
          receiverId: hostId,
          content: 'Hi! I have a booking for tomorrow. What time can I arrive?',
          type: 'text',
          createdAt: new Date(Date.now() - 3600000),
        },
        {
          id: '2',
          conversationId,
          senderId: hostId,
          receiverId: selectedConversation?.guestId || '',
          content: 'Hello! You can arrive anytime after 8 AM. The access code is 1234.',
          type: 'text',
          createdAt: new Date(Date.now() - 1800000),
        },
      ];
      setMessages(mockMessages);
    } catch (error) {
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      await onSendMessage(selectedConversation.id, newMessage.trim());
      
      // Add message to local state immediately for better UX
      const newMsg: HostGuestMessage = {
        id: Date.now().toString(),
        conversationId: selectedConversation.id,
        senderId: hostId,
        receiverId: selectedConversation.guestId,
        content: newMessage.trim(),
        type: 'text',
        createdAt: new Date(),
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
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

  const renderConversationItem = ({ item: conversation }: { item: HostGuestConversation }) => (
    <TouchableOpacity
      className={`p-4 border-b border-gray-200 ${
        selectedConversation?.id === conversation.id ? 'bg-primary-50' : 'bg-white'
      }`}
      onPress={() => setSelectedConversation(conversation)}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="font-semibold text-gray-900">
              Guest #{conversation.guestId.slice(-4)}
            </Text>
            {conversation.unreadCount > 0 && (
              <View className="ml-2 bg-primary-500 rounded-full w-5 h-5 justify-center items-center">
                <Text className="text-white text-xs font-bold">
                  {conversation.unreadCount}
                </Text>
              </View>
            )}
          </View>
          
          {conversation.bookingId && (
            <Text className="text-gray-600 text-sm">
              Booking #{conversation.bookingId.slice(-6)}
            </Text>
          )}
          
          {conversation.lastMessage && (
            <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>
              {conversation.lastMessage.senderId === hostId ? 'You: ' : ''}
              {conversation.lastMessage.content}
            </Text>
          )}
        </View>
        
        <View className="items-end">
          {conversation.lastMessage && (
            <Text className="text-gray-500 text-xs">
              {formatMessageTime(conversation.lastMessage.createdAt)}
            </Text>
          )}
          
          <View className={`mt-1 w-3 h-3 rounded-full ${
            conversation.isActive ? 'bg-green-400' : 'bg-gray-300'
          }`} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item: message }: { item: HostGuestMessage }) => {
    const isFromHost = message.senderId === hostId;
    
    return (
      <View className={`mb-4 ${isFromHost ? 'items-end' : 'items-start'}`}>
        <View className={`max-w-xs px-4 py-2 rounded-2xl ${
          isFromHost 
            ? 'bg-primary-500 rounded-br-md' 
            : 'bg-gray-200 rounded-bl-md'
        }`}>
          <Text className={`${isFromHost ? 'text-white' : 'text-gray-900'}`}>
            {message.content}
          </Text>
        </View>
        
        <Text className="text-gray-500 text-xs mt-1">
          {formatMessageTime(message.createdAt)}
          {message.readAt && isFromHost && (
            <Text className="text-primary-600"> • Read</Text>
          )}
        </Text>
      </View>
    );
  };

  const renderConversationsList = () => (
    <View className="flex-1">
      <View className="px-4 py-6 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Messages</Text>
        <Text className="text-gray-600">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {conversations.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-xl font-semibold text-gray-900 mb-2">No messages yet</Text>
          <Text className="text-gray-600 text-center">
            When guests book your parking spaces, you'll be able to communicate with them here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  const renderChatView = () => (
    <KeyboardAvoidingView 
      className="flex-1" 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity
          className="mr-4"
          onPress={() => setSelectedConversation(null)}
        >
          <Text className="text-primary-600 text-lg">← Back</Text>
        </TouchableOpacity>
        
        <View className="flex-1">
          <Text className="font-semibold text-gray-900">
            Guest #{selectedConversation?.guestId.slice(-4)}
          </Text>
          {selectedConversation?.bookingId && (
            <Text className="text-gray-600 text-sm">
              Booking #{selectedConversation.bookingId.slice(-6)}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4 py-4"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => (
          <View key={message.id}>
            {renderMessage({ item: message })}
          </View>
        ))}
      </ScrollView>

      <View className="px-4 py-3 bg-white border-t border-gray-200">
        <View className="flex-row items-center space-x-3">
          <TextInput
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-gray-900"
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            multiline
            maxLength={500}
          />
          
          <TouchableOpacity
            className={`w-10 h-10 rounded-full justify-center items-center ${
              newMessage.trim() ? 'bg-primary-500' : 'bg-gray-300'
            }`}
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Text className="text-white font-bold">→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {selectedConversation ? renderChatView() : renderConversationsList()}
    </SafeAreaView>
  );
}