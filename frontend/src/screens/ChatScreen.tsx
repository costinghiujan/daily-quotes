import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { 
  View, Text, TextInput, FlatList, TouchableOpacity, 
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';

import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { messageService, Message } from '../api/messageService';

import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;

const dynamicIp = debuggerHost ? debuggerHost.split(':')[0] : null;

const SOCKET_URL = dynamicIp 
  ? `http://${dynamicIp}:3000` 
  : 'http://localhost:3000';

export default function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const { userId: otherUserId, username: otherUsername } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({ title: otherUsername });

    const fetchHistory = async () => {
      try {
        const history = await messageService.getHistory(otherUserId);
        setMessages(history);
      } catch (error) {
        console.error('Eroare la istoricul chat-ului:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();

    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      console.log(`[Debug Frontend] Socket CONECTAT cu succes la: ${SOCKET_URL}`);
      if (user?.id) {
        socketRef.current?.emit('join_own_room', user.id);
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.log('[Debug Frontend] EROARE de conexiune Socket:', error.message);
    });

    socketRef.current.on('receive_message', (newMessage: Message) => {
      const isRelevant = 
        (newMessage.sender_id === user?.id && newMessage.receiver_id === otherUserId) ||
        (newMessage.sender_id === otherUserId && newMessage.receiver_id === user?.id);

      if (isRelevant) {
        setMessages(prev => [...prev, newMessage]);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [otherUserId, user?.id]);

  const handleSendMessage = () => {
    console.log('[Debug Frontend] 1. Buton Send apăsat!');
    console.log(`[Debug Frontend] 2. Date curente: Text="${inputText}", MyID=${user?.id}, OtherID=${otherUserId}`);

    if (inputText.trim() === '') {
      console.log('[Debug Frontend] 3. EȘEC: Textul este gol.');
      return;
    }
    if (!user?.id) {
      console.log('[Debug Frontend] 3. EȘEC: user.id lipsește din AuthContext!');
      return;
    }

    const messageData = {
      senderId: user.id,
      receiverId: otherUserId,
      text: inputText.trim(),
    };

    console.log('[Debug Frontend] 4. Emitere payload către Socket:', messageData);
    
    if (!socketRef.current?.connected) {
      console.log('[Debug Frontend] 5. AVERTISMENT: Socket-ul NU este conectat la server!');
    }

    socketRef.current?.emit('send_message', messageData);
    setInputText('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === user?.id;

    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperThem]}>
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleThem]}>
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextThem]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Scrie un mesaj..."
          placeholderTextColor={colors.textLight}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, inputText.trim() === '' && { opacity: 0.5 }]} 
          onPress={handleSendMessage}
          disabled={inputText.trim() === ''}
        >
          <Ionicons name="send" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  listContent: { padding: 15, paddingBottom: 20 },
  
  messageWrapper: { marginBottom: 15, flexDirection: 'row' },
  messageWrapperMe: { justifyContent: 'flex-end' },
  messageWrapperThem: { justifyContent: 'flex-start' },
  
  messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  messageBubbleMe: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  messageBubbleThem: { backgroundColor: colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  
  messageText: { fontSize: 16, lineHeight: 22 },
  messageTextMe: { color: colors.white },
  messageTextThem: { color: colors.textDark },

  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingBottom: Platform.OS === 'ios' ? 25 : 10, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.background, color: colors.textDark, borderRadius: 20, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 12, maxHeight: 100, fontSize: 16, borderWidth: 1, borderColor: colors.border },
  sendButton: { backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});