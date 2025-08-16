import { UserId } from './value-objects';
import { MessageType, MessageStatus, ConversationType } from '../types/common';
export declare class Message {
    readonly id: string;
    readonly conversationId: string;
    readonly senderId: UserId;
    readonly receiverId: UserId;
    content: string;
    readonly type: MessageType;
    isEncrypted: boolean;
    status: MessageStatus;
    readonly createdAt: Date;
    readAt?: Date | undefined;
    editedAt?: Date | undefined;
    deletedAt?: Date | undefined;
    attachments: MessageAttachment[];
    constructor(id: string, conversationId: string, senderId: UserId, receiverId: UserId, content: string, type: MessageType, isEncrypted: boolean, status: MessageStatus, createdAt?: Date, readAt?: Date | undefined, editedAt?: Date | undefined, deletedAt?: Date | undefined, attachments?: MessageAttachment[]);
    static create(data: CreateMessageData): Message;
    markAsRead(): void;
    markAsDelivered(): void;
    edit(newContent: string): void;
    delete(): void;
    addAttachment(attachment: MessageAttachment): void;
    removeAttachment(attachmentId: string): void;
    isRead(): boolean;
    isDelivered(): boolean;
    isDeleted(): boolean;
    isEdited(): boolean;
    canBeEditedBy(userId: UserId): boolean;
    canBeDeletedBy(userId: UserId): boolean;
    getDisplayContent(): string;
    toJSON(): {
        id: string;
        conversationId: string;
        senderId: string;
        receiverId: string;
        content: string;
        type: MessageType;
        isEncrypted: boolean;
        status: MessageStatus;
        createdAt: Date;
        readAt: Date | undefined;
        editedAt: Date | undefined;
        deletedAt: Date | undefined;
        attachments: {
            id: string;
            messageId: string;
            fileName: string;
            fileType: string;
            fileSize: number;
            fileSizeFormatted: string;
            url: string;
            thumbnailUrl: string | undefined;
            isImage: boolean;
            isVideo: boolean;
            isDocument: boolean;
            createdAt: Date;
        }[];
    };
}
export declare class Conversation {
    readonly id: string;
    participants: UserId[];
    readonly type: ConversationType;
    lastMessage?: Message | undefined;
    isActive: boolean;
    readonly createdAt: Date;
    updatedAt: Date;
    metadata: ConversationMetadata;
    constructor(id: string, participants: UserId[], type: ConversationType, lastMessage?: Message | undefined, isActive?: boolean, createdAt?: Date, updatedAt?: Date, metadata?: ConversationMetadata);
    static create(data: CreateConversationData): Conversation;
    addParticipant(userId: UserId): void;
    removeParticipant(userId: UserId): void;
    updateLastMessage(message: Message): void;
    archive(): void;
    unarchive(): void;
    isParticipant(userId: UserId): boolean;
    getOtherParticipants(userId: UserId): UserId[];
    updateMetadata(metadata: Partial<ConversationMetadata>): void;
    toJSON(): {
        id: string;
        participants: string[];
        type: ConversationType;
        lastMessage: {
            id: string;
            conversationId: string;
            senderId: string;
            receiverId: string;
            content: string;
            type: MessageType;
            isEncrypted: boolean;
            status: MessageStatus;
            createdAt: Date;
            readAt: Date | undefined;
            editedAt: Date | undefined;
            deletedAt: Date | undefined;
            attachments: {
                id: string;
                messageId: string;
                fileName: string;
                fileType: string;
                fileSize: number;
                fileSizeFormatted: string;
                url: string;
                thumbnailUrl: string | undefined;
                isImage: boolean;
                isVideo: boolean;
                isDocument: boolean;
                createdAt: Date;
            }[];
        } | undefined;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        metadata: ConversationMetadata;
    };
}
export declare class MessageAttachment {
    readonly id: string;
    readonly messageId: string;
    readonly fileName: string;
    readonly fileType: string;
    readonly fileSize: number;
    readonly url: string;
    readonly thumbnailUrl?: string | undefined;
    readonly createdAt: Date;
    constructor(id: string, messageId: string, fileName: string, fileType: string, fileSize: number, url: string, thumbnailUrl?: string | undefined, createdAt?: Date);
    static create(data: CreateMessageAttachmentData): MessageAttachment;
    isImage(): boolean;
    isVideo(): boolean;
    isDocument(): boolean;
    getFileSizeFormatted(): string;
    toJSON(): {
        id: string;
        messageId: string;
        fileName: string;
        fileType: string;
        fileSize: number;
        fileSizeFormatted: string;
        url: string;
        thumbnailUrl: string | undefined;
        isImage: boolean;
        isVideo: boolean;
        isDocument: boolean;
        createdAt: Date;
    };
}
export declare class MessageThread {
    readonly id: string;
    readonly conversationId: string;
    readonly parentMessageId: string;
    messages: Message[];
    readonly createdAt: Date;
    updatedAt: Date;
    constructor(id: string, conversationId: string, parentMessageId: string, messages?: Message[], createdAt?: Date, updatedAt?: Date);
    static create(data: CreateMessageThreadData): MessageThread;
    addMessage(message: Message): void;
    getMessageCount(): number;
    getLastMessage(): Message | undefined;
    toJSON(): {
        id: string;
        conversationId: string;
        parentMessageId: string;
        messages: {
            id: string;
            conversationId: string;
            senderId: string;
            receiverId: string;
            content: string;
            type: MessageType;
            isEncrypted: boolean;
            status: MessageStatus;
            createdAt: Date;
            readAt: Date | undefined;
            editedAt: Date | undefined;
            deletedAt: Date | undefined;
            attachments: {
                id: string;
                messageId: string;
                fileName: string;
                fileType: string;
                fileSize: number;
                fileSizeFormatted: string;
                url: string;
                thumbnailUrl: string | undefined;
                isImage: boolean;
                isVideo: boolean;
                isDocument: boolean;
                createdAt: Date;
            }[];
        }[];
        messageCount: number;
        lastMessage: {
            id: string;
            conversationId: string;
            senderId: string;
            receiverId: string;
            content: string;
            type: MessageType;
            isEncrypted: boolean;
            status: MessageStatus;
            createdAt: Date;
            readAt: Date | undefined;
            editedAt: Date | undefined;
            deletedAt: Date | undefined;
            attachments: {
                id: string;
                messageId: string;
                fileName: string;
                fileType: string;
                fileSize: number;
                fileSizeFormatted: string;
                url: string;
                thumbnailUrl: string | undefined;
                isImage: boolean;
                isVideo: boolean;
                isDocument: boolean;
                createdAt: Date;
            }[];
        } | undefined;
        createdAt: Date;
        updatedAt: Date;
    };
}
export declare class MessageEncryption {
    static encrypt(content: string): string;
    static decrypt(encryptedContent: string): string;
}
export interface CreateMessageData {
    conversationId: string;
    senderId: UserId;
    receiverId: UserId;
    content: string;
    type: MessageType;
    isEncrypted?: boolean;
    attachments?: MessageAttachment[];
}
export interface CreateConversationData {
    participants: UserId[];
    type: ConversationType;
    metadata?: ConversationMetadata;
}
export interface CreateMessageAttachmentData {
    messageId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
    thumbnailUrl?: string;
}
export interface CreateMessageThreadData {
    conversationId: string;
    parentMessageId: string;
}
export interface ConversationMetadata {
    bookingId?: string;
    locationId?: string;
    subject?: string;
    priority?: 'low' | 'medium' | 'high';
    tags?: string[];
    [key: string]: any;
}
