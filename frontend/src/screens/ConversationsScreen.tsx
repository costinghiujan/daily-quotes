import React, { useState, useCallback, useContext, useMemo } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, 
  StyleSheet, ActivityIndicator, Image, Modal, TextInput, SafeAreaView
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { messageService, Conversation } from '../api/messageService';
import { friendshipService } from '../api/friendshipService';
import { ThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

export default function ConversationsScreen() {
  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const navigation = useNavigation<any>();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFriendsLoading, setIsFriendsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Nu am putut încărca conversațiile', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const startChatWithFriend = (friend: any) => {
    setIsModalVisible(false); 
    setSearchQuery('');
    
    navigation.navigate('ChatScreen', { 
      userId: friend.id, 
      username: friend.username,
      avatar: friend.profile_picture_url
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });
  };

  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (friend.full_name && friend.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity 
      style={styles.conversationCard}
      onPress={() => navigation.navigate('ChatScreen', { 
        userId: item.user_id, 
        username: item.username,
        avatar: item.profile_picture_url
      })}
    >
      <View style={styles.avatarContainer}>
        {item.profile_picture_url ? (
          <Image source={{ uri: item.profile_picture_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={24} color={colors.white} />
          </View>
        )}
      </View>

      <View style={styles.textContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.full_name || item.username}
          </Text>
          <Text style={styles.time}>{formatTime(item.last_message_date)}</Text>
        </View>
        
        <Text 
          style={[styles.lastMessage, !item.is_read && styles.unreadMessage]} 
          numberOfLines={1}
        >
          {item.last_message}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFriendItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.friendCard} onPress={() => startChatWithFriend(item)}>
      <View style={styles.avatarContainer}>
        {item.profile_picture_url ? (
          <Image source={{ uri: item.profile_picture_url }} style={styles.avatarSmall} />
        ) : (
          <View style={[styles.avatarPlaceholder, { width: 40, height: 40, borderRadius: 20 }]}>
            <Ionicons name="person" size={20} color={colors.white} />
          </View>
        )}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.name}>{item.full_name || item.username}</Text>
        <Text style={styles.friendUsername}>@{item.username}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && conversations.length === 0) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.user_id.toString()}
        renderItem={renderConversationItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color={colors.textLight} />
            <Text style={styles.emptyText}>Nu ai nicio conversație încă.</Text>
            <Text style={styles.emptySubText}>Apasă pe butonul de mai jos pentru a începe o discuție cu prietenii tăi.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleOpenNewChat}>
        <Ionicons name="chatbubble-ellipses" size={24} color={colors.white} />
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Contacte (Prieteni)</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.textDark} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Caută în prieteni..."
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
                <Text style={styles.emptyModalText}>
                  {searchQuery ? 'Niciun prieten găsit.' : 'Nu ai adăugat niciun prieten încă.'}
                </Text>
              }
            />
          )}
        </SafeAreaView>
      </Modal>

    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  listContent: { padding: 15, paddingBottom: 80 }, // Spațiu jos pentru butonul plutitor
  
  conversationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 15, marginBottom: 10, borderRadius: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3 },
  avatarContainer: { marginRight: 15 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  
  textContainer: { flex: 1, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: 'bold', color: colors.textDark, flex: 1, marginRight: 10 },
  time: { fontSize: 12, color: colors.textLight },
  lastMessage: { fontSize: 14, color: colors.textLight },
  unreadMessage: { color: colors.textDark, fontWeight: 'bold' },

  emptyContainer: { alignItems: 'center', marginTop: 50, paddingHorizontal: 20 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: colors.textDark, marginTop: 15 },
  emptySubText: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginTop: 10, lineHeight: 20 },

  fab: { position: 'absolute', bottom: 20, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },

  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textDark },
  closeButton: { padding: 5 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, margin: 15, borderRadius: 10, paddingHorizontal: 15, borderWidth: 1, borderColor: colors.border },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 45, fontSize: 16, color: colors.textDark },
  
  modalListContent: { paddingHorizontal: 15, paddingBottom: 20 },
  friendCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatarSmall: { width: 40, height: 40, borderRadius: 20 },
  friendUsername: { fontSize: 13, color: colors.textLight, marginTop: 2 },
  emptyModalText: { textAlign: 'center', color: colors.textLight, marginTop: 30, fontSize: 16 }
});