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
    typingUserId: string | null;
    isLoading: boolean;
    error: string | null;
    isSocketConnected: boolean;

    // Actions
    connectSocket: () => Promise<void>;
    disconnectSocket: () => void;
    setConversations: (conversations: Conversation[]) => void;
    setCurrentConversation: (conversation: Conversation | null) => Promise<void>;
    setMessages: (messages: Message[]) => void;
    addMessage: (message: Message) => void;
    updateMessageStatus: (messageId: string, status: Message['isRead']) => void;
    setTyping: (isTyping: boolean) => void;
    startTyping: () => void;
    stopTyping: () => void;
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
    typingUserId: null,
    isLoading: false,
    error: null,
    isSocketConnected: false,

    connectSocket: async () => {
        const user = useAuthStore.getState().user;
        if (!user) {
            console.error('No user found, cannot connect socket');
            return;
        }

        try {
            const tokens = useAuthStore.getState().tokens; // Get token from auth store
            await socketService.connect(tokens?.accessToken || '');

            // Listen for incoming messages
            socketService.onMessage((payload) => {
                // console.log('📨 Received message:', payload);

                // Extract the actual message from the nested structure
                // Backend sends: { conversation: {...}, message: {...} }
                const message = payload.message || payload;

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
                // console.log('✅ Messages marked as read:', data);
                set((state) => ({
                    messages: state.messages.map(msg =>
                        data.messageIds.includes(msg.id)
                            ? { ...msg, isRead: true }
                            : msg
                    ),
                }));
            });

            // Listen for typing events
            socketService.onUserTyping((data) => {
                console.log('⌨️ User typing:', data);
                if (data.userId !== user.id) {
                    set({ isTyping: true, typingUserId: data.userId });
                }
            });

            socketService.onUserStoppedTyping((data) => {
                console.log('⌨️ User stopped typing:', data);
                if (data.userId !== user.id) {
                    set({ isTyping: false, typingUserId: null });
                }
            });

            set({ isSocketConnected: true });
        } catch (error) {
            console.error('Socket connection failed:', error);
            set({ error: 'Failed to connect to chat server' });
            throw error; // Rethrow so component can handle it
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

    addMessage: (message) => set((state) => {
        // Check for duplicates by ID
        const existingById = state.messages.find(msg => msg.id === message.id);
        if (existingById) {
            console.log('⚠️ Duplicate message by ID, skipping:', message.id);
            return state;
        }

        // Check for optimistic message duplicates (temp IDs)
        // If we have a temp message with same content sent within 5 seconds, replace it
        const tempMessage = state.messages.find(msg =>
            msg.id.startsWith('temp-') &&
            msg.content === message.content &&
            msg.senderId === message.senderId &&
            Math.abs(new Date(msg.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5000
        );

        if (tempMessage) {
            console.log('🔄 Replacing temp message with confirmed message');
            return {
                messages: state.messages.map(msg =>
                    msg.id === tempMessage.id ? message : msg
                ),
            };
        }

        return { messages: [...state.messages, message] };
    }),

    updateMessageStatus: (messageId, status) => set((state) => ({
        messages: state.messages.map(msg =>
            msg.id === messageId ? { ...msg, status } : msg
        ),
    })),

    setTyping: (isTyping) => set({ isTyping }),

    startTyping: () => {
        const { currentConversation } = get();
        const user = useAuthStore.getState().user;

        if (!currentConversation || !user) return;

        socketService.emitTypingStart({
            conversationId: currentConversation.id,
            userId: user.id,
            userType: user.role || 'consultant',
        });
    },

    stopTyping: () => {
        const { currentConversation } = get();
        const user = useAuthStore.getState().user;

        if (!currentConversation || !user) return;

        socketService.emitTypingStop({
            conversationId: currentConversation.id,
            userId: user.id,
        });
    },

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
                senderType: 'consultant',
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

        // console.log('📖 Marking messages as read:', { conversationId, messageIds });

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