
/**
 * Jiggy Care Mobile - Chat Screen
 * Real-time chat with patient for appointment
 */

/**
 * Jiggy Care Mobile - Chat Screen
 * Real-time chat with patient for appointment
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert as RNAlert,
  Image,
  Linking,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { useAlert, Alert } from '@/components/alert';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'; // ✅ Import useSafeAreaInsets
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../../theme';
import { useChatStore } from '../../stores';
import { Avatar } from '../../components';
import { AppointmentsStackParamList, HomeStackParamList, RootStackParamList } from '../../navigation/types';
import { Message, Appointment } from '../../types';
import { chatService } from '@/services/chat.service';
import { socketService } from '@/services/socket.service';
import { useAuthStore } from '@/stores/authStore';
import { CallModal } from '@/components/CallModal';
import { useCallStore } from '@/stores/callStore';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import * as DocumentPicker from 'expo-document-picker';
import { uploadService } from '@/services/upload.service';

type ChatScreenNavigationProp =
  | NativeStackNavigationProp<AppointmentsStackParamList, 'Chat'>
  | NativeStackNavigationProp<HomeStackParamList, 'ChatScreen'>
  | NativeStackNavigationProp<RootStackParamList, 'ChatScreen'>;
type ChatScreenRouteProp =
  | RouteProp<AppointmentsStackParamList, 'Chat'>
  | RouteProp<HomeStackParamList, 'ChatScreen'>
  | RouteProp<RootStackParamList, 'ChatScreen'>;

interface Props {
  navigation: ChatScreenNavigationProp;
  route: ChatScreenRouteProp;
}

export function ChatScreen({ navigation, route }: Props) {
  const theme = useAppTheme();
  const params = route.params as any;
  const initialAppointment = params.appointment;
  const bookingIdParam = params.bookingId;
  const isIncomingParam = params.isIncoming;
  const callTypeParam = params.callType;
  const fromUserIdParam = params.fromUserId;

  const [appointment, setAppointment] = useState<Appointment | null>(initialAppointment || null);
  const { loadAppointments } = useAppointmentsStore();

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { alert, showSuccess, showError, showWarning, hideAlert } = useAlert();

  const {
    messages,
    isTyping,
    loadMessages,
    sendMessage,
    setCurrentConversation,
    currentConversation,
    connectSocket,
    isSocketConnected,
    startTyping,
    stopTyping,
  } = useChatStore();

  const user = useAuthStore((state) => state.user);

  const [inputText, setInputText] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<{
    uri: string;
    name: string;
    mimeType: string;
  } | null>(null);
  const sendButtonScale = useSharedValue(1);

  // Initialize conversation and WebSocket
  const insets = useSafeAreaInsets(); // ✅ Get safe area insets




  // Load appointment if coming from notification
  useEffect(() => {
    let active = true;
    if (!initialAppointment && bookingIdParam) {
      const fetchAppointment = async () => {
        try {
          setIsConnecting(true);
          let found = useAppointmentsStore.getState().appointments.find(a => a.bookingId === bookingIdParam);
          if (!found) {
            await loadAppointments();
            if (!active) return;
            found = useAppointmentsStore.getState().appointments.find(a => a.bookingId === bookingIdParam);
          }
          if (found) {
            setAppointment(found);
          } else {
            showError('Error', 'Could not find appointment details');
            navigation.goBack();
          }
        } catch (error) {
          showError('Error', 'Failed to load appointment details');
          navigation.goBack();
        }
      };
      fetchAppointment();
    }
    return () => { active = false; };
  }, [initialAppointment, bookingIdParam]);

  useEffect(() => {
    if (!appointment) return;
    let mounted = true;
    let callListenersInitialized = false;

    const initializeChat = async () => {
      try {
        setIsConnecting(true);

        // 1. Connect socket if not already connected
        if (!isSocketConnected) {
          console.log('🔌 Connecting to socket...');
          await connectSocket();
        }

        // 2. Get or create conversation
        console.log('📝 Getting/creating conversation...');
        const conversation = await chatService.getOrCreateConversation(
          appointment.bookingId,
          appointment.consultantId,
          appointment.patientId
        );

        if (!mounted) return;

        if (!conversation) {
          throw new Error('Failed to create conversation');
        }

        console.log('✅ Conversation ready:', conversation.id);

        // 3. Set current conversation and join room
        await setCurrentConversation(conversation);

        // 4. Join the conversation room via WebSocket
        if (user) {
          console.log('🚪 Joining conversation room...');
          await socketService.joinConversation(
            conversation.id,
            user.id,
            user.role as 'patient' | 'consultant'
          );
          console.log('✅ Joined conversation room');
        }

        // 5. Load existing messages
        await loadMessages(conversation.id);

        // 6. Initialize call event listeners ONLY ONCE
        if (!callListenersInitialized) {
          console.log('🎧 Initializing call listeners...');
          useCallStore.getState().initialize();
          callListenersInitialized = true;
        }

        setIsConnecting(false);

        // Handle incoming call from push notification
        if (isIncomingParam && user && fromUserIdParam) {
          const callStoreState = useCallStore.getState();
          // Synthesize incoming call event if missed while app was killed
          if (callStoreState.status === 'idle') {
            console.log('📱 Triggering incoming call from push notification data');
            callStoreState.handleIncomingCall({
              callType: callTypeParam || 'video',
              conversationId: conversation.id,
              fromUserId: fromUserIdParam,
            });
          }
        }
      } catch (error: any) {
        console.error('❌ Chat initialization error:', error);
        if (mounted) {
          setIsConnecting(false);
          const errorMessage = error?.message || 'Failed to connect to chat. Please try again.';
          RNAlert.alert(
            'Connection Error',
            errorMessage,
            [
              {
                text: 'Retry',
                onPress: () => initializeChat(),
              },
              {
                text: 'Go Back',
                onPress: () => navigation.goBack(),
                style: 'cancel',
              },
            ]
          );
        }
      }
    };

    initializeChat();

    // Cleanup
    return () => {
      mounted = false;
      setCurrentConversation(null);
      // ✅ DON'T call cleanup() here - it removes listeners needed for calls
      // Only cleanup when user actually leaves the app or logs out
      useCallStore.getState().reset(); // Just reset state, keep listeners
      // Don't disconnect socket here as it might be used by other screens
    };
  }, [appointment?.bookingId]);


  useEffect(() => {
    if (!currentConversation || messages.length === 0) return;

    // Find unread messages from the other person
    const unreadMessages = messages.filter(
      msg => msg.senderId !== user?.id && msg.isRead !== false
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg.id);

      // Mark as read after a short delay (simulate reading time)
      const timer = setTimeout(() => {
        useChatStore.getState().markAsRead(
          currentConversation.id,
          messageIds
        );
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [messages, currentConversation?.id, user?.id]);

  const handleTextChange = (text: string) => {
    setInputText(text);

    // Emit typing start
    if (text.length > 0) {
      startTyping();

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 2000);
    } else {
      stopTyping();
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    if (!currentConversation) {
      showError('Not connected to conversation', 'Error');
      return;
    }

    // Stop typing when sending
    stopTyping();
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(inputText.trim());
    setInputText('');

    // Animate send button
    sendButtonScale.value = withSpring(0.8, {}, () => {
      sendButtonScale.value = withSpring(1);
    });

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Helper to get a nice icon for a file type
  const getFileIcon = (mimeType?: string): string => {
    if (!mimeType) return 'document-outline';
    if (mimeType.startsWith('image/')) return 'image-outline';
    if (mimeType.startsWith('video/')) return 'videocam-outline';
    if (mimeType.includes('pdf')) return 'document-text-outline';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document-text-outline';
    return 'document-outline';
  };

  // Helper to get a friendly label
  const getFileLabel = (mimeType?: string): string => {
    if (!mimeType) return 'File';
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.includes('pdf')) return 'PDF Document';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'Word Document';
    return 'File';
  };

  // Extract filename from URL
  const getFileName = (url?: string): string => {
    if (!url) return 'Unknown file';
    try {
      const parts = url.split('/');
      const last = parts[parts.length - 1];
      // Remove query params
      return decodeURIComponent(last.split('?')[0]) || 'File';
    } catch {
      return 'File';
    }
  };

  const isImageType = (mimeType?: string, type?: string): boolean => {
    if (type === 'image') return true;
    if (!mimeType) return false;
    return mimeType.startsWith('image/');
  };

  const isVideoType = (mimeType?: string): boolean => {
    if (!mimeType) return false;
    return mimeType.startsWith('video/');
  };

  // Step 1: Pick file -> show preview
  const handleAttachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPendingFile({
          uri: asset.uri,
          name: asset.name || 'upload.file',
          mimeType: asset.mimeType || 'application/octet-stream',
        });
      }
    } catch (error: any) {
      console.log('File pick error:', error);
      showError(error.message || 'Failed to pick file', 'Error');
    }
  };

  // Step 2: User confirms -> upload + send
  const confirmSendFile = async () => {
    if (!pendingFile) return;
    if (!currentConversation) {
      showError('Not connected to conversation', 'Error');
      return;
    }

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', {
        uri: pendingFile.uri,
        name: pendingFile.name,
        type: pendingFile.mimeType,
      } as any);

      const uploadResponse = await uploadService.uploadChatFile(formData);

      const fileUrl = uploadResponse.data?.data?.fileUrl || uploadResponse.data?.fileUrl || uploadResponse.secure_url;
      const fileType = uploadResponse.data?.data?.fileType || uploadResponse.data?.fileType || pendingFile.mimeType;

      if (!fileUrl) {
        throw new Error('Failed to get file URL from upload');
      }

      const msgType = (fileType.startsWith('image/') || fileType.startsWith('video/')) ? 'image' : 'file';

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      sendMessage('', msgType, fileUrl, fileType);
      setPendingFile(null);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.log('File upload error:', error);
      showError(error.message || 'Failed to upload file', 'Error');
    } finally {
      setIsUploading(false);
    }
  };

  const cancelFilePreview = () => {
    setPendingFile(null);
  };

  const sendButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
  }));

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const { initiateCall, handleIncomingCall, handleRinging, handleStopRinging, handleNoAnswer, handleCallMissed } = useCallStore();

  useEffect(() => {
    socketService.onIncomingCall(handleIncomingCall);
    socketService.onCallRinging(handleRinging);
    socketService.onCallStopRinging(handleStopRinging);
    socketService.onCallNoAnswer(handleNoAnswer);
    socketService.onCallMissed(handleCallMissed);
    return () => {
      socketService.offIncomingCall(handleIncomingCall);
      socketService.offCallRinging(handleRinging);
      socketService.offCallStopRinging(handleStopRinging);
      socketService.offCallNoAnswer(handleNoAnswer);
      socketService.offCallMissed(handleCallMissed);
    };
  }, []);

  const handleVideoCall = () => {
    if (!currentConversation || !user || !appointment) return;
    const peerId = currentConversation.patientId === user.id ? currentConversation.consultantId : currentConversation.patientId;
    if (!peerId) {
      showError('Cannot initiate call', 'Peer ID not found');
      return;
    }
    initiateCall(peerId, currentConversation.id, 'video', appointment.patientName);
  };

  const handleVoiceCall = () => {
    if (!currentConversation || !user || !appointment) return;
    const peerId = currentConversation.patientId === user.id ? currentConversation.consultantId : currentConversation.patientId;
    if (!peerId) {
      showError('Cannot initiate call', 'Peer ID not found');
      return;
    }
    initiateCall(peerId, currentConversation.id, 'audio', appointment.patientName);
  };

  // Detect if a content string is actually a file URL
  const contentIsFileUrl = (content?: string): boolean => {
    if (!content) return false;
    const trimmed = content.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;
    // Check for common file extensions or cloudinary patterns
    const filePatterns = /\.(jpg|jpeg|png|gif|webp|mp4|mov|pdf|doc|docx)(\?.*)?$/i;
    const cloudinaryPattern = /res\.cloudinary\.com/i;
    return filePatterns.test(trimmed) || cloudinaryPattern.test(trimmed);
  };

  // Guess mime type from URL extension
  const guessMimeFromUrl = (url: string): string => {
    const lower = url.toLowerCase();
    if (lower.includes('.jpg') || lower.includes('.jpeg')) return 'image/jpeg';
    if (lower.includes('.png')) return 'image/png';
    if (lower.includes('.gif')) return 'image/gif';
    if (lower.includes('.webp')) return 'image/webp';
    if (lower.includes('.mp4')) return 'video/mp4';
    if (lower.includes('.mov')) return 'video/quicktime';
    if (lower.includes('.pdf')) return 'application/pdf';
    if (lower.includes('.doc')) return 'application/msword';
    // Cloudinary image/upload path is usually an image
    if (/cloudinary\.com.*\/image\/upload/i.test(url)) return 'image/jpeg';
    return 'application/octet-stream';
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === user?.id;
    const showAvatar =
      !isOwn &&
      (index === messages.length - 1 ||
        messages[index + 1]?.senderId !== item.senderId);

    // Resolve the actual file URL and type — handle both fileUrl field and URL-in-content
    const resolvedFileUrl = item.fileUrl || (contentIsFileUrl(item.content) ? item.content.trim() : undefined);
    const resolvedFileType = item.fileType || (resolvedFileUrl && !item.fileUrl ? guessMimeFromUrl(resolvedFileUrl) : undefined);
    const hasFile = !!resolvedFileUrl;

    return (
      <Animated.View
        entering={SlideInDown.delay(index * 50).springify()}
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessageContainer : styles.otherMessageContainer,
        ]}
      >
        {!isOwn && showAvatar && (
          <Avatar
            name={appointment?.patientName || ''}
            size="sm"
            style={styles.messageAvatar}
          />
        )}
        {!isOwn && !showAvatar && <View style={styles.avatarPlaceholder} />}

        <View
          style={[
            styles.messageBubble,
            isOwn
              ? { backgroundColor: theme.colors.accent }
              : { backgroundColor: theme.colors.surface.secondary },
            hasFile && isImageType(resolvedFileType, item.type) ? styles.imageBubble : undefined,
          ]}
        >
          {hasFile ? (
            <View>
              {isImageType(resolvedFileType, item.type) ? (
                <Pressable onPress={() => resolvedFileUrl && Linking.openURL(resolvedFileUrl)}>
                  <Image
                    source={{ uri: resolvedFileUrl }}
                    style={styles.messageImage}
                    resizeMode="cover"
                  />
                </Pressable>
              ) : isVideoType(resolvedFileType) ? (
                <Pressable
                  onPress={() => resolvedFileUrl && Linking.openURL(resolvedFileUrl)}
                  style={styles.videoPreview}
                >
                  <View style={styles.videoOverlay}>
                    <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
                  </View>
                  <Text style={[
                    styles.messageText,
                    { color: isOwn ? '#FFFFFF' : theme.colors.text.primary, marginTop: 8 }
                  ]}>🎬 Video</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => resolvedFileUrl && Linking.openURL(resolvedFileUrl)}
                  style={[
                    styles.documentCard,
                    { backgroundColor: isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)' },
                  ]}
                >
                  <View style={[
                    styles.documentIconContainer,
                    { backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)' },
                  ]}>
                    <Ionicons
                      name={getFileIcon(resolvedFileType) as any}
                      size={24}
                      color={isOwn ? '#FFFFFF' : theme.colors.accent}
                    />
                  </View>
                  <View style={styles.documentInfo}>
                    <Text
                      style={[
                        styles.documentName,
                        { color: isOwn ? '#FFFFFF' : theme.colors.text.primary },
                      ]}
                      numberOfLines={1}
                    >
                      {getFileName(resolvedFileUrl)}
                    </Text>
                    <Text
                      style={[
                        styles.documentType,
                        { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.colors.text.tertiary },
                      ]}
                    >
                      {getFileLabel(resolvedFileType)}
                    </Text>
                  </View>
                  <Ionicons
                    name="download-outline"
                    size={18}
                    color={isOwn ? 'rgba(255,255,255,0.7)' : theme.colors.text.tertiary}
                  />
                </Pressable>
              )}
              {/* Only show content text if it's NOT the file URL itself */}
              {item.content && item.content.trim() !== resolvedFileUrl ? (
                <Text
                  style={[
                    styles.messageText,
                    { color: isOwn ? '#FFFFFF' : theme.colors.text.primary, marginTop: 6 },
                  ]}
                >
                  {item.content}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text
              style={[
                styles.messageText,
                { color: isOwn ? '#FFFFFF' : theme.colors.text.primary },
              ]}
            >
              {item.content}
            </Text>
          )}
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                { color: isOwn ? 'rgba(255,255,255,0.7)' : theme.colors.text.tertiary },
              ]}
            >
              {formatTime(item.createdAt)}
            </Text>
            {isOwn && (
              <Ionicons
                name={item.isRead ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.isRead ? '#60A5FA' : 'rgba(255,255,255,0.7)'}
                style={styles.readReceipt}
              />
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping || !appointment) return null;

    // Get first name from patient name
    const firstName = appointment.patientName.split(' ')[0];

    return (
      <Animated.View
        entering={FadeIn}
        style={styles.typingIndicatorContainer}
      >
        <Text
          style={[
            styles.typingIndicatorText,
            { color: theme.colors.text.secondary, fontFamily: theme.fontFamily.regular },
          ]}
        >
          {firstName} is typing...
        </Text>
      </Animated.View>
    );
  };

  // Show loading state while connecting
  // if (isConnecting) {
  //   return (
  //     <SafeAreaView
  //       style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
  //       edges={['top', 'bottom']}
  //     >
  //       <View style={styles.loadingContainer}>
  //         <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
  //           Connecting to {appointment.patientName}
  //         </Text>
  //       </View>
  //     </SafeAreaView>
  //   );
  // }

  if (!appointment) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
        edges={['top', 'bottom']}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
            Loading chat...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border.primary }]}>
        <Pressable
          style={[styles.backButton, { backgroundColor: theme.colors.surface.secondary }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </Pressable>

        <View style={styles.headerInfo}>
          <Avatar
            name={appointment.patientName}
            size="sm"
            showStatus
            isOnline={isSocketConnected}
          />
          <View style={styles.headerText}>
            <Text
              style={[
                styles.headerName,
                { color: theme.colors.text.primary, fontFamily: theme.fontFamily.semiBold },
              ]}
            >
              {appointment.patientName}
            </Text>
            <Text
              style={[
                styles.headerStatus,
                {
                  color: isSocketConnected
                    ? theme.colors.palette.success[500]
                    : theme.colors.text.tertiary,
                  fontFamily: theme.fontFamily.regular
                },
              ]}
            >
              {isSocketConnected ? 'Online' : 'Connecting...'}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={[styles.headerButton, { backgroundColor: theme.colors.surface.secondary, marginRight: 8 }]}
            onPress={handleVideoCall}
          >
            <Ionicons name="videocam" size={20} color={theme.colors.text.primary} />
          </Pressable>
          <Pressable
            style={[styles.headerButton, { backgroundColor: theme.colors.surface.secondary }]}
            onPress={handleVoiceCall}
          >
            <Ionicons name="call" size={20} color={theme.colors.text.primary} />
          </Pressable>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // ✅ Set to 0
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive" // ✅ Add this
          ListFooterComponent={renderTypingIndicator}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
        />

        {/* File Preview Bar (before sending) */}
        {pendingFile && (
          <View style={[styles.filePreviewBar, { backgroundColor: theme.colors.surface.secondary, borderTopColor: theme.colors.border.primary }]}>
            <View style={styles.filePreviewContent}>
              {pendingFile.mimeType.startsWith('image/') ? (
                <Image
                  source={{ uri: pendingFile.uri }}
                  style={styles.filePreviewImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.filePreviewIcon, { backgroundColor: theme.colors.accent + '20' }]}>
                  <Ionicons
                    name={getFileIcon(pendingFile.mimeType) as any}
                    size={28}
                    color={theme.colors.accent}
                  />
                </View>
              )}
              <View style={styles.filePreviewInfo}>
                <Text
                  style={[styles.filePreviewName, { color: theme.colors.text.primary, fontFamily: theme.fontFamily.semiBold }]}
                  numberOfLines={1}
                >
                  {pendingFile.name}
                </Text>
                <Text style={[styles.filePreviewType, { color: theme.colors.text.tertiary }]}>
                  {getFileLabel(pendingFile.mimeType)}
                </Text>
              </View>
              <Pressable
                onPress={cancelFilePreview}
                style={[styles.filePreviewClose, { backgroundColor: theme.colors.surface.primary }]}
              >
                <Ionicons name="close" size={18} color={theme.colors.text.secondary} />
              </Pressable>
            </View>
            <Pressable
              onPress={confirmSendFile}
              disabled={isUploading}
              style={[
                styles.filePreviewSend,
                { backgroundColor: theme.colors.accent, opacity: isUploading ? 0.6 : 1 },
              ]}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#FFFFFF', fontFamily: theme.fontFamily.semiBold, fontSize: 14 }}>
                    Send File
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: theme.colors.surface.primary, paddingBottom: Math.max(insets.bottom, 80) }]}>
          <Pressable style={styles.attachButton} onPress={handleAttachFile} disabled={isUploading}>
             {isUploading ? (
               <ActivityIndicator size="small" color={theme.colors.text.tertiary} />
             ) : (
               <Ionicons name="attach" size={24} color={theme.colors.text.tertiary} />
             )}
          </Pressable>

          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.colors.surface.secondary,
                borderColor: theme.colors.border.primary,
              },
            ]}
          >
            <TextInput
              value={inputText}
              onChangeText={handleTextChange}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.text.tertiary}
              style={[
                styles.textInput,
                { color: theme.colors.text.primary, fontFamily: theme.fontFamily.regular },
              ]}
              multiline
              maxLength={1000}
              editable={isSocketConnected}
            />
          </View>

          <Animated.View style={sendButtonAnimatedStyle}>
            <Pressable
              onPress={handleSend}
              disabled={!isSocketConnected || !inputText.trim()}
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim() && isSocketConnected
                    ? theme.colors.accent
                    : theme.colors.surface.secondary,
                },
              ]}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() && isSocketConnected ? '#FFFFFF' : theme.colors.text.tertiary}
              />
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
      <Alert
        type={alert.type}
        message={alert.message}
        title={alert.title}
        visible={alert.visible}
        onClose={hideAlert}
      />
      <CallModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerText: {
    marginLeft: 10,
  },
  headerName: {
    fontSize: 16,
  },
  headerStatus: {
    fontSize: 12,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageContainer: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 32,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTime: {
    fontSize: 11,
  },
  readReceipt: {
    marginLeft: 4,
  },
  typingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typingIndicatorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingIndicatorText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputBar: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 12,
    // paddingBottom: 15,
  },

  attachButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  textInput: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Image in message bubble
  imageBubble: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 6,
    overflow: 'hidden',
  },
  messageImage: {
    width: Dimensions.get('window').width * 0.55,
    height: 180,
    borderRadius: 14,
  },
  // Video preview
  videoPreview: {
    width: Dimensions.get('window').width * 0.55,
    height: 120,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Document card in message
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    minWidth: 200,
  },
  documentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  documentInfo: {
    flex: 1,
    marginRight: 8,
  },
  documentName: {
    fontSize: 13,
    fontWeight: '600',
  },
  documentType: {
    fontSize: 11,
    marginTop: 2,
  },
  // File preview bar (before sending)
  filePreviewBar: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  filePreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  filePreviewImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  filePreviewIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filePreviewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  filePreviewName: {
    fontSize: 14,
  },
  filePreviewType: {
    fontSize: 12,
    marginTop: 2,
  },
  filePreviewClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filePreviewSend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
});