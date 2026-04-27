import React, { useState, useCallback, useContext, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { messageService, Conversation as BaseConversation, Message } from '../api/messageService';
import { friendshipService, Friend } from '../api/friendshipService';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

interface Conversation extends BaseConversation {
  streak_count?: number;
}

const debuggerHost = Constants.expoConfig?.hostUri;
const dynamicIp = debuggerHost ? debuggerHost.split(':')[0] : null;
const SOCKET_URL = dynamicIp ? `http://${dynamicIp}:3000` : 'http://localhost:3000';

export default function ConversationsScreen() {
  const { colors } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFriendsLoading, setIsFriendsLoading] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, []),
  );

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Nu am putut incarca conversatiile', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      if (user?.id) {
        socketRef.current?.emit('join_own_room', user.id);
      }
    });

    socketRef.current.on('receive_message', (newMessage: Message) => {
      setConversations((prevConversations) => {
        const otherUserId =
          newMessage.sender_id === user?.id ? newMessage.receiver_id : newMessage.sender_id;
        const existingIndex = prevConversations.findIndex((c) => c.user_id === otherUserId);

        if (existingIndex > -1) {
          const updatedConversations = [...prevConversations];
          const conversationToMove = updatedConversations[existingIndex];

          let displayMessage = newMessage.text;
          if (!displayMessage) {
            if (newMessage.message_type === 'IMAGE') displayMessage = t('conversations.photo');
            else if (newMessage.message_type === 'DOCUMENT') displayMessage = t('conversations.document');
            else displayMessage = t('conversations.attachment');
          }

          conversationToMove.last_message = displayMessage;
          conversationToMove.last_message_date = newMessage.created_at;
          conversationToMove.is_read = newMessage.sender_id === user?.id;

          updatedConversations.splice(existingIndex, 1);
          updatedConversations.unshift(conversationToMove);

          return updatedConversations;
        } else {
          fetchConversations();
          return prevConversations;
        }
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user?.id]);

  const handleOpenNewChat = async () => {
    setIsModalVisible(true);
    setIsFriendsLoading(true);
    try {
      const friendsList = await friendshipService.getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Eroare la preluarea prietenilor:', error);
    } finally {
      setIsFriendsLoading(false);
    }
  };

  const startChatWithFriend = (friend: Friend) => {
    setIsModalVisible(false);
    setSearchQuery('');

    navigation.navigate('ChatScreen', {
      userId: friend.id,
      username: friend.username,
      avatar: friend.profile_picture_url,
      streakCount: friend.streak_count,
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
  };

  const filteredFriends = friends.filter(
    (friend) =>
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (friend.full_name && friend.full_name.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[styles.conversationCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={() =>
        navigation.navigate('ChatScreen', {
          userId: item.user_id,
          username: item.username,
          avatar: item.profile_picture_url,
        })
      }
    >
      <TouchableOpacity
        onPress={() => navigation.navigate('ProfileScreen', { userId: item.user_id })}
        style={styles.avatarContainer}
      >
        {item.profile_picture_url ? (
          <Image source={{ uri: item.profile_picture_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
            <Ionicons name="person" size={24} color={colors.white} />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.textContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen', { userId: item.user_id })}>
            <Text style={[styles.name, { color: colors.textDark }]} numberOfLines={1}>
              {item.full_name || item.username}
            </Text>
          </TouchableOpacity>
          {item.streak_count && item.streak_count > 0 ? (
            <View style={styles.streakBadgeSmall}>
              <Text style={styles.streakTextSmall}>{'\u{1F525}'} {item.streak_count}</Text>
            </View>
          ) : null}

          <Text style={[styles.time, { color: colors.textLight }, !item.is_read && { color: colors.textDark, fontWeight: 'bold' }]}>
            {formatTime(item.last_message_date)}
          </Text>
        </View>

        <Text style={[styles.lastMessage, { color: colors.textLight }, !item.is_read && { color: colors.textDark, fontWeight: 'bold' }]} numberOfLines={1}>
          {item.last_message}
        </Text>
      </View>

      {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
    </TouchableOpacity>
  );

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <TouchableOpacity style={[styles.friendCard, { borderBottomColor: colors.separatorColor }]} onPress={() => startChatWithFriend(item)}>
      <TouchableOpacity
        onPress={() => navigation.navigate('ProfileScreen', { userId: item.id })}
        style={styles.avatarContainer}
      >
        {item.profile_picture_url ? (
          <Image source={{ uri: item.profile_picture_url }} style={styles.avatarSmall} />
        ) : (
          <View style={[styles.avatarPlaceholder, { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary }]}>
            <Ionicons name="person" size={20} color={colors.white} />
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.textContainer}>
        <Text style={[styles.name, { color: colors.textDark }]}>{item.full_name || item.username}</Text>
        <Text style={[styles.friendUsername, { color: colors.textLight }]}>@{item.username}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && conversations.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.separatorColor }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LinearGradient
            colors={colors.primaryGradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoIcon}
          >
            <Ionicons name="chatbubbles" size={18} color="#fff" />
          </LinearGradient>
          <Text style={[styles.logoText, { color: colors.textDark }]}>{t('conversations.title')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.profileBtn, { backgroundColor: colors.iconBg }]}
          onPress={() => navigation.navigate('ProfileScreen')}
        >
          <Ionicons name="person" size={20} color={colors.iconColor} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.user_id.toString()}
        renderItem={renderConversationItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color={colors.textLight} />
            <Text style={[styles.emptyText, { color: colors.textDark }]}>{t('conversations.emptyTitle')}</Text>
            <Text style={[styles.emptySubText, { color: colors.textLight }]}>
              {t('conversations.emptyHint')}
            </Text>
          </View>
        }
      />

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={handleOpenNewChat}>
        <Ionicons name="chatbubble-ellipses" size={24} color={colors.white} />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.separatorColor }]}>
            <Text style={[styles.modalTitle, { color: colors.textDark }]}>{t('conversations.contacts')}</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchContainer, { backgroundColor: colors.searchBarBg, borderColor: colors.searchBarBorder }]}>
            <Ionicons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.searchBarText }]}
              placeholder={t('conversations.searchFriends')}
              placeholderTextColor={colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {isFriendsLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={filteredFriends}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderFriendItem}
              contentContainerStyle={styles.modalListContent}
              ListEmptyComponent={
                <Text style={[styles.emptyModalText, { color: colors.textLight }]}>
                  {searchQuery ? t('conversations.noFriendsFound') : t('conversations.noFriends')}
                </Text>
              }
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 15,
      marginBottom: 10,
      borderBottomWidth: 1,
    },
    logoIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    logoText: {
      fontSize: 22,
      fontWeight: '800',
    },
    profileBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    listContent: { padding: 15, paddingBottom: 80 },
    conversationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      marginBottom: 10,
      borderRadius: 12,
      borderWidth: 1,
      elevation: 1,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    avatarContainer: { marginRight: 15 },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    avatarPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },
    textContainer: { flex: 1, justifyContent: 'center' },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    name: {
      fontSize: 16,
      fontWeight: 'bold',
      flexShrink: 1,
      marginRight: 5,
    },
    streakBadgeSmall: {
      backgroundColor: 'rgba(255, 140, 0, 0.1)',
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 6,
      marginRight: 'auto',
    },
    streakTextSmall: { fontSize: 11, fontWeight: 'bold', color: '#FF8C00' },
    time: { fontSize: 12, marginLeft: 5 },
    lastMessage: { fontSize: 14 },
    unreadDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginLeft: 10,
    },
    emptyContainer: { alignItems: 'center', marginTop: 50, paddingHorizontal: 20 },
    emptyText: { fontSize: 18, fontWeight: 'bold', marginTop: 15 },
    emptySubText: {
      fontSize: 14,
      textAlign: 'center',
      marginTop: 10,
      lineHeight: 20,
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 2 },
    },
    modalContainer: { flex: 1 },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15,
      borderBottomWidth: 1,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    closeButton: { padding: 5 },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: 15,
      borderRadius: 10,
      paddingHorizontal: 15,
      borderWidth: 1,
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, height: 45, fontSize: 16 },
    modalListContent: { paddingHorizontal: 15, paddingBottom: 20 },
    friendCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    avatarSmall: { width: 40, height: 40, borderRadius: 20 },
    friendUsername: { fontSize: 13, marginTop: 2 },
    emptyModalText: { textAlign: 'center', marginTop: 30, fontSize: 16 },
  });
