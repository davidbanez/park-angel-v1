import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@park-angel/shared/src/lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'parking' | 'payment' | 'account' | 'technical' | 'other';
  created_at: string;
  updated_at: string;
  last_message_at: string;
  unread_count: number;
}

interface ChatMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'user' | 'support';
  message: string;
  message_type: 'text' | 'image' | 'file';
  created_at: string;
  read_at?: string;
  sender_name?: string;
}

const TICKET_CATEGORIES = [
  { value: 'parking', label: 'Parking Issues', icon: 'car' },
  { value: 'payment', label: 'Payment & Billing', icon: 'card' },
  { value: 'account', label: 'Account Management', icon: 'person' },
  { value: 'technical', label: 'Technical Support', icon: 'settings' },
  { value: 'other', label: 'Other', icon: 'help-circle' },
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'text-green-600 bg-green-100' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-100' },
  { value: 'high', label: 'High', color: 'text-orange-600 bg-orange-100' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600 bg-red-100' },
];

export default function CustomerSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicketData, setNewTicketData] = useState({
    subject: '',
    category: 'other',
    priority: 'medium',
    description: '',
  });
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (user) {
      loadTickets();
      setupRealtimeSubscription();
    }
  }, [user]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
      markMessagesAsRead(selectedTicket.id);
    }
  }, [selectedTicket]);

  const setupRealtimeSubscription = () => {
    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel('support_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=in.(${tickets.map(t => t.id).join(',')})`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          if (selectedTicket && newMessage.ticket_id === selectedTicket.id) {
            setMessages(prev => [...prev, newMessage]);
            markMessagesAsRead(selectedTicket.id);
          }
          // Update ticket list to reflect new message
          loadTickets();
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  };

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          *,
          unread_count:support_messages(count)
        `)
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Calculate unread count for each ticket
      const ticketsWithUnread = await Promise.all(
        (data || []).map(async (ticket) => {
          const { count } = await supabase
            .from('support_messages')
            .select('*', { count: 'exact', head: true })
            .eq('ticket_id', ticket.id)
            .eq('sender_type', 'support')
            .is('read_at', null);

          return {
            ...ticket,
            unread_count: count || 0,
          };
        })
      );

      setTickets(ticketsWithUnread);
    } catch (error: any) {
      console.error('Error loading tickets:', error);
      Alert.alert('Error', 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select(`
          *,
          sender_name:sender_id(
            first_name,
            last_name
          )
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Scroll to bottom after loading messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    }
  };

  const markMessagesAsRead = async (ticketId: string) => {
    try {
      await supabase
        .from('support_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('ticket_id', ticketId)
        .eq('sender_type', 'support')
        .is('read_at', null);
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
    }
  };

  const createNewTicket = async () => {
    if (!newTicketData.subject.trim() || !newTicketData.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      // Create the ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user?.id,
          subject: newTicketData.subject.trim(),
          category: newTicketData.category,
          priority: newTicketData.priority,
          status: 'open',
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Create the initial message
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user?.id,
          sender_type: 'user',
          message: newTicketData.description.trim(),
          message_type: 'text',
        });

      if (messageError) throw messageError;

      // Reset form and reload tickets
      setNewTicketData({
        subject: '',
        category: 'other',
        priority: 'medium',
        description: '',
      });
      setShowNewTicketForm(false);
      await loadTickets();
      
      Alert.alert('Success', 'Support ticket created successfully');
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      Alert.alert('Error', 'Failed to create support ticket');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      setSendingMessage(true);

      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: user?.id,
          sender_type: 'user',
          message: newMessage.trim(),
          message_type: 'text',
        });

      if (error) throw error;

      // Update ticket status to in_progress if it was closed
      if (selectedTicket.status === 'closed' || selectedTicket.status === 'resolved') {
        await supabase
          .from('support_tickets')
          .update({ 
            status: 'in_progress',
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedTicket.id);
      }

      setNewMessage('');
      await loadMessages(selectedTicket.id);
      await loadTickets();
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-blue-600 bg-blue-100';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'resolved':
        return 'text-green-600 bg-green-100';
      case 'closed':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    const priorityConfig = PRIORITY_LEVELS.find(p => p.value === priority);
    return priorityConfig?.color || 'text-gray-600 bg-gray-100';
  };

  const getCategoryIcon = (category: string) => {
    const categoryConfig = TICKET_CATEGORIES.find(c => c.value === category);
    return categoryConfig?.icon || 'help-circle';
  };

  const renderTicketItem = ({ item }: { item: SupportTicket }) => (
    <TouchableOpacity
      onPress={() => setSelectedTicket(item)}
      className={`bg-white rounded-xl p-4 mb-3 border ${
        selectedTicket?.id === item.id ? 'border-purple-300' : 'border-gray-200'
      }`}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <Ionicons 
              name={getCategoryIcon(item.category) as any} 
              size={16} 
              color="#8b5cf6" 
            />
            <Text className="text-lg font-semibold text-gray-900 ml-2 flex-1">
              {item.subject}
            </Text>
            {item.unread_count > 0 && (
              <View className="bg-red-500 rounded-full min-w-[20px] h-5 justify-center items-center">
                <Text className="text-white text-xs font-bold">
                  {item.unread_count}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-gray-600 text-sm mb-2">
            {formatDate(item.updated_at)}
          </Text>
        </View>
      </View>
      
      <View className="flex-row justify-between items-center">
        <View className="flex-row space-x-2">
          <View className={`px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
            <Text className="text-xs font-medium capitalize">
              {item.status.replace('_', ' ')}
            </Text>
          </View>
          <View className={`px-2 py-1 rounded-full ${getPriorityColor(item.priority)}`}>
            <Text className="text-xs font-medium capitalize">
              {item.priority}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender_type === 'user';
    
    return (
      <View className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
        <View
          className={`max-w-[80%] p-3 rounded-2xl ${
            isUser
              ? 'bg-purple-500 rounded-br-md'
              : 'bg-gray-200 rounded-bl-md'
          }`}
        >
          <Text className={`${isUser ? 'text-white' : 'text-gray-900'}`}>
            {item.message}
          </Text>
        </View>
        <Text className="text-xs text-gray-500 mt-1">
          {formatDate(item.created_at)}
        </Text>
      </View>
    );
  };

  if (showNewTicketForm) {
    return (
      <View className="flex-1">
        <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
          <Text className="text-xl font-bold">New Support Ticket</Text>
          <TouchableOpacity onPress={() => setShowNewTicketForm(false)}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 p-6">
          {/* Subject */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Subject *</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
              placeholder="Brief description of your issue"
              value={newTicketData.subject}
              onChangeText={(text) => setNewTicketData({ ...newTicketData, subject: text })}
            />
          </View>

          {/* Category */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Category</Text>
            <View className="flex-row flex-wrap">
              {TICKET_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  onPress={() => setNewTicketData({ ...newTicketData, category: category.value })}
                  className={`mr-2 mb-2 px-3 py-2 rounded-lg flex-row items-center ${
                    newTicketData.category === category.value
                      ? 'bg-purple-500'
                      : 'bg-gray-200'
                  }`}
                >
                  <Ionicons 
                    name={category.icon as any} 
                    size={16} 
                    color={newTicketData.category === category.value ? 'white' : '#6b7280'} 
                  />
                  <Text
                    className={`ml-1 ${
                      newTicketData.category === category.value
                        ? 'text-white'
                        : 'text-gray-700'
                    }`}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Priority */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Priority</Text>
            <View className="flex-row flex-wrap">
              {PRIORITY_LEVELS.map((priority) => (
                <TouchableOpacity
                  key={priority.value}
                  onPress={() => setNewTicketData({ ...newTicketData, priority: priority.value })}
                  className={`mr-2 mb-2 px-3 py-2 rounded-lg ${
                    newTicketData.priority === priority.value
                      ? 'bg-purple-500'
                      : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={
                      newTicketData.priority === priority.value
                        ? 'text-white'
                        : 'text-gray-700'
                    }
                  >
                    {priority.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-gray-700 font-medium mb-2">Description *</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 h-32"
              placeholder="Please provide detailed information about your issue..."
              value={newTicketData.description}
              onChangeText={(text) => setNewTicketData({ ...newTicketData, description: text })}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={createNewTicket}
            disabled={loading}
            className={`py-4 px-8 rounded-xl ${
              loading ? 'bg-gray-300' : 'bg-purple-500'
            }`}
          >
            <Text className="text-white text-lg font-semibold text-center">
              {loading ? 'Creating...' : 'Create Ticket'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (selectedTicket) {
    return (
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Chat Header */}
        <View className="flex-row items-center p-4 border-b border-gray-200 bg-white">
          <TouchableOpacity
            onPress={() => setSelectedTicket(null)}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="#6b7280" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">
              {selectedTicket.subject}
            </Text>
            <View className="flex-row items-center mt-1">
              <View className={`px-2 py-1 rounded-full mr-2 ${getStatusColor(selectedTicket.status)}`}>
                <Text className="text-xs font-medium capitalize">
                  {selectedTicket.status.replace('_', ' ')}
                </Text>
              </View>
              <View className={`px-2 py-1 rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                <Text className="text-xs font-medium capitalize">
                  {selectedTicket.priority}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          className="flex-1 px-4 py-4"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Message Input */}
        <View className="flex-row items-center p-4 border-t border-gray-200 bg-white">
          <TextInput
            className="flex-1 border border-gray-300 rounded-full px-4 py-3 mr-3 text-gray-900"
            placeholder="Type your message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!newMessage.trim() || sendingMessage}
            className={`p-3 rounded-full ${
              newMessage.trim() && !sendingMessage ? 'bg-purple-500' : 'bg-gray-300'
            }`}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={newMessage.trim() && !sendingMessage ? 'white' : '#6b7280'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-2xl font-bold text-gray-900">Customer Support</Text>
          <Text className="text-gray-600">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowNewTicketForm(true)}
          className="bg-purple-500 p-3 rounded-xl"
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Tickets List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-600">Loading support tickets...</Text>
        </View>
      ) : tickets.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
          <Text className="text-gray-500 text-lg mt-4 mb-2">No support tickets</Text>
          <Text className="text-gray-400 text-center mb-6">
            Create a ticket to get help from our support team
          </Text>
          <TouchableOpacity
            onPress={() => setShowNewTicketForm(true)}
            className="bg-purple-500 py-3 px-6 rounded-xl"
          >
            <Text className="text-white font-semibold">Create Ticket</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={renderTicketItem}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadTickets}
        />
      )}
    </View>
  );
}