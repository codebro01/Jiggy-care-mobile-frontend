// stores/chatStore.ts
import { create } from 'zustand';
import { Message, Conversation } from '../types';
import { socketService } from '../services/socket.service';
import { useAuthStore } from './authStore';
import { chatService } from '@/services/chat.service';

interface ChatState {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Message[];
    isTyping: boolean;
    isLoading: boolean;
    error: string | null;
    isSocketConnected: boolean;

    // Actions
    connectSocket: () => void;
    disconnectSocket: () => void;
    setConversations: (conversations: Conversation[]) => void;
    setCurrentConversation: (conversation: Conversation | null) => Promise<void>;
    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;
    updateMessageStatus: (messageId: string, status: Message['isRead']) => void;
    setTyping: (isTyping: boolean) => void;
    sendMessage: (content: string, type?: Message['type']) => Promise<void>;
    loadConversations: () => Promise<void>;
    loadMessages: (conversationId: string) => Promise<void>;
    markAsRead: (conversationId: string, messageIds: string[]) => void;
    clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    isTyping: false,
    isLoading: false,
    error: null,
    isSocketConnected: false,

    connectSocket: () => {
        const user = useAuthStore.getState().user;
        if (!user) {
            console.error('No user found, cannot connect socket');
            return;
        }

        try {
            const tokens = useAuthStore.getState().tokens; // Get token from auth store
            socketService.connect(tokens?.accessToken || '');

            // Listen for incoming messages
            socketService.onMessage((message) => {
                console.log('📨 Received message:', message);
                get().addMessage(message);

                const { currentConversation } = get();
                if (currentConversation?.id === message.conversationId &&
                    message.senderId !== user.id) {
                    // Mark this message as read after a short delay
                    setTimeout(() => {
                        get().markAsRead(message.conversationId, [message.id]);
                    }, 1000);
                }
            });

            socketService.onMessagesRead((data) => {
                console.log('✅ Messages marked as read:', data);
                set((state) => ({
                    messages: state.messages.map(msg =>
                        data.messageIds.includes(msg.id)
                            ? { ...msg, status: 'read' }
                            : msg
                    ),
                }));
            });

            set({ isSocketConnected: true });
        } catch (error) {
            console.error('Socket connection failed:', error);
            set({ error: 'Failed to connect to chat server' });
        }
    },

    disconnectSocket: () => {
        socketService.disconnect();
        set({ isSocketConnected: false });
    },

    setConversations: (conversations) => set({ conversations }),

    setCurrentConversation: async (conversation) => {
        if (!conversation) {
            set({ currentConversation: null });
            return;
        }

        // Just set the conversation, don't join here
        // Let the screen handle joining
        set({ currentConversation: conversation });
    },

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
        const user = useAuthStore.getState().user;

        if (!currentConversation || !user) {
            set({ error: 'No active conversation or user' });
            return;
        }

        const tempId = `temp-${Date.now()}`;
        const newMessage: Message = {
            id: tempId,
            conversationId: currentConversation.id,
            senderId: user.id,
            content,
            type,
            isRead: false,
            createdAt: new Date().toISOString(),
        };

        // Optimistically add message to UI
        addMessage(newMessage);

        try {
            // Send message via WebSocket
            await socketService.sendMessage({
                conversationId: currentConversation.id,
                consultantId: user.role === 'consultant' ? user.id : currentConversation.consultantId,
                patientId: user.role === 'patient' ? user.id : currentConversation.patientId,
                content,
                senderType:  'consultant',
            });

            console.log('✅ Message sent successfully');

            // Update status to sent
            updateMessageStatus(tempId, true);

            // The backend should emit 'receive_message' back to confirm
            // You might want to update the status when you receive confirmation
        } catch (error) {
            console.error('❌ Failed to send message:', error);
            updateMessageStatus(tempId, false);
            set({ error: 'Failed to send message' });
        }
    },

    loadConversations: async () => {
        set({ isLoading: true, error: null });
        try {
            // TODO: Load from API
            await new Promise(resolve => setTimeout(resolve, 500));
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
            // Load previous messages from HTTP API
            const response = await chatService.loadMessages(conversationId, 50, 0);

            const messages = response.messages || []; // Adjust based on your API response structure

            set({ messages, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load messages',
                isLoading: false
            });
        }
    },

    markAsRead: (conversationId: string, messageIds: string[]) => {
        if (messageIds.length === 0) return;

        console.log('📖 Marking messages as read:', { conversationId, messageIds });

        // Emit to backend
        socketService.markAsRead({ conversationId, messageIds });

        // Optimistically update local state
        set((state) => ({
            messages: state.messages.map(msg =>
                messageIds.includes(msg.id)
                    ? { ...msg, status: 'read' }
                    : msg
            ),
            conversations: state.conversations.map(conv =>
                conv.id === conversationId
                    ? { ...conv, unreadCount: Math.max(0, (conv.unreadCount || 0) - messageIds.length) }
                    : conv
            ),
        }));
    },

    clearError: () => set({ error: null }),
}));