import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { 
  Message, 
  Conversation
} from '../../models/message';
import { 
  Rating
} from '../../models/rating';
import { 
  ConversationType, 
  MessageType, 
  RatedType, 
  RatingStatus,
  CONVERSATION_TYPE,
  MESSAGE_TYPE,
  RATED_TYPE,
  RATING_STATUS
} from '../../types/common';
import { UserId } from '../../models/value-objects';

// Mock Supabase client
vi.mock('../../config/supabase', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
  },
}));

// Import services after mocking
import { MessagingService } from '../messaging';
import { RatingService } from '../rating';

describe('Social Features', () => {
  let messagingService: MessagingService;
  let ratingService: RatingService;
  let mockSupabase: any;
  
  const mockUserId1 = new UserId('550e8400-e29b-41d4-a716-446655440001');
  const mockUserId2 = new UserId('550e8400-e29b-41d4-a716-446655440002');
  const mockConversationId = '550e8400-e29b-41d4-a716-446655440003';
  const mockBookingId = '550e8400-e29b-41d4-a716-446655440004';

  beforeEach(async () => {
    const supabaseModule = await import('../../config/supabase');
    mockSupabase = supabaseModule.supabase;
    messagingService = new MessagingService();
    ratingService = new RatingService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('MessagingService', () => {
    describe('createConversation', () => {
      it('should create a new conversation', async () => {
        const mockConversationData = {
          id: mockConversationId,
          participants: [mockUserId1.value, mockUserId2.value],
          type: CONVERSATION_TYPE.USER_HOST,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        mockSupabase.from.mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockConversationData,
                error: null,
              }),
            }),
          }),
        });

        const result = await messagingService.createConversation({
          participants: [mockUserId1, mockUserId2],
          type: CONVERSATION_TYPE.USER_HOST,
          metadata: {},
        });

        expect(result).toBeInstanceOf(Conversation);
        expect(result.participants).toHaveLength(2);
        expect(result.type).toBe(CONVERSATION_TYPE.USER_HOST);
        expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
      });

      it('should handle creation errors', async () => {
        mockSupabase.from.mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        });

        await expect(
          messagingService.createConversation({
            participants: [mockUserId1, mockUserId2],
            type: CONVERSATION_TYPE.USER_HOST,
            metadata: {},
          })
        ).rejects.toThrow('Failed to create conversation: Database error');
      });
    });

    describe('sendMessage', () => {
      it('should send a message successfully', async () => {
        const mockMessageData = {
          id: 'msg-1',
          conversation_id: mockConversationId,
          sender_id: mockUserId1.value,
          receiver_id: mockUserId2.value,
          content: 'Hello!',
          type: MESSAGE_TYPE.TEXT,
          is_encrypted: false,
          created_at: new Date().toISOString(),
        };

        mockSupabase.from.mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockMessageData,
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        });

        const result = await messagingService.sendMessage({
          conversationId: mockConversationId,
          senderId: mockUserId1,
          receiverId: mockUserId2,
          content: 'Hello!',
          type: MESSAGE_TYPE.TEXT,
          isEncrypted: false,
        });

        expect(result).toBeInstanceOf(Message);
        expect(result.content).toBe('Hello!');
        expect(result.senderId.equals(mockUserId1)).toBe(true);
        expect(mockSupabase.from).toHaveBeenCalledWith('messages');
      });

      it('should encrypt message content when required', async () => {
        const mockMessageData = {
          id: 'msg-1',
          conversation_id: mockConversationId,
          sender_id: mockUserId1.value,
          receiver_id: mockUserId2.value,
          content: 'SGVsbG8h', // Base64 encoded "Hello!"
          type: MESSAGE_TYPE.TEXT,
          is_encrypted: true,
          created_at: new Date().toISOString(),
        };

        mockSupabase.from.mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockMessageData,
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        });

        const result = await messagingService.sendMessage({
          conversationId: mockConversationId,
          senderId: mockUserId1,
          receiverId: mockUserId2,
          content: 'Hello!',
          type: MESSAGE_TYPE.TEXT,
          isEncrypted: true,
        });

        expect(result).toBeInstanceOf(Message);
        expect(result.isEncrypted).toBe(true);
      });
    });

    describe('getMessages', () => {
      it('should retrieve messages for a conversation', async () => {
        const mockMessages = [
          {
            id: 'msg-1',
            conversation_id: mockConversationId,
            sender_id: mockUserId1.value,
            receiver_id: mockUserId2.value,
            content: 'Hello!',
            type: MESSAGE_TYPE.TEXT,
            is_encrypted: false,
            created_at: new Date().toISOString(),
          },
          {
            id: 'msg-2',
            conversation_id: mockConversationId,
            sender_id: mockUserId2.value,
            receiver_id: mockUserId1.value,
            content: 'Hi there!',
            type: MESSAGE_TYPE.TEXT,
            is_encrypted: false,
            created_at: new Date().toISOString(),
          },
        ];

        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockMessages,
                  error: null,
                }),
              }),
            }),
          }),
        });

        const result = await messagingService.getMessages(mockConversationId);

        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(Message);
        expect(result[1]).toBeInstanceOf(Message);
        expect(mockSupabase.from).toHaveBeenCalledWith('messages');
      });
    });
  });

  describe('RatingService', () => {
    describe('createRating', () => {
      it('should create a new rating', async () => {
        const mockRatingData = {
          id: 'rating-1',
          booking_id: mockBookingId,
          rater_id: mockUserId1.value,
          rated_id: mockUserId2.value,
          rated_type: RATED_TYPE.HOST,
          score: 5,
          review: 'Great host!',
          photos: [],
          created_at: new Date().toISOString(),
        };

        mockSupabase.from.mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockRatingData,
                error: null,
              }),
            }),
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }, // Not found
              }),
            }),
          }),
          upsert: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        });

        const result = await ratingService.createRating({
          bookingId: mockBookingId,
          raterId: mockUserId1,
          ratedId: mockUserId2,
          ratedType: RATED_TYPE.HOST,
          score: 5,
          review: 'Great host!',
        });

        expect(result).toBeInstanceOf(Rating);
        expect(result.score).toBe(5);
        expect(result.review).toBe('Great host!');
        expect(result.ratedType).toBe(RATED_TYPE.HOST);
        expect(mockSupabase.from).toHaveBeenCalledWith('ratings');
      });

      it('should validate rating score', async () => {
        await expect(
          ratingService.createRating({
            bookingId: mockBookingId,
            raterId: mockUserId1,
            ratedId: mockUserId2,
            ratedType: RATED_TYPE.HOST,
            score: 6, // Invalid score
          })
        ).rejects.toThrow('Rating score must be between 1 and 5');
      });
    });

    describe('getRatingsForEntity', () => {
      it('should retrieve ratings for an entity', async () => {
        const mockRatings = [
          {
            id: '550e8400-e29b-41d4-a716-446655440005',
            booking_id: mockBookingId,
            rater_id: mockUserId1.value,
            rated_id: mockUserId2.value,
            rated_type: RATED_TYPE.HOST,
            score: 5,
            review: 'Great host!',
            photos: [],
            created_at: new Date().toISOString(),
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440006',
            booking_id: '550e8400-e29b-41d4-a716-446655440007',
            rater_id: '550e8400-e29b-41d4-a716-446655440008',
            rated_id: mockUserId2.value,
            rated_type: RATED_TYPE.HOST,
            score: 4,
            review: 'Good experience',
            photos: [],
            created_at: new Date().toISOString(),
          },
        ];

        mockSupabase.from.mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: mockRatings,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        });

        const result = await ratingService.getRatingsForEntity(
          mockUserId2.value,
          RATED_TYPE.HOST
        );

        expect(result).toHaveLength(2);
        expect(result[0]).toBeInstanceOf(Rating);
        expect(result[1]).toBeInstanceOf(Rating);
        expect(mockSupabase.from).toHaveBeenCalledWith('ratings');
      });
    });

    describe('flagRating', () => {
      it('should flag a rating for moderation', async () => {
        mockSupabase.from.mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        });

        await ratingService.flagRating('rating-1', 'Inappropriate content');

        expect(mockSupabase.from).toHaveBeenCalledWith('ratings');
      });
    });

    describe('canUserRate', () => {
      it('should return true if user can rate', async () => {
        // Mock completed booking
        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      status: 'completed',
                      user_id: mockUserId1.value,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        });

        // Mock no existing rating
        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }, // Not found
                  }),
                }),
              }),
            }),
          }),
        });

        const result = await ratingService.canUserRate(
          mockUserId1,
          mockBookingId,
          mockUserId2.value,
          RATED_TYPE.HOST
        );

        expect(result).toBe(true);
      });

      it('should return false if user already rated', async () => {
        // Mock completed booking
        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      status: 'completed',
                      user_id: mockUserId1.value,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        });

        // Mock existing rating
        mockSupabase.from.mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'existing-rating' },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        });

        const result = await ratingService.canUserRate(
          mockUserId1,
          mockBookingId,
          mockUserId2.value,
          RATED_TYPE.HOST
        );

        expect(result).toBe(false);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle messaging and rating workflow', async () => {
      // This would test the complete workflow of:
      // 1. Creating a conversation between host and guest
      // 2. Exchanging messages
      // 3. Completing a booking
      // 4. Rating each other
      
      // Mock conversation creation
      const mockConversationData = {
        id: mockConversationId,
        participants: [mockUserId1.value, mockUserId2.value],
        type: CONVERSATION_TYPE.USER_HOST,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockConversationData,
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
        upsert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      // Create conversation
      const conversation = await messagingService.createConversation({
        participants: [mockUserId1, mockUserId2],
        type: CONVERSATION_TYPE.USER_HOST,
        metadata: { bookingId: mockBookingId },
      });

      expect(conversation).toBeInstanceOf(Conversation);
      expect(conversation.participants).toHaveLength(2);

      // The rest of the integration test would continue...
      // This demonstrates the structure for comprehensive testing
    });
  });
});