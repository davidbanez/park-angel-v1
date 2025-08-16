import { UserId } from './value-objects';
export class Message {
    constructor(id, conversationId, senderId, receiverId, content, type, isEncrypted, status, createdAt = new Date(), readAt, editedAt, deletedAt, attachments = []) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "conversationId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: conversationId
        });
        Object.defineProperty(this, "senderId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: senderId
        });
        Object.defineProperty(this, "receiverId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: receiverId
        });
        Object.defineProperty(this, "content", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: content
        });
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: type
        });
        Object.defineProperty(this, "isEncrypted", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: isEncrypted
        });
        Object.defineProperty(this, "status", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: status
        });
        Object.defineProperty(this, "createdAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: createdAt
        });
        Object.defineProperty(this, "readAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: readAt
        });
        Object.defineProperty(this, "editedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: editedAt
        });
        Object.defineProperty(this, "deletedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: deletedAt
        });
        Object.defineProperty(this, "attachments", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: attachments
        });
    }
    static create(data) {
        return new Message(UserId.generate().value, data.conversationId, data.senderId, data.receiverId, data.content, data.type, data.isEncrypted || false, MessageStatus.SENT, new Date(), undefined, undefined, undefined, data.attachments || []);
    }
    markAsRead() {
        if (this.status === MessageStatus.SENT ||
            this.status === MessageStatus.DELIVERED) {
            this.status = MessageStatus.READ;
            this.readAt = new Date();
        }
    }
    markAsDelivered() {
        if (this.status === MessageStatus.SENT) {
            this.status = MessageStatus.DELIVERED;
        }
    }
    edit(newContent) {
        if (this.isDeleted()) {
            throw new Error('Cannot edit deleted message');
        }
        this.content = newContent;
        this.editedAt = new Date();
    }
    delete() {
        this.status = MessageStatus.DELETED;
        this.deletedAt = new Date();
    }
    addAttachment(attachment) {
        this.attachments.push(attachment);
    }
    removeAttachment(attachmentId) {
        this.attachments = this.attachments.filter(a => a.id !== attachmentId);
    }
    isRead() {
        return this.status === MessageStatus.READ;
    }
    isDelivered() {
        return (this.status === MessageStatus.DELIVERED ||
            this.status === MessageStatus.READ);
    }
    isDeleted() {
        return this.status === MessageStatus.DELETED;
    }
    isEdited() {
        return this.editedAt !== undefined;
    }
    canBeEditedBy(userId) {
        return this.senderId.equals(userId) && !this.isDeleted();
    }
    canBeDeletedBy(userId) {
        return this.senderId.equals(userId) && !this.isDeleted();
    }
    getDisplayContent() {
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
    constructor(id, participants, type, lastMessage, isActive = true, createdAt = new Date(), updatedAt = new Date(), metadata = {}) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "participants", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: participants
        });
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: type
        });
        Object.defineProperty(this, "lastMessage", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: lastMessage
        });
        Object.defineProperty(this, "isActive", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: isActive
        });
        Object.defineProperty(this, "createdAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: createdAt
        });
        Object.defineProperty(this, "updatedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: updatedAt
        });
        Object.defineProperty(this, "metadata", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: metadata
        });
    }
    static create(data) {
        return new Conversation(UserId.generate().value, data.participants, data.type, undefined, true, new Date(), new Date(), data.metadata || {});
    }
    addParticipant(userId) {
        if (!this.participants.some(p => p.equals(userId))) {
            this.participants.push(userId);
            this.updatedAt = new Date();
        }
    }
    removeParticipant(userId) {
        this.participants = this.participants.filter(p => !p.equals(userId));
        this.updatedAt = new Date();
    }
    updateLastMessage(message) {
        this.lastMessage = message;
        this.updatedAt = new Date();
    }
    archive() {
        this.isActive = false;
        this.updatedAt = new Date();
    }
    unarchive() {
        this.isActive = true;
        this.updatedAt = new Date();
    }
    isParticipant(userId) {
        return this.participants.some(p => p.equals(userId));
    }
    getOtherParticipants(userId) {
        return this.participants.filter(p => !p.equals(userId));
    }
    updateMetadata(metadata) {
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
    constructor(id, messageId, fileName, fileType, fileSize, url, thumbnailUrl, createdAt = new Date()) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "messageId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: messageId
        });
        Object.defineProperty(this, "fileName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: fileName
        });
        Object.defineProperty(this, "fileType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: fileType
        });
        Object.defineProperty(this, "fileSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: fileSize
        });
        Object.defineProperty(this, "url", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: url
        });
        Object.defineProperty(this, "thumbnailUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: thumbnailUrl
        });
        Object.defineProperty(this, "createdAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: createdAt
        });
    }
    static create(data) {
        return new MessageAttachment(UserId.generate().value, data.messageId, data.fileName, data.fileType, data.fileSize, data.url, data.thumbnailUrl, new Date());
    }
    isImage() {
        return this.fileType.startsWith('image/');
    }
    isVideo() {
        return this.fileType.startsWith('video/');
    }
    isDocument() {
        return (this.fileType.startsWith('application/') ||
            this.fileType.startsWith('text/'));
    }
    getFileSizeFormatted() {
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
    constructor(id, conversationId, parentMessageId, messages = [], createdAt = new Date(), updatedAt = new Date()) {
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: id
        });
        Object.defineProperty(this, "conversationId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: conversationId
        });
        Object.defineProperty(this, "parentMessageId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: parentMessageId
        });
        Object.defineProperty(this, "messages", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: messages
        });
        Object.defineProperty(this, "createdAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: createdAt
        });
        Object.defineProperty(this, "updatedAt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: updatedAt
        });
    }
    static create(data) {
        return new MessageThread(UserId.generate().value, data.conversationId, data.parentMessageId, [], new Date(), new Date());
    }
    addMessage(message) {
        this.messages.push(message);
        this.updatedAt = new Date();
    }
    getMessageCount() {
        return this.messages.length;
    }
    getLastMessage() {
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
    static encrypt(content) {
        // Simple encryption implementation - in production, use proper encryption
        // This is a placeholder for actual encryption logic
        return Buffer.from(content).toString('base64');
    }
    static decrypt(encryptedContent) {
        // Simple decryption implementation - in production, use proper decryption
        // This is a placeholder for actual decryption logic
        return Buffer.from(encryptedContent, 'base64').toString('utf-8');
    }
}
// Enums
export var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["IMAGE"] = "image";
    MessageType["FILE"] = "file";
    MessageType["SYSTEM"] = "system";
    MessageType["BOOKING_UPDATE"] = "booking_update";
    MessageType["PAYMENT_NOTIFICATION"] = "payment_notification";
})(MessageType || (MessageType = {}));
export var MessageStatus;
(function (MessageStatus) {
    MessageStatus["SENT"] = "sent";
    MessageStatus["DELIVERED"] = "delivered";
    MessageStatus["READ"] = "read";
    MessageStatus["DELETED"] = "deleted";
})(MessageStatus || (MessageStatus = {}));
export var ConversationType;
(function (ConversationType) {
    ConversationType["USER_HOST"] = "user_host";
    ConversationType["USER_OPERATOR"] = "user_operator";
    ConversationType["USER_SUPPORT"] = "user_support";
    ConversationType["GROUP"] = "group";
    ConversationType["SYSTEM"] = "system";
})(ConversationType || (ConversationType = {}));
