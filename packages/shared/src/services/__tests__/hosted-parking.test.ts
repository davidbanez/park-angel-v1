import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { SupabaseHostedParkingService } from '../hosted-parking';
import type {
    HostProfile,
    HostedListing,
    HostOnboardingData,
    CreateHostedListingData,
    UpdateHostedListingData,
} from '../../types/hosted-parking';

// Mock Supabase client
vi.mock('@supabase/supabase-js');

// Mock File constructor for Node.js environment
global.File = class MockFile {
    name: string;
    type: string;
    size: number;

    constructor(bits: any[], filename: string, options: { type: string }) {
        this.name = filename;
        this.type = options.type;
        this.size = bits.reduce((acc, bit) => acc + (bit.length || 0), 0);
    }
} as any;

const mockSupabase = {
    from: vi.fn(),
    storage: {
        from: vi.fn(),
    },
};

const mockQuery = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    contains: vi.fn(),
    is: vi.fn(),
};

describe('SupabaseHostedParkingService', () => {
    let service: SupabaseHostedParkingService;

    beforeEach(() => {
        vi.clearAllMocks();
        (createClient as Mock).mockReturnValue(mockSupabase);
        service = new SupabaseHostedParkingService(mockSupabase as any);

        // Setup default mock chain - each method returns the query object to allow chaining
        const createMockChain = () => {
            const chain = {
                select: vi.fn().mockReturnThis(),
                insert: vi.fn().mockReturnThis(),
                update: vi.fn().mockReturnThis(),
                delete: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                contains: vi.fn().mockReturnThis(),
                is: vi.fn().mockReturnThis(),
            };
            return chain;
        };

        mockSupabase.from.mockImplementation(() => createMockChain());

        // Setup storage mock
        const mockStorage = {
            upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
            getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test.jpg' } }),
            remove: vi.fn().mockResolvedValue({ error: null }),
        };
        mockSupabase.storage.from.mockReturnValue(mockStorage);
    });

    describe('Host Profile Management', () => {
        const mockHostOnboardingData: HostOnboardingData = {
            personalInfo: {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '+1234567890',
                dateOfBirth: new Date('1990-01-01'),
            },
            businessInfo: {
                businessName: 'John\'s Parking',
                businessType: 'Individual',
                taxId: '123456789',
            },
            propertyInfo: {
                address: '123 Main St, City, State',
                propertyType: 'residential',
                ownershipType: 'owner',
            },
            bankingInfo: {
                accountName: 'John Doe',
                accountNumber: '1234567890',
                bankName: 'Test Bank',
                accountType: 'checking',
            },
            documents: {
                identityDocument: new File([''], 'id.pdf', { type: 'application/pdf' }),
                propertyDocument: new File([''], 'property.pdf', { type: 'application/pdf' }),
                businessDocument: new File([''], 'business.pdf', { type: 'application/pdf' }),
            },
        };

        const mockHostProfile: HostProfile = {
            id: 'host-123',
            userId: 'user-123',
            businessName: 'John\'s Parking',
            description: 'Host since 2024',
            profilePhoto: 'https://example.com/photo.jpg',
            verificationStatus: 'pending',
            verificationDocuments: [],
            bankDetails: mockHostOnboardingData.bankingInfo,
            rating: 0,
            totalReviews: 0,
            joinedAt: new Date(),
            isActive: true,
        };

        it('should create a host profile successfully', async () => {
            const mockDbProfile = {
                id: 'host-123',
                user_id: 'user-123',
                business_name: 'John\'s Parking',
                description: 'Host since 2024',
                verification_status: 'pending',
                is_active: true,
                created_at: new Date().toISOString(),
            };

            mockQuery.single.mockResolvedValue({ data: mockDbProfile, error: null });

            const result = await service.createHostProfile(mockHostOnboardingData);

            expect(mockSupabase.from).toHaveBeenCalledWith('host_profiles');
            expect(mockQuery.insert).toHaveBeenCalled();
            expect(result.businessName).toBe('John\'s Parking');
            expect(result.verificationStatus).toBe('pending');
        });

        it('should get host profile by ID', async () => {
            const mockDbProfile = {
                id: 'host-123',
                user_id: 'user-123',
                business_name: 'John\'s Parking',
                description: 'Host since 2024',
                verification_status: 'verified',
                verification_documents: [],
                rating: 4.5,
                total_reviews: 10,
                created_at: new Date().toISOString(),
                is_active: true,
            };

            mockQuery.single.mockResolvedValue({ data: mockDbProfile, error: null });

            const result = await service.getHostProfile('host-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('host_profiles');
            expect(mockQuery.eq).toHaveBeenCalledWith('id', 'host-123');
            expect(result?.businessName).toBe('John\'s Parking');
            expect(result?.rating).toBe(4.5);
        });

        it('should return null when host profile not found', async () => {
            mockQuery.single.mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' }
            });

            const result = await service.getHostProfile('nonexistent');

            expect(result).toBeNull();
        });

        it('should update host profile', async () => {
            const updateData = {
                businessName: 'Updated Business Name',
                description: 'Updated description',
            };

            const mockUpdatedProfile = {
                id: 'host-123',
                business_name: 'Updated Business Name',
                description: 'Updated description',
                created_at: new Date().toISOString(),
            };

            mockQuery.single.mockResolvedValueOnce({ data: mockUpdatedProfile, error: null });
            mockQuery.single.mockResolvedValueOnce({
                data: { ...mockUpdatedProfile, verification_documents: [] },
                error: null
            });

            const result = await service.updateHostProfile('host-123', updateData);

            expect(mockSupabase.from).toHaveBeenCalledWith('host_profiles');
            expect(mockQuery.update).toHaveBeenCalled();
            expect(result.businessName).toBe('Updated Business Name');
        });

        it('should verify host documents', async () => {
            mockQuery.select.mockResolvedValue({
                data: [
                    { status: 'approved' },
                    { status: 'approved' },
                ],
                error: null,
            });

            await service.verifyHostDocuments('host-123', 'doc-123', 'approved', 'Looks good');

            expect(mockSupabase.from).toHaveBeenCalledWith('verification_documents');
            expect(mockQuery.update).toHaveBeenCalledWith({
                status: 'approved',
                review_notes: 'Looks good',
                reviewed_at: expect.any(String),
            });
        });
    });

    describe('Listing Management', () => {
        const mockCreateListingData: CreateHostedListingData = {
            title: 'Secure Parking Space',
            description: 'Safe and convenient parking',
            spotId: 'spot-123',
            photos: [new File([''], 'photo1.jpg', { type: 'image/jpeg' })],
            amenities: ['Covered', 'Security Camera'],
            accessInstructions: 'Use gate code 1234',
            pricing: {
                baseRate: 50,
                currency: 'PHP',
            },
            availability: {
                recurring: {
                    monday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
                    tuesday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
                    wednesday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
                    thursday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
                    friday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
                    saturday: { isAvailable: true, timeSlots: [{ startTime: '08:00', endTime: '18:00' }] },
                    sunday: { isAvailable: false, timeSlots: [] },
                },
                exceptions: [],
                blackoutDates: [],
            },
        };

        const mockHostedListing: HostedListing = {
            id: 'listing-123',
            hostId: 'host-123',
            spotId: 'spot-123',
            title: 'Secure Parking Space',
            description: 'Safe and convenient parking',
            photos: ['https://example.com/photo1.jpg'],
            amenities: ['Covered', 'Security Camera'],
            accessInstructions: 'Use gate code 1234',
            pricing: mockCreateListingData.pricing,
            availability: mockCreateListingData.availability,
            rating: 0,
            totalReviews: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        it('should create a hosted listing', async () => {
            const mockDbListing = {
                id: 'listing-123',
                host_id: 'host-123',
                spot_id: 'spot-123',
                title: 'Secure Parking Space',
                description: 'Safe and convenient parking',
                amenities: ['Covered', 'Security Camera'],
                access_instructions: 'Use gate code 1234',
                pricing: mockCreateListingData.pricing,
                availability: mockCreateListingData.availability,
                rating: 0,
                total_reviews: 0,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            mockQuery.single.mockResolvedValue({ data: mockDbListing, error: null });

            // Mock storage upload
            const mockStorage = {
                upload: vi.fn().mockResolvedValue({ data: { path: 'listing-123/photo1.jpg' }, error: null }),
                getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/photo1.jpg' } }),
            };
            mockSupabase.storage.from.mockReturnValue(mockStorage);

            const result = await service.createListing(mockCreateListingData);

            expect(mockSupabase.from).toHaveBeenCalledWith('hosted_listings');
            expect(mockQuery.insert).toHaveBeenCalled();
            expect(result.title).toBe('Secure Parking Space');
            expect(result.amenities).toEqual(['Covered', 'Security Camera']);
        });

        it('should get host listings', async () => {
            const mockDbListings = [
                {
                    id: 'listing-123',
                    host_id: 'host-123',
                    spot_id: 'spot-123',
                    title: 'Secure Parking Space',
                    description: 'Safe and convenient parking',
                    photos: ['https://example.com/photo1.jpg'],
                    amenities: ['Covered', 'Security Camera'],
                    access_instructions: 'Use gate code 1234',
                    pricing: mockCreateListingData.pricing,
                    availability: mockCreateListingData.availability,
                    rating: 4.5,
                    total_reviews: 5,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            ];

            mockQuery.order.mockResolvedValue({ data: mockDbListings, error: null });

            const result = await service.getHostListings('host-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('hosted_listings');
            expect(mockQuery.eq).toHaveBeenCalledWith('host_id', 'host-123');
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Secure Parking Space');
        });

        it('should get a single listing by ID', async () => {
            const mockDbListing = {
                id: 'listing-123',
                host_id: 'host-123',
                spot_id: 'spot-123',
                title: 'Secure Parking Space',
                description: 'Safe and convenient parking',
                photos: ['https://example.com/photo1.jpg'],
                amenities: ['Covered', 'Security Camera'],
                access_instructions: 'Use gate code 1234',
                pricing: mockCreateListingData.pricing,
                availability: mockCreateListingData.availability,
                rating: 4.5,
                total_reviews: 5,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            mockQuery.single.mockResolvedValue({ data: mockDbListing, error: null });

            const result = await service.getListing('listing-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('hosted_listings');
            expect(mockQuery.eq).toHaveBeenCalledWith('id', 'listing-123');
            expect(result?.title).toBe('Secure Parking Space');
        });

        it('should update a listing', async () => {
            const updateData: UpdateHostedListingData = {
                id: 'listing-123',
                title: 'Updated Parking Space',
                description: 'Updated description',
            };

            const mockUpdatedListing = {
                id: 'listing-123',
                host_id: 'host-123',
                spot_id: 'spot-123',
                title: 'Updated Parking Space',
                description: 'Updated description',
                photos: ['https://example.com/photo1.jpg'],
                amenities: ['Covered', 'Security Camera'],
                access_instructions: 'Use gate code 1234',
                pricing: mockCreateListingData.pricing,
                availability: mockCreateListingData.availability,
                rating: 4.5,
                total_reviews: 5,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            mockQuery.single.mockResolvedValue({ data: mockUpdatedListing, error: null });

            const result = await service.updateListing(updateData);

            expect(mockSupabase.from).toHaveBeenCalledWith('hosted_listings');
            expect(mockQuery.update).toHaveBeenCalled();
            expect(result.title).toBe('Updated Parking Space');
        });

        it('should delete a listing', async () => {
            mockQuery.delete.mockResolvedValue({ error: null });

            await service.deleteListing('listing-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('hosted_listings');
            expect(mockQuery.delete).toHaveBeenCalled();
            expect(mockQuery.eq).toHaveBeenCalledWith('id', 'listing-123');
        });

        it('should toggle listing status', async () => {
            mockQuery.update.mockResolvedValue({ error: null });

            await service.toggleListingStatus('listing-123', false);

            expect(mockSupabase.from).toHaveBeenCalledWith('hosted_listings');
            expect(mockQuery.update).toHaveBeenCalledWith({ is_active: false });
            expect(mockQuery.eq).toHaveBeenCalledWith('id', 'listing-123');
        });
    });

    describe('Earnings and Analytics', () => {
        it('should get host earnings', async () => {
            const mockPayouts = [
                {
                    id: 'payout-1',
                    host_id: 'host-123',
                    net_amount: 1000,
                    status: 'processed',
                    created_at: new Date().toISOString(),
                },
                {
                    id: 'payout-2',
                    host_id: 'host-123',
                    net_amount: 500,
                    status: 'processed',
                    created_at: new Date().toISOString(),
                },
            ];

            mockQuery.select.mockResolvedValue({ data: mockPayouts, error: null });

            const result = await service.getHostEarnings('host-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('host_payouts');
            expect(result.totalEarnings).toBe(1500);
        });

        it('should get host analytics', async () => {
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            const result = await service.getHostAnalytics('host-123', startDate, endDate);

            expect(result.period.startDate).toEqual(startDate);
            expect(result.period.endDate).toEqual(endDate);
            expect(result.earnings).toBeDefined();
            expect(result.bookings).toBeDefined();
            expect(result.occupancy).toBeDefined();
            expect(result.ratings).toBeDefined();
        });

        it('should get host payouts', async () => {
            const mockPayouts = [
                {
                    id: 'payout-1',
                    host_id: 'host-123',
                    booking_ids: ['booking-1', 'booking-2'],
                    gross_amount: 1200,
                    platform_fee: 480,
                    net_amount: 720,
                    status: 'processed',
                    processed_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                },
            ];

            mockQuery.limit.mockResolvedValue({ data: mockPayouts, error: null });

            const result = await service.getHostPayouts('host-123', 10);

            expect(mockSupabase.from).toHaveBeenCalledWith('host_payouts');
            expect(mockQuery.eq).toHaveBeenCalledWith('host_id', 'host-123');
            expect(mockQuery.limit).toHaveBeenCalledWith(10);
            expect(result).toHaveLength(1);
            expect(result[0].netAmount).toBe(720);
        });

        it('should process host payout', async () => {
            const mockPayout = {
                id: 'payout-123',
                host_id: 'host-123',
                booking_ids: ['booking-1', 'booking-2'],
                gross_amount: 1000,
                platform_fee: 400,
                net_amount: 600,
                status: 'pending',
                created_at: new Date().toISOString(),
            };

            mockQuery.single.mockResolvedValue({ data: mockPayout, error: null });

            const result = await service.processHostPayout('host-123', ['booking-1', 'booking-2']);

            expect(mockSupabase.from).toHaveBeenCalledWith('host_payouts');
            expect(mockQuery.insert).toHaveBeenCalled();
            expect(result.status).toBe('pending');
            expect(result.netAmount).toBe(600);
        });
    });

    describe('Messaging System', () => {
        it('should get host conversations', async () => {
            const mockConversations = [
                {
                    id: 'conv-123',
                    participants: ['host-123', 'guest-456'],
                    type: 'user_host',
                    booking_id: 'booking-123',
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    messages: [
                        {
                            id: 'msg-1',
                            content: 'Hello, I have a question about parking',
                            sender_id: 'guest-456',
                            created_at: new Date().toISOString(),
                        },
                    ],
                },
            ];

            mockQuery.order.mockResolvedValue({ data: mockConversations, error: null });

            const result = await service.getHostConversations('host-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
            expect(mockQuery.contains).toHaveBeenCalledWith('participants', ['host-123']);
            expect(result).toHaveLength(1);
            expect(result[0].guestId).toBe('guest-456');
        });

        it('should get conversation messages', async () => {
            const mockMessages = [
                {
                    id: 'msg-1',
                    conversation_id: 'conv-123',
                    sender_id: 'guest-456',
                    receiver_id: 'host-123',
                    content: 'Hello, I have a question',
                    type: 'text',
                    metadata: null,
                    read_at: null,
                    created_at: new Date().toISOString(),
                },
                {
                    id: 'msg-2',
                    conversation_id: 'conv-123',
                    sender_id: 'host-123',
                    receiver_id: 'guest-456',
                    content: 'Sure, how can I help?',
                    type: 'text',
                    metadata: null,
                    read_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                },
            ];

            mockQuery.order.mockResolvedValue({ data: mockMessages, error: null });

            const result = await service.getConversationMessages('conv-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('messages');
            expect(mockQuery.eq).toHaveBeenCalledWith('conversation_id', 'conv-123');
            expect(result).toHaveLength(2);
            expect(result[0].content).toBe('Hello, I have a question');
        });

        it('should send a message', async () => {
            const mockConversation = {
                id: 'conv-123',
                participants: ['host-123', 'guest-456'],
            };

            const mockMessage = {
                id: 'msg-123',
                conversation_id: 'conv-123',
                sender_id: 'host-123',
                receiver_id: 'guest-456',
                content: 'Thanks for your question!',
                type: 'text',
                is_encrypted: false,
                created_at: new Date().toISOString(),
            };

            mockQuery.single.mockResolvedValueOnce({ data: mockConversation, error: null });
            mockQuery.single.mockResolvedValueOnce({ data: mockMessage, error: null });
            mockQuery.update.mockResolvedValue({ error: null });

            const result = await service.sendMessage('conv-123', 'host-123', 'Thanks for your question!');

            expect(mockSupabase.from).toHaveBeenCalledWith('conversations');
            expect(mockSupabase.from).toHaveBeenCalledWith('messages');
            expect(result.content).toBe('Thanks for your question!');
            expect(result.senderId).toBe('host-123');
        });

        it('should mark messages as read', async () => {
            mockQuery.is.mockResolvedValue({ error: null });

            await service.markMessagesAsRead('conv-123', 'host-123');

            expect(mockSupabase.from).toHaveBeenCalledWith('messages');
            expect(mockQuery.update).toHaveBeenCalledWith({ read_at: expect.any(String) });
            expect(mockQuery.eq).toHaveBeenCalledWith('conversation_id', 'conv-123');
            expect(mockQuery.eq).toHaveBeenCalledWith('receiver_id', 'host-123');
        });
    });

    describe('File Management', () => {
        it('should upload listing photos', async () => {
            const mockPhotos = [
                new File(['photo1'], 'photo1.jpg', { type: 'image/jpeg' }),
                new File(['photo2'], 'photo2.jpg', { type: 'image/jpeg' }),
            ];

            const mockStorage = {
                upload: vi.fn()
                    .mockResolvedValueOnce({ data: { path: 'listing-123/photo1.jpg' }, error: null })
                    .mockResolvedValueOnce({ data: { path: 'listing-123/photo2.jpg' }, error: null }),
                getPublicUrl: vi.fn()
                    .mockReturnValueOnce({ data: { publicUrl: 'https://example.com/photo1.jpg' } })
                    .mockReturnValueOnce({ data: { publicUrl: 'https://example.com/photo2.jpg' } }),
            };

            mockSupabase.storage.from.mockReturnValue(mockStorage);

            const result = await service.uploadListingPhotos('listing-123', mockPhotos);

            expect(mockSupabase.storage.from).toHaveBeenCalledWith('listing-photos');
            expect(mockStorage.upload).toHaveBeenCalledTimes(2);
            expect(result).toHaveLength(2);
            expect(result[0]).toBe('https://example.com/photo1.jpg');
            expect(result[1]).toBe('https://example.com/photo2.jpg');
        });

        it('should delete listing photo', async () => {
            const mockStorage = {
                remove: vi.fn().mockResolvedValue({ error: null }),
            };

            mockSupabase.storage.from.mockReturnValue(mockStorage);

            await service.deleteListingPhoto('listing-123', 'https://example.com/storage/photo1.jpg');

            expect(mockSupabase.storage.from).toHaveBeenCalledWith('listing-photos');
            expect(mockStorage.remove).toHaveBeenCalled();
        });

        it('should upload verification document', async () => {
            const mockFile = new File(['document'], 'id.pdf', { type: 'application/pdf' });

            const mockStorage = {
                upload: vi.fn().mockResolvedValue({ data: { path: 'host-123/identity-doc.pdf' }, error: null }),
                getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/doc.pdf' } }),
            };

            const mockDocument = {
                id: 'doc-123',
                type: 'identity',
                file_name: 'id.pdf',
                file_url: 'https://example.com/doc.pdf',
                status: 'pending',
                created_at: new Date().toISOString(),
            };

            mockSupabase.storage.from.mockReturnValue(mockStorage);
            mockQuery.single.mockResolvedValue({ data: mockDocument, error: null });

            const result = await service.uploadVerificationDocument('host-123', 'identity', mockFile);

            expect(mockSupabase.storage.from).toHaveBeenCalledWith('verification-documents');
            expect(mockSupabase.from).toHaveBeenCalledWith('verification_documents');
            expect(result.type).toBe('identity');
            expect(result.status).toBe('pending');
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            mockQuery.single.mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' }
            });

            await expect(service.getHostProfile('host-123')).rejects.toThrow();
        });

        it('should handle storage errors gracefully', async () => {
            const mockPhotos = [new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })];

            const mockStorage = {
                upload: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Storage upload failed' }
                }),
            };

            mockSupabase.storage.from.mockReturnValue(mockStorage);

            await expect(service.uploadListingPhotos('listing-123', mockPhotos)).rejects.toThrow();
        });
    });
});