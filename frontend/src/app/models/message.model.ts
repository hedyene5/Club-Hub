export interface ReactionDTO {
    id: string;
    messageId: string;
    userId: string;
    emoji: 'LIKE' | 'LOVE' | 'HAHA' | 'NOTBAD' | 'GREATJOB';
}


// src/app/models/message.model.ts
export interface MessageDTO {
    id: string;
    conversationId: string;
    senderId: string;
    senderName?: string;           // ← optional
    content: string;
    type?: string;
    parentMessageId?: string;
    createdAt: string;             // backend uses createdAt
    edited?: boolean;
    deleted?: boolean;
    parentMessageContent?: string;
    reactions?: ReactionDTO[];
}

// Keep alias for compatibility
export type ChatMessage = MessageDTO;