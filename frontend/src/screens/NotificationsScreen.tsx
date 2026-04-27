import React, { useState, useCallback, useContext, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { notificationService, AppNotification } from '../api/notificationService';
import { friendshipService } from '../api/friendshipService';
import { ThemeContext } from '../context/ThemeContext';

export default function NotificationsScreen() {
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { colors } = useContext(ThemeContext);
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getHistory();
      setNotifications(data);
    } catch (error) {
      console.error('Eroare la încărcarea notificărilor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, []),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await notificationService.getHistory();
      setNotifications(data);
    } catch (error) {
      console.error('Eroare la reîmprospătare:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.log(error);
    }
  };

  const handleAccept = async (notificationId: number, friendshipId: number, username: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, type: 'FRIEND_REQUEST_ACCEPTED' } : n)),
    );
    try {
      await friendshipService.acceptRequest(friendshipId);
      Alert.alert('Succes', `Acum ești prieten cu ${username}!`);
    } catch (error) {
      console.error(error);
      fetchNotifications();
      Alert.alert('Eroare', 'Nu s-a putut accepta cererea.');
    }
  };

  const handleDecline = async (notificationId: number, friendshipId: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    try {
      await friendshipService.removeFriendOrRequest(friendshipId);
    } catch (error) {
      console.error(error);
      fetchNotifications();
      Alert.alert('Eroare', 'Nu s-a putut respinge cererea.');
    }
  };

  const getMockAvatar = (id: number) => `https://picsum.photos/seed/notif${id}/100/100`;

  const renderNotificationItem = ({ item }: { item: any }) => {
    const isUnread = item.is_read === false;
    const isFriendRequest = item.type === 'FRIEND_REQUEST';
    const displayName = item.full_name || item.username || 'User';

    let actionText = ' interacted with you.';
    let IconComponent = <Ionicons name="notifications" size={14} color={colors.primary} />;

    if (item.type === 'FRIEND_REQUEST') {
      actionText = ' sent you a friend request.';
      IconComponent = <Ionicons name="person-add" size={14} color={colors.primary} />;
    } else if (item.type === 'REACTION_ADDED') {
      actionText = ' reacted to your quote.';
      IconComponent = <Ionicons name="heart" size={14} color="#F02849" />;
    } else if (item.type === 'FRIEND_ACCEPTED' || item.type === 'FRIEND_REQUEST_ACCEPTED') {
      actionText = ' and you are now friends.';
      IconComponent = <Ionicons name="people" size={14} color="#45BD62" />;
    } else if (item.type === 'COMMENT_ADDED') {
      actionText = ' replied to your post.';
      IconComponent = <Ionicons name="arrow-undo" size={14} color={colors.primary} />;
    }

    const dateStr = item.created_at ? new Date(item.created_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) : 'Just now';

    return (
      <View style={[styles.card, isUnread && styles.cardUnread]}>
        <View style={styles.cardInner}>
          <Image source={{ uri: item.profile_picture_url || getMockAvatar(item.id || 1) }} style={styles.avatar} />
          
          <View style={styles.contentContainer}>
            <Text style={styles.messageText}>
              <Text style={styles.usernameText}>{displayName}</Text>
              <Text style={styles.normalText}>{actionText}</Text>
            </Text>
            <Text style={styles.timeText}>{dateStr}</Text>

            {isFriendRequest && (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.success }]}
                  onPress={() => handleAccept(item.id, item.reference_id, item.username)}
                >
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                  <Text style={styles.actionBtnText}>Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.error }]}
                  onPress={() => handleDecline(item.id, item.reference_id)}
                >
                  <Ionicons name="close" size={16} color={colors.white} />
                  <Text style={styles.actionBtnText}>Decline</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {!isFriendRequest && (
            <View style={styles.iconContainer}>
               {IconComponent}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading && notifications.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Ionicons name="book" size={28} color={colors.primary} style={{ marginRight: 10 }} />
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.textDark }}>DailyQuotes</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={renderNotificationItem}
        ListHeaderComponent={() => (
          <View style={styles.subHeaderRow}>
            <Text style={styles.subHeaderTitle}>New</Text>
            <TouchableOpacity onPress={handleMarkAllRead}>
              <Text style={styles.markReadText}>Mark all as read</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 80, paddingHorizontal: 20 }}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textLight} />
            <Text style={{ marginTop: 15, fontSize: 18, fontWeight: 'bold', color: colors.textDark }}>Nu ai nicio notificare încă.</Text>
            <Text style={{ fontSize: 15, color: colors.textLight, textAlign: 'center', marginTop: 10 }}>Aici vor apărea reacțiile, comentariile și cererile de prietenie.</Text>
          </View>
        }
      />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textDark,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  subHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  subHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
  },
  markReadText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: 'hidden',
  },
  cardUnread: {
    borderLeftWidth: 6,
    borderLeftColor: colors.primary,
  },
  cardInner: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.textDark,
  },
  usernameText: {
    fontWeight: '700',
  },
  normalText: {
    fontWeight: '400',
  },
  timeText: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 4,
  },
  iconContainer: {
    marginLeft: 10,
    alignSelf: 'flex-end',
    backgroundColor: colors.gray,
    padding: 6,
    borderRadius: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 4,
  },
});
