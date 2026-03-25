import React, { useState, useCallback, useContext, useMemo } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, 
  StyleSheet, ActivityIndicator, Image 
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { messageService, Conversation } from '../api/messageService';
import { ThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

export default function ConversationsScreen() {
  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const navigation = useNavigation<any>();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' });
  };

  const renderItem = ({ item }: { item: Conversation }) => (
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

  if (isLoading && conversations.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.user_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color={colors.textLight} />
            <Text style={styles.emptyText}>Nu ai nicio conversație încă.</Text>
            <Text style={styles.emptySubText}>Găsește prieteni în secțiunea de căutare pentru a începe o discuție.</Text>
          </View>
        }
      />
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  listContent: { padding: 15 },
  
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
  emptySubText: { fontSize: 14, color: colors.textLight, textAlign: 'center', marginTop: 10, lineHeight: 20 }
});