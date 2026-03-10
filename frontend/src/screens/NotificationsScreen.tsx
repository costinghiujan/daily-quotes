import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { notificationService, AppNotification } from '../api/notificationService';
import { friendshipService } from '../api/friendshipService'; // Păstrăm serviciul tău pentru butoane
import { colors } from '../theme/colors';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getHistory();
      setNotifications(data);
      
      const hasUnread = data.some(n => !n.is_read);
      if (hasUnread) {
        await notificationService.markAllAsRead();
      }
    } catch (error) {
      console.error('Eroare la încărcarea notificărilor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await notificationService.getHistory();
      setNotifications(data);
      if (data.some(n => !n.is_read)) {
        await notificationService.markAllAsRead();
      }
    } catch (error) {
      console.error('Eroare la reîmprospătare:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleAccept = async (notificationId: number, friendshipId: number, username: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, type: 'FRIEND_ACCEPTED' } : n
    ));

    try {
      await friendshipService.acceptRequest(friendshipId);
      Alert.alert('Succes', `Acum ești prieten cu ${username}!`);
    } catch (error) {
      // Robustețe: Revert în caz de eroare de rețea
      fetchNotifications();
      Alert.alert('Eroare', 'Nu s-a putut accepta cererea.');
    }
  };

  const handleDecline = async (notificationId: number, friendshipId: number) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));

    try {
      await friendshipService.removeFriendOrRequest(friendshipId);
    } catch (error) {
      fetchNotifications();
      Alert.alert('Eroare', 'Nu s-a putut respinge cererea.');
    }
  };

  const renderNotificationItem = ({ item }: { item: AppNotification }) => {
    const isFriendRequest = item.type === 'FRIEND_REQUEST';
    const date = new Date(item.created_at).toLocaleDateString('ro-RO', { hour: '2-digit', minute: '2-digit' });
    const displayName = item.full_name || item.username;

    return (
      <View style={[styles.card, !item.is_read && styles.unreadCard]}>
        {item.profile_picture_url ? (
          <Image source={{ uri: item.profile_picture_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
        )}

        <View style={styles.contentContainer}>
          <Text style={styles.messageText}>
            <Text style={styles.usernameText}>{displayName}</Text> 
            {isFriendRequest && ' ți-a trimis o cerere de prietenie.'}
            {item.type === 'REACTION_ADDED' && ' a reacționat la citatul tău.'}
            {item.type === 'FRIEND_ACCEPTED' && ' ți-a acceptat cererea de prietenie.'}
          </Text>
          <Text style={styles.timeText}>{date}</Text>
        </View>

        {isFriendRequest ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => handleAccept(item.id, item.reference_id, item.username)}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: '#F44336' }]}
              onPress={() => handleDecline(item.id, item.reference_id)}
            >
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.iconContainer}>
            {item.type === 'REACTION_ADDED' && <Ionicons name="heart" size={24} color="#E91E63" />}
            {item.type === 'FRIEND_ACCEPTED' && <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />}
          </View>
        )}
      </View>
    );
  };

  if (isLoading && notifications.length === 0) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nu ai nicio notificare încă.</Text>
            <Text style={styles.emptySubText}>Aici vor apărea reacțiile și cererile de prietenie.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 15 },
  
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, marginBottom: 10, borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  unreadCard: { backgroundColor: '#e3f2fd', borderWidth: 1, borderColor: '#bbdefb' },
  
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  
  contentContainer: { flex: 1, paddingRight: 10 },
  messageText: { fontSize: 14, color: '#333', lineHeight: 20 },
  usernameText: { fontWeight: 'bold', fontSize: 15 },
  timeText: { fontSize: 12, color: '#888', marginTop: 4 },
  
  actionButtons: { flexDirection: 'row', gap: 8 },
  iconButton: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  
  iconContainer: { justifyContent: 'center', alignItems: 'center', width: 30 },
  
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
  emptyText: { marginTop: 15, fontSize: 18, fontWeight: 'bold', color: '#555' },
  emptySubText: { fontSize: 15, color: '#777', textAlign: 'center', marginTop: 10, lineHeight: 22 },
});