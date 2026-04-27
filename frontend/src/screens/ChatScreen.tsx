import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Image,
  Linking,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';

import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { AlertContext } from '../context/AlertContext';
import { ThemeColors } from '../theme/colors';
import { messageService, Message } from '../api/messageService';
import { friendshipService } from '../api/friendshipService';
import { storage } from '../utils/storage';
import { apiClient } from '../api/client';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';

const debuggerHost = Constants.expoConfig?.hostUri;
const dynamicIp = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
const SOCKET_URL = `http://${dynamicIp}:3000`;

export default function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const { showAlert } = useContext(AlertContext);
  const { t } = useTranslation();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const params = route.params || {};

  const otherUserId = params.otherUserId || params.userId || params.id;
  const otherUsername =
    params.otherUsername || params.username || params.full_name || 'Conversație';
  const otherUserAvatar = params.otherUserAvatar || params.avatar || params.profile_picture_url;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
      },
    );

    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [relationshipStatus, setRelationshipStatus] = useState<
    'FRIENDS' | 'BLOCKED_BY_ME' | 'BLOCKED_BY_THEM' | 'NOT_FRIENDS'
  >('FRIENDS');

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({ title: otherUsername });

    const fetchData = async () => {
      try {
        const [history, status] = await Promise.all([
          messageService.getHistory(otherUserId),
          friendshipService.checkStatus(otherUserId),
        ]);
        setMessages(history);
        setRelationshipStatus(status);
      } catch (error) {
        console.error('Eroare la istoricul chat-ului:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    socketRef.current = io(SOCKET_URL);
    if (user?.id) {
      socketRef.current.emit('join_own_room', user.id);
    }

    socketRef.current.on('receive_message', (newMessage: Message) => {
      if (
        (newMessage.sender_id === user?.id && newMessage.receiver_id === otherUserId) ||
        (newMessage.sender_id === otherUserId && newMessage.receiver_id === user?.id)
      ) {
        setMessages((prev) => [...prev, newMessage]);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [navigation, otherUserId, otherUsername, user?.id]);

  const handleSendMessage = () => {
    if (inputText.trim() === '' || !user?.id) return;

    const messageData = {
      senderId: user.id,
      receiverId: otherUserId,
      text: inputText.trim(),
      messageType: 'TEXT',
    };

    socketRef.current?.emit('send_message', messageData);
    setInputText('');
  };

  const handleSendAttachment = async (type: 'image' | 'document') => {
    try {
      let fileResult;

      if (type === 'image') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
          showAlert({ title: t('common.error'), message: t('chat.errorPermission'), hideCancel: true, confirmText: t('common.ok') });
          return;
        }
        fileResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
        });
      } else {
        fileResult = await DocumentPicker.getDocumentAsync({
          type: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ],
        });
      }

      if (fileResult.canceled || !fileResult.assets || fileResult.assets.length === 0) return;

      const fileAsset = fileResult.assets[0];

      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? fileAsset.uri.replace('file://', '') : fileAsset.uri,
        name: (fileAsset as any).name || (fileAsset as any).fileName || 'upload.jpg',
        type: fileAsset.mimeType || 'image/jpeg',
      } as any);

      setIsUploading(true);

      const token = await storage.getToken();
      const uploadResponse = await fetch(`${apiClient.defaults.baseURL}/messages/attachment`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(responseData.message || 'Eroare la încărcarea fișierului');
      }

      const messageData = {
        senderId: user?.id,
        receiverId: otherUserId,
        text: null,
        messageType: responseData.data.messageType,
        mediaUrl: responseData.data.mediaUrl,
        fileName: responseData.data.fileName,
      };

      socketRef.current?.emit('send_message', messageData);
    } catch (error: any) {
      console.error('[Upload Eroare]', error);
      showAlert({ title: t('common.error'), message: error.message || t('chat.errorUpload'), hideCancel: true, confirmText: t('common.ok') });
    } finally {
      setIsUploading(false);
    }
  };

  const showAttachmentOptions = () => {
    showAlert({
      title: t('chat.sendFile'),
      message: t('chat.chooseFileType'),
      confirmText: t('chat.photo'),
      cancelText: t('chat.cancel'),
      hideCancel: false,
      onConfirm: () => handleSendAttachment('image'),
      onCancel: () => {
        // Show document option after a brief delay
        setTimeout(() => {
          showAlert({
            title: t('chat.sendFile'),
            message: t('chat.chooseFileType'),
            confirmText: t('chat.document'),
            cancelText: t('chat.cancel'),
            hideCancel: false,
            onConfirm: () => handleSendAttachment('document'),
          });
        }, 200);
      },
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === user?.id;

    return (
      <View style={[styles.messageRow, isMyMessage ? styles.myMessageRow : styles.otherMessageRow]}>
        {!isMyMessage && (
          <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen', { userId: item.sender_id })}>
            <Image
              source={{ uri: otherUserAvatar || 'https://picsum.photos/seed/chat/40/40' }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        )}
        <View style={[styles.messageBubble, isMyMessage ? styles.myBubble : styles.otherBubble]}>
          {item.message_type === 'IMAGE' && item.media_url ? (
            <Image
              source={{ uri: item.media_url }}
              style={styles.imageAttachment}
              resizeMode="cover"
            />
          ) : item.message_type === 'DOCUMENT' && item.media_url ? (
            <TouchableOpacity
              style={styles.documentAttachment}
              onPress={() => Linking.openURL(item.media_url!)}
            >
              <Ionicons
                name="document-text"
                size={32}
                color={isMyMessage ? colors.white : colors.primary}
              />
              <Text
                style={[
                  styles.documentName,
                  { color: isMyMessage ? colors.white : colors.textDark },
                ]}
                numberOfLines={2}
              >
                {item.file_name || 'Document'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.otherMessageText,
              ]}
            >
              {item.text}
            </Text>
          )}

          <Text style={[styles.timeText, isMyMessage ? styles.myTimeText : styles.otherTimeText]}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const chatContent = (
    <>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {relationshipStatus === 'FRIENDS' ? (
        <View style={[styles.inputContainer, { paddingBottom: Math.max(10, insets.bottom) }]}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={showAttachmentOptions}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="attach" size={28} color={colors.textLight} />
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={colors.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onFocus={() => {
              setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
            }}
          />

          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() === '' && { opacity: 0.5 }]}
            onPress={handleSendMessage}
            disabled={inputText.trim() === ''}
          >
            <Ionicons name="send" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.disabledContainer}>
          <Ionicons
            name={relationshipStatus.includes('BLOCKED') ? 'ban' : 'information-circle-outline'}
            size={24}
            color={colors.textLight}
            style={{ marginBottom: 5 }}
          />
          <Text style={styles.disabledText}>
            {relationshipStatus === 'BLOCKED_BY_ME' && t('chat.blockedByMe')}
            {relationshipStatus === 'BLOCKED_BY_THEM' && t('chat.blockedByThem')}
            {relationshipStatus === 'NOT_FRIENDS' && t('chat.notFriends')}
          </Text>
        </View>
      )}
    </>
  );

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
      >
        {chatContent}
      </KeyboardAvoidingView>
    );
  }

  return <View style={[styles.container, { paddingBottom: keyboardHeight }]}>{chatContent}</View>;
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 15, paddingBottom: 20 },

    messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
    myMessageRow: { justifyContent: 'flex-end' },
    otherMessageRow: { justifyContent: 'flex-start' },

    avatar: { width: 30, height: 30, borderRadius: 15, marginRight: 8 },

    messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
    myBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
    otherBubble: {
      backgroundColor: colors.card,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },

    messageText: { fontSize: 16, lineHeight: 22 },
    myMessageText: { color: colors.white },
    otherMessageText: { color: colors.textDark },

    imageAttachment: { width: 200, height: 250, borderRadius: 10, marginBottom: 5 },
    documentAttachment: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.1)',
      padding: 10,
      borderRadius: 10,
      width: 200,
    },
    documentName: { marginLeft: 10, fontSize: 14, fontWeight: '500', flex: 1 },

    timeText: { fontSize: 11, marginTop: 4, alignSelf: 'flex-end' },
    myTimeText: { color: 'rgba(255,255,255,0.7)' },
    otherTimeText: { color: colors.textLight },

    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: 10,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    attachButton: { padding: 10, justifyContent: 'center', alignItems: 'center' },

    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 100,
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingHorizontal: 15,
      paddingTop: 10,
      paddingBottom: 10,
      fontSize: 16,
      color: colors.textDark,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendButton: {
      backgroundColor: colors.primary,
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
      marginBottom: 2,
    },

    disabledContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      paddingBottom: Platform.OS === 'ios' ? 35 : 20,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    disabledText: {
      color: colors.textLight,
      fontSize: 14,
      fontStyle: 'italic',
      textAlign: 'center',
    },
  });
