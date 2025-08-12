import React, { useState, useEffect } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';
import { customerManagementService } from '../../../../shared/src/services/customer-management';
import type { CustomerSupportConversation, CustomerSupportMessage, CustomerProfile } from '../../../../shared/src/types/user';

interface CustomerSupportProps {
  operatorId: string;
  currentUserId: string;
  customer?: CustomerProfile;
}

export const CustomerSupport: React.FC<CustomerSupportProps> = ({ 
  operatorId, 
  currentUserId, 
  customer 
}) => {
  const [conversations, setConversations] = useState<CustomerSupportConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<CustomerSupportConversation | null>(null);
  const [, setMessages] = useState<CustomerSupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const [newConversationForm, setNewConversationForm] = useState({
    customerId: customer?.id || '',
    subject: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    initialMessage: ''
  });

  useEffect(() => {
    loadConversations();
  }, [operatorId, customer?.id]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedConversations = await customerManagementService.getSupportConversations(
        operatorId, 
        customer?.id
      );
      setConversations(fetchedConversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async () => {
    try {
      setLoading(true);
      setError(null);

      const conversation = await customerManagementService.createSupportConversation({
        customerId: newConversationForm.customerId,
        operatorId,
        subject: newConversationForm.subject,
        status: 'open',
        priority: newConversationForm.priority
      });

      // Add initial message if provided
      if (newConversationForm.initialMessage) {
        await customerManagementService.addSupportMessage({
          conversationId: conversation.id,
          senderId: currentUserId,
          message: newConversationForm.initialMessage,
          attachments: [],
          isInternal: false
        });
      }

      setShowNewConversationModal(false);
      resetNewConversationForm();
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      setSendingMessage(true);
      await customerManagementService.addSupportMessage({
        conversationId: selectedConversation.id,
        senderId: currentUserId,
        message: newMessage,
        attachments: [],
        isInternal: false
      });

      setNewMessage('');
      // In a real app, you'd reload messages here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const updateConversationStatus = async (conversationId: string, status: CustomerSupportConversation['status']) => {
    try {
      await customerManagementService.updateConversationStatus(conversationId, status);
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update conversation status');
    }
  };

  const resetNewConversationForm = () => {
    setNewConversationForm({
      customerId: customer?.id || '',
      subject: '',
      priority: 'medium',
      initialMessage: ''
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      open: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-purple-100 text-purple-800',
      closed: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityColors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800'}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-secondary-600">Loading support conversations...</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">Customer Support</h3>
            <Button onClick={() => setShowNewConversationModal(true)}>
              New Conversation
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-secondary-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-secondary-900 mb-2">No Support Conversations</h4>
              <p className="text-secondary-600">
                {customer 
                  ? 'No support conversations found for this customer.'
                  : 'No support conversations found.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <div key={conversation.id} className="border border-secondary-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-secondary-900">{conversation.subject}</h4>
                      <p className="text-sm text-secondary-600">
                        Created {conversation.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {getStatusBadge(conversation.status)}
                      {getPriorityBadge(conversation.priority)}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedConversation(conversation);
                          setShowConversationModal(true);
                        }}
                      >
                        View Messages
                      </Button>
                      {conversation.status !== 'closed' && (
                        <select
                          value={conversation.status}
                          onChange={(e) => updateConversationStatus(conversation.id, e.target.value as any)}
                          className="text-sm border border-secondary-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* New Conversation Modal */}
      <Modal
        isOpen={showNewConversationModal}
        onClose={() => {
          setShowNewConversationModal(false);
          resetNewConversationForm();
          setError(null);
        }}
        title="New Support Conversation"
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {!customer && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Customer ID
              </label>
              <Input
                type="text"
                value={newConversationForm.customerId}
                onChange={(e) => setNewConversationForm({ ...newConversationForm, customerId: e.target.value })}
                placeholder="Enter customer ID"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Subject
            </label>
            <Input
              type="text"
              value={newConversationForm.subject}
              onChange={(e) => setNewConversationForm({ ...newConversationForm, subject: e.target.value })}
              placeholder="Enter conversation subject"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Priority
            </label>
            <select
              value={newConversationForm.priority}
              onChange={(e) => setNewConversationForm({ ...newConversationForm, priority: e.target.value as any })}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Initial Message (Optional)
            </label>
            <textarea
              value={newConversationForm.initialMessage}
              onChange={(e) => setNewConversationForm({ ...newConversationForm, initialMessage: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter initial message"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowNewConversationModal(false);
                resetNewConversationForm();
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={createConversation}
              disabled={loading || !newConversationForm.customerId || !newConversationForm.subject}
            >
              {loading ? 'Creating...' : 'Create Conversation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Conversation Messages Modal */}
      <Modal
        isOpen={showConversationModal}
        onClose={() => {
          setShowConversationModal(false);
          setSelectedConversation(null);
          setMessages([]);
          setNewMessage('');
        }}
        title={selectedConversation?.subject || 'Conversation'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Messages would be loaded and displayed here */}
          <div className="border border-secondary-200 rounded-lg p-4 h-64 overflow-y-auto">
            <p className="text-secondary-600 text-center">
              Message history would be displayed here.
              <br />
              This requires additional implementation for real-time messaging.
            </p>
          </div>

          {/* Send Message */}
          <div className="flex space-x-2">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={sendingMessage || !newMessage.trim()}
            >
              {sendingMessage ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};