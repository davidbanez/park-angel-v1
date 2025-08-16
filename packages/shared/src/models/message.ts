import { UserId } from './value-objects';
import { MessageType, MessageStatus, ConversationType, MESSAGE_STATUS } from '../types/common';

export class Message {
  constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly senderId: UserId,
    public readonly receiverId: UserId,
    public content: string,
    public readonly type: MessageType,
    public isEncrypted: boolean,
    public status: MessageStatus,
    public readonly createdAt: Date = new Date(),
    public readAt?: Date,
    public editedAt?: Date,
    public deletedAt?: Date,
    public attachments: MessageAttachment[] = []
  ) {}

  static create(data: CreateMessageData): Message {
    return new Message(
      UserId.generate().value,
      data.conversationId,
      data.senderId,
      data.receiverId,
      data.content,
      data.type,
      data.isEncrypted || false,
      MESSAGE_STATUS.SENT,
      new Date(),
      undefined,
      undefined,
      undefined,
      data.attachments || []
    );
  }

  markAsRead(): void {
    if (
      this.status === MESSAGE_STATUS.SENT ||
      this.status === MESSAGE_STATUS.DELIVERED
    ) {
      this.status = MESSAGE_STATUS.READ;
      this.readAt = new Date();
    }
  }

  markAsDelivered(): void {
    if (this.status === MESSAGE_STATUS.SENT) {
      this.status = MESSAGE_STATUS.DELIVERED;
    }
  }

  edit(newContent: string): void {
    if (this.isDeleted()) {
      throw new Error('Cannot edit deleted message');
    }

    this.content = newContent;
    this.editedAt = new Date();
  }

  delete(): void {
    this.status = MESSAGE_STATUS.DELETED;
    this.deletedAt = new Date();
  }

  addAttachment(attachment: MessageAttachment): void {
    this.attachments.push(attachment);
  }

  removeAttachment(attachmentId: string): void {
    this.attachments = this.attachments.filter(a => a.id !== attachmentId);
  }

  isRead(): boolean {
    return this.status === MESSAGE_STATUS.READ;
  }

  isDelivered(): boolean {
    return (
      this.status === MESSAGE_STATUS.DELIVERED ||
      this.status === MESSAGE_STATUS.READ
    );
  }

  isDeleted(): boolean {
    return this.status === MESSAGE_STATUS.DELETED;
  }

  isEdited(): boolean {
    return this.editedAt !== undefined;
  }

  canBeEditedBy(userId: UserId): boolean {
    return this.senderId.equals(userId) && !this.isDeleted();
  }

  canBeDeletedBy(userId: UserId): boolean {
    return this.senderId.equals(userId) && !this.isDeleted();
  }

  getDisplayContent(): string {
    if (this.isDeleted()) {
      return '[Message deleted]';
    }
    return this.content;
  }

  toJSON() {
    return {
      id: this.id,
      conversationId: this.conversationId,
      senderId: this.senderId.value,
      receiverId: this.receiverId.value,
      content: this.getDisplayContent(),
      type: this.type,
      isEncrypted: this.isEncrypted,
      status: this.status,
      createdAt: this.createdAt,
      readAt: this.readAt,
      editedAt: this.editedAt,
      deletedAt: this.deletedAt,
      attachments: this.attachments.map(a => a.toJSON()),
    };
  }
}

export class Conversation {
  constructor(
    public readonly id: string,
    public participants: UserId[],
    public readonly type: ConversationType,
    public lastMessage?: Message,
    public isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public metadata: ConversationMetadata = {}
  ) {}

  static create(data: CreateConversationData): Conversation {
    return new Conversation(
      UserId.generate().value,
      data.participants,
      data.type,
      undefined,
      true,
      new Date(),
      new Date(),
      data.metadata || {}
    );
  }

  addParticipant(userId: UserId): void {
    if (!this.participants.some(p => p.equals(userId))) {
      this.participants.push(userId);
      this.updatedAt = new Date();
    }
  }

  removeParticipant(userId: UserId): void {
    this.participants = this.participants.filter(p => !p.equals(userId));
    this.updatedAt = new Date();
  }

  updateLastMessage(message: Message): void {
    this.lastMessage = message;
    this.updatedAt = new Date();
  }

  archive(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  unarchive(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  isParticipant(userId: UserId): boolean {
    return this.participants.some(p => p.equals(userId));
  }

  getOtherParticipants(userId: UserId): UserId[] {
    return this.participants.filter(p => !p.equals(userId));
  }

  updateMetadata(metadata: Partial<ConversationMetadata>): void {
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      participants: this.participants.map(p => p.value),
      type: this.type,
      lastMessage: this.lastMessage?.toJSON(),
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata,
    };
  }
}

export class MessageAttachment {
  constructor(
    public readonly id: string,
    public readonly messageId: string,
    public readonly fileName: string,
    public readonly fileType: string,
    public readonly fileSize: number,
    public readonly url: string,
    public readonly thumbnailUrl?: string,
    public readonly createdAt: Date = new Date()
  ) {}

  static create(data: CreateMessageAttachmentData): MessageAttachment {
    return new MessageAttachment(
      UserId.generate().value,
      data.messageId,
      data.fileName,
      data.fileType,
      data.fileSize,
      data.url,
      data.thumbnailUrl,
      new Date()
    );
  }

  isImage(): boolean {
    return this.fileType.startsWith('image/');
  }

  isVideo(): boolean {
    return this.fileType.startsWith('video/');
  }

  isDocument(): boolean {
    return (
      this.fileType.startsWith('application/') ||
      this.fileType.startsWith('text/')
    );
  }

  getFileSizeFormatted(): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this.fileSize;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  toJSON() {
    return {
      id: this.id,
      messageId: this.messageId,
      fileName: this.fileName,
      fileType: this.fileType,
      fileSize: this.fileSize,
      fileSizeFormatted: this.getFileSizeFormatted(),
      url: this.url,
      thumbnailUrl: this.thumbnailUrl,
      isImage: this.isImage(),
      isVideo: this.isVideo(),
      isDocument: this.isDocument(),
      createdAt: this.createdAt,
    };
  }
}

export class MessageThread {
  constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly parentMessageId: string,
    public messages: Message[] = [],
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(data: CreateMessageThreadData): MessageThread {
    return new MessageThread(
      UserId.generate().value,
      data.conversationId,
      data.parentMessageId,
      [],
      new Date(),
      new Date()
    );
  }

  addMessage(message: Message): void {
    this.messages.push(message);
    this.updatedAt = new Date();
  }

  getMessageCount(): number {
    return this.messages.length;
  }

  getLastMessage(): Message | undefined {
    return this.messages[this.messages.length - 1];
  }

  toJSON() {
    return {
      id: this.id,
      conversationId: this.conversationId,
      parentMessageId: this.parentMessageId,
      messages: this.messages.map(m => m.toJSON()),
      messageCount: this.getMessageCount(),
      lastMessage: this.getLastMessage()?.toJSON(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

// Message encryption utilities
export class MessageEncryption {
  static encrypt(content: string): string {
    // Simple encryption implementation - in production, use proper encryption
    // This is a placeholder for actual encryption logic
    return Buffer.from(content).toString('base64');
  }

  static decrypt(encryptedContent: string): string {
    // Simple decryption implementation - in production, use proper decryption
    // This is a placeholder for actual decryption logic
    return Buffer.from(encryptedContent, 'base64').toString('utf-8');
  }
}

// Enums - now imported from common types for consistency

// Data Transfer Objects
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
