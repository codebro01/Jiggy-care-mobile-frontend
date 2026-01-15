// services/socket.service.ts
import { io, Socket } from 'socket.io-client';

const BASE_URL = 'https://jiggy-care.onrender.com';

class SocketService {


    private socket: Socket | null = null;
    private listeners: Map<string, ((...args: any[]) => void)[]> = new Map();
    private connectionPromise: Promise<void> | null = null;

    private removeAllListeners(event: string) {
        if (!this.socket) return;

        const callbacks = this.listeners.get(event) || [];
        callbacks.forEach(callback => {
            this.socket!.off(event, callback);
        });
        this.listeners.delete(event);
    }



    connect(token: string) {
        if (this.socket?.connected) {
            console.log('✅ Socket already connected');
            return Promise.resolve();
        }

        if (this.connectionPromise) {
            return this.connectionPromise;
        }


        this.removeAllListeners('receive_message');
        this.removeAllListeners('new_message');
        this.removeAllListeners('messages_read');

        this.connectionPromise = new Promise((resolve, reject) => {
            // FIX: Use parentheses () not backticks ``
            // Also remove /api if BASE_URL includes it
            const socketUrl = `${BASE_URL}/chat`;
            console.log('🔌 Connecting to:', socketUrl);

            this.socket = io(socketUrl, {
                auth: { token },
                transports: ['websocket', 'polling'], // Add polling as fallback
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                timeout: 10000,
            });

            this.socket.on('connect', () => {
                console.log('✅ Socket connected:', this.socket?.id);
                this.connectionPromise = null;
                resolve();
            });

            this.socket.on('disconnect', (reason) => {
                console.log('❌ Socket disconnected:', reason);
                this.connectionPromise = null;
            });

            this.socket.on('connect_error', (error) => {
                console.error('❌ Socket connection error:', error.message);
                this.connectionPromise = null;
                reject(error);
            });

            // Timeout
            setTimeout(() => {
                if (!this.socket?.connected) {
                    const error = new Error('Socket connection timeout');
                    console.error('❌ Connection timeout');
                    this.connectionPromise = null;
                    reject(error);
                }
            }, 10000);
        });

        return this.connectionPromise;
    }

    async ensureConnected() {
        if (!this.socket?.connected) {
            throw new Error('Socket not connected');
        }
    }

    async joinConversation(conversationId: string, userId: string, userType: 'patient' | 'consultant') {
        await this.ensureConnected();

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Join conversation timeout'));
            }, 10000);

            console.log('📤 Emitting join_conversation:', { conversationId, userId, userType });

            this.socket!.emit('join_conversation', {
                conversationId,
                userId,
                userType,
            });

            this.socket!.once('joined_conversation', (data) => {
                clearTimeout(timeout);
                console.log('✅ Joined conversation:', data);
                resolve(data);
            });

            this.socket!.once('error', (error) => {
                clearTimeout(timeout);
                console.error('❌ Join conversation error:', error);
                reject(error);
            });
        });
    }

    async sendMessage(payload: {
        conversationId: string;
        consultantId?: string;
        patientId?: string;
        content: string;
        senderType: 'consultant';
    }) {
        await this.ensureConnected();

        console.log('📤 Sending message:', payload);
        this.socket!.emit('send_message', payload);
    }

    onMessage(callback: (message: any) => void) {
        if (!this.socket) {
            console.warn('⚠️ Socket not initialized');
            return;
        }

        console.log('👂 Listening for messages...');

        // Listen for both 'receive_message' and 'new_message' events
        this.socket.on('receive_message', callback);
        this.socket.on('new_message', callback);

        if (!this.listeners.has('receive_message')) {
            this.listeners.set('receive_message', []);
        }
        this.listeners.get('receive_message')!.push(callback);

        if (!this.listeners.has('new_message')) {
            this.listeners.set('new_message', []);
        }
        this.listeners.get('new_message')!.push(callback);
    }

    offMessage(callback: (message: any) => void) {
        if (!this.socket) return;
        this.socket.off('receive_message', callback);
        this.socket.off('new_message', callback);
    }

    markAsRead(data: { conversationId: string, messageIds: string[] }) {
        this.socket!.emit('mark_read', data);
    }

    // services/socket.service.ts

    onMessagesRead(callback: (data: { conversationId: string; messageIds: string[] }) => void) {
        if (!this.socket) {
            console.warn('⚠️ Socket not initialized');
            return;
        }

        console.log('👂 Listening for messages_read...');
        this.socket.on('messages_read', callback);

        if (!this.listeners.has('messages_read')) {
            this.listeners.set('messages_read', []);
        }
        this.listeners.get('messages_read')!.push(callback);
    }

    offMessagesRead(callback: (data: any) => void) {
        if (!this.socket) return;
        this.socket.off('messages_read', callback);
    }

    // Typing indicators
    emitTypingStart(data: { conversationId: string; userId: string; userType: string }) {
        if (!this.socket) {
            console.warn('⚠️ Socket not initialized');
            return;
        }
        console.log('⌨️ Emitting typing_start:', data);
        this.socket.emit('typing_start', data);
    }

    emitTypingStop(data: { conversationId: string; userId: string }) {
        if (!this.socket) {
            console.warn('⚠️ Socket not initialized');
            return;
        }
        console.log('⌨️ Emitting typing_stop:', data);
        this.socket.emit('typing_stop', data);
    }

    onUserTyping(callback: (data: { userId: string; userType: string }) => void) {
        if (!this.socket) {
            console.warn('⚠️ Socket not initialized');
            return;
        }

        console.log('👂 Listening for user_typing...');
        this.socket.on('user_typing', callback);

        if (!this.listeners.has('user_typing')) {
            this.listeners.set('user_typing', []);
        }
        this.listeners.get('user_typing')!.push(callback);
    }

    offUserTyping(callback: (data: any) => void) {
        if (!this.socket) return;
        this.socket.off('user_typing', callback);
    }

    onUserStoppedTyping(callback: (data: { userId: string }) => void) {
        if (!this.socket) {
            console.warn('⚠️ Socket not initialized');
            return;
        }

        console.log('👂 Listening for user_stopped_typing...');
        this.socket.on('user_stopped_typing', callback);

        if (!this.listeners.has('user_stopped_typing')) {
            this.listeners.set('user_stopped_typing', []);
        }
        this.listeners.get('user_stopped_typing')!.push(callback);
    }

    offUserStoppedTyping(callback: (data: any) => void) {
        if (!this.socket) return;
        this.socket.off('user_stopped_typing', callback);
    }

    disconnect() {
        if (this.socket) {
            console.log('🔌 Disconnecting socket...');
            this.socket.disconnect();
            this.socket = null;
            this.listeners.clear();
            this.connectionPromise = null;
        }
    }

    isConnected() {
        return this.socket?.connected || false;
    }
}

export const socketService = new SocketService();