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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { AppointmentsStackParamList } from '../../navigation/types';
import { Message } from '../../types';

type ChatScreenNavigationProp = NativeStackNavigationProp<
  AppointmentsStackParamList,
  'Chat'
>;
type ChatScreenRouteProp = RouteProp<AppointmentsStackParamList, 'Chat'>;

interface Props {
  navigation: ChatScreenNavigationProp;
  route: ChatScreenRouteProp;
}

export function ChatScreen({ navigation, route }: Props) {
  const theme = useAppTheme();
  const { appointment } = route.params;
  const flatListRef = useRef<FlatList>(null);
  
  const {
    messages,
    isTyping,
    loadMessages,
    sendMessage,
    setCurrentConversation,
  } = useChatStore();
  
  const [inputText, setInputText] = useState('');
  const sendButtonScale = useSharedValue(1);

  useEffect(() => {
    // Set up conversation context
    setCurrentConversation({
      id: `conv-${appointment.id}`,
      appointmentId: appointment.id,
      patient: appointment.patient,
      consultant: appointment.consultant,
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    });
    
    // Load messages for this conversation
    loadMessages(`conv-${appointment.id}`);
    
    return () => {
      setCurrentConversation(null);
    };
  }, [appointment.id]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
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

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === 'current-user';
    const showAvatar =
      !isOwn &&
      (index === messages.length - 1 ||
        messages[index + 1]?.senderId !== item.senderId);

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
            name={`${appointment.patient.firstName} ${appointment.patient.lastName}`}
            source={appointment.patient.avatar}
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
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isOwn ? '#FFFFFF' : theme.colors.text.primary },
            ]}
          >
            {item.content}
          </Text>
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
                name={
                  item.status === 'read'
                    ? 'checkmark-done'
                    : item.status === 'delivered'
                    ? 'checkmark-done'
                    : 'checkmark'
                }
                size={14}
                color={item.status === 'read' ? '#60A5FA' : 'rgba(255,255,255,0.7)'}
                style={styles.readReceipt}
              />
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <Animated.View
        entering={FadeIn}
        style={[styles.messageContainer, styles.otherMessageContainer]}
      >
        <Avatar
          name={`${appointment.patient.firstName} ${appointment.patient.lastName}`}
          source={appointment.patient.avatar}
          size="sm"
          style={styles.messageAvatar}
        />
        <View
          style={[
            styles.typingBubble,
            { backgroundColor: theme.colors.surface.secondary },
          ]}
        >
          <View style={styles.typingDots}>
            {[0, 1, 2].map((i) => (
              <Animated.View
                key={i}
                style={[
                  styles.typingDot,
                  { backgroundColor: theme.colors.text.tertiary },
                ]}
              />
            ))}
          </View>
        </View>
      </Animated.View>
    );
  };

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
            name={`${appointment.patient.firstName} ${appointment.patient.lastName}`}
            source={appointment.patient.avatar}
            size="sm"
            showStatus
            isOnline
          />
          <View style={styles.headerText}>
            <Text
              style={[
                styles.headerName,
                { color: theme.colors.text.primary, fontFamily: theme.fontFamily.semiBold },
              ]}
            >
              {appointment.patient.firstName} {appointment.patient.lastName}
            </Text>
            <Text
              style={[
                styles.headerStatus,
                { color: theme.colors.palette.success[500], fontFamily: theme.fontFamily.regular },
              ]}
            >
              Online
            </Text>
          </View>
        </View>
        
        <Pressable
          style={[styles.headerButton, { backgroundColor: theme.colors.surface.secondary }]}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.text.primary} />
        </Pressable>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderTypingIndicator}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
        />

        {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: theme.colors.surface.primary }]}>
          <Pressable style={styles.attachButton}>
            <Ionicons name="attach" size={24} color={theme.colors.text.tertiary} />
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
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.text.tertiary}
              style={[
                styles.textInput,
                { color: theme.colors.text.primary, fontFamily: theme.fontFamily.regular },
              ]}
              multiline
              maxLength={1000}
            />
          </View>
          
          <Animated.View style={sendButtonAnimatedStyle}>
            <Pressable
              onPress={handleSend}
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim()
                    ? theme.colors.accent
                    : theme.colors.surface.secondary,
                },
              ]}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? '#FFFFFF' : theme.colors.text.tertiary}
              />
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 24,
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
});
