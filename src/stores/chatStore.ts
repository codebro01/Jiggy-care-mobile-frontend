/**
 * Jiggy Care Mobile - Chat Store
 * Manages chat conversations and messages
 */

import { create } from 'zustand';
import { Message, Conversation, Patient } from '../types';

interface ChatState {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Message[];
    isTyping: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    setConversations: (conversations: Conversation[]) => void;
    setCurrentConversation: (conversation: Conversation | null) => void;
    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;
    updateMessageStatus: (messageId: string, status: Message['status']) => void;
    setTyping: (isTyping: boolean) => void;
    sendMessage: (content: string, type?: Message['type']) => Promise<void>;
    loadConversations: () => Promise<void>;
    loadMessages: (conversationId: string) => Promise<void>;
    markAsRead: (conversationId: string) => void;
    clearError: () => void;
}

// Mock data for development
const mockPatients: Patient[] = [
    {
        id: 'p1',
        firstName: 'Victor',
        lastName: 'Damilola',
        email: 'victor@example.com',
        phone: '+234 801 234 5678',
        gender: 'male',
    },
    {
        id: 'p2',
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah@example.com',
        phone: '+234 802 345 6789',
        gender: 'female',
    },
];

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    isTyping: false,
    isLoading: false,
    error: null,

    setConversations: (conversations) => set({ conversations }),

    setCurrentConversation: (conversation) => set({ currentConversation: conversation }),

    setMessages: (messages) => set({ messages }),

    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message],
    })),

    updateMessageStatus: (messageId, status) => set((state) => ({
        messages: state.messages.map(msg =>
            msg.id === messageId ? { ...msg, status } : msg
        ),
    })),

    setTyping: (isTyping) => set({ isTyping }),

    sendMessage: async (content, type = 'text') => {
        const { currentConversation, addMessage, updateMessageStatus } = get();
        if (!currentConversation) return;

        const tempId = `temp-${Date.now()}`;
        const newMessage: Message = {
            id: tempId,
            conversationId: currentConversation.id,
            senderId: 'current-user', // Will be replaced with actual user ID
            content,
            type,
            status: 'sending',
            createdAt: new Date().toISOString(),
        };

        addMessage(newMessage);

        try {
            // TODO: Replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 500));
            updateMessageStatus(tempId, 'sent');

            // Simulate delivery after a short delay
            setTimeout(() => {
                updateMessageStatus(tempId, 'delivered');
            }, 1000);
        } catch (error) {
            set({ error: 'Failed to send message' });
        }
    },

    loadConversations: async () => {
        set({ isLoading: true, error: null });
        try {
            // TODO: Replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 500));

            // Mock conversations will be generated from appointments
            set({ isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load conversations',
                isLoading: false
            });
        }
    },

    loadMessages: async (conversationId) => {
        set({ isLoading: true, error: null });
        try {
            // TODO: Replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 500));

            // Mock messages
            const mockMessages: Message[] = [
                {
                    id: 'm1',
                    conversationId,
                    senderId: 'p1',
                    content: 'Hello Doctor, I have been experiencing headaches for the past few days.',
                    type: 'text',
                    status: 'read',
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                },
                {
                    id: 'm2',
                    conversationId,
                    senderId: 'current-user',
                    content: 'Hello! I understand. Can you describe the type of headache? Is it constant or does it come and go?',
                    type: 'text',
                    status: 'read',
                    createdAt: new Date(Date.now() - 3500000).toISOString(),
                },
                {
                    id: 'm3',
                    conversationId,
                    senderId: 'p1',
                    content: 'It comes and goes, mostly in the evening. Sometimes I feel nauseous too.',
                    type: 'text',
                    status: 'read',
                    createdAt: new Date(Date.now() - 3400000).toISOString(),
                },
            ];

            set({ messages: mockMessages, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load messages',
                isLoading: false
            });
        }
    },

    markAsRead: (conversationId) => set((state) => ({
        conversations: state.conversations.map(conv =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        ),
    })),

    clearError: () => set({ error: null }),
}));
