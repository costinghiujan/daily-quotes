import React, { useState, useCallback, useContext, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { notificationService, AppNotification } from '../api/notificationService';
import { friendshipService } from '../api/friendshipService';
import { ThemeContext } from '../context/ThemeContext';
import { AlertContext } from '../context/AlertContext';
import { useTranslation } from 'react-i18next';

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showAlert } = useContext(AlertContext);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);

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
      console.error('Eroare la incarcarea notificarilor:', error);
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
      console.error('Eroare la reinprospatare:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleMarkAllRead = async () => {
    if (isMarkingAllRead) return;
    setIsMarkingAllRead(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('[Eroare] Mark all as read failed:', error);
      showAlert({ title: t('common.error'), message: t('notifications.errorMarkRead'), hideCancel: true, confirmText: t('common.ok') });
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleAccept = async (notificationId: number, friendshipId: number, username: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, type: 'FRIEND_REQUEST_ACCEPTED' } : n)),
    );
    try {
      await friendshipService.acceptRequest(friendshipId);
      showAlert({ title: t('common.success'), message: t('notifications.accepted', { username }), hideCancel: true, confirmText: t('common.ok') });
    } catch (error) {
      console.error(error);
      fetchNotifications();
      showAlert({ title: t('common.error'), message: t('notifications.errorAccept'), hideCancel: true, confirmText: t('common.ok') });
    }
  };

  const handleDecline = async (notificationId: number, friendshipId: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    try {
      await friendshipService.removeFriendOrRequest(friendshipId);
    } catch (error) {
      console.error(error);
      fetchNotifications();
      showAlert({ title: t('common.error'), message: t('notifications.errorDecline'), hideCancel: true, confirmText: t('common.ok') });
    }
  };

  const getMockAvatar = (id: number) => `https://picsum.photos/seed/notif${id}/100/100`;

  const renderNotificationItem = ({ item }: { item: any }) => {
    const isUnread = item.is_read === false;
    const isFriendRequest = item.type === 'FRIEND_REQUEST';
    const displayName = item.full_name || item.username || 'User';

    let actionText = t('notifications.interacted');
    let IconComponent = <Ionicons name="notifications" size={14} color={colors.primary} />;

    if (item.type === 'FRIEND_REQUEST') {
      actionText = t('notifications.friendRequest');
      IconComponent = <Ionicons name="person-add" size={14} color={colors.primary} />;
    } else if (item.type === 'REACTION_ADDED') {
      actionText = t('notifications.reacted');
      IconComponent = <Ionicons name="heart" size={14} color="#F02849" />;
    } else if (item.type === 'FRIEND_ACCEPTED' || item.type === 'FRIEND_REQUEST_ACCEPTED') {
      actionText = t('notifications.friendAccepted');
      IconComponent = <Ionicons name="people" size={14} color="#45BD62" />;
    } else if (item.type === 'COMMENT_ADDED') {
      actionText = t('notifications.commented');
      IconComponent = <Ionicons name="arrow-undo" size={14} color={colors.primary} />;
    }

    const dateStr = item.created_at
      ? new Date(item.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : t('notifications.justNow');

    return (
      <View style={[styles.card, isUnread ? styles.cardUnread : styles.cardRead]}>
        <View style={styles.cardInner}>
          <Image source={{ uri: item.profile_picture_url || getMockAvatar(item.id || 1) }} style={styles.avatar} />
          
          <View style={styles.contentContainer}>
            <Text style={[styles.messageText, !isUnread && styles.messageTextRead]}>
              <Text style={[styles.usernameText, !isUnread && styles.usernameTextRead]}>{displayName}</Text>
              <Text style={[styles.normalText, !isUnread && styles.normalTextRead]}>{actionText}</Text>
            </Text>
            <Text style={[styles.timeText, !isUnread && styles.timeTextRead]}>{dateStr}</Text>

            {isFriendRequest && (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.success }]}
                  onPress={() => handleAccept(item.id, item.reference_id, item.username)}
                >
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                  <Text style={styles.actionBtnText}>{t('notifications.accept')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.error }]}
                  onPress={() => handleDecline(item.id, item.reference_id)}
                >
                  <Ionicons name="close" size={16} color={colors.white} />
                  <Text style={styles.actionBtnText}>{t('notifications.decline')}</Text>
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

  const unreadNotifications = notifications.filter(n => n.is_read === false);
  const readNotifications = notifications.filter(n => n.is_read === true);

  const sections = [];
  if (unreadNotifications.length > 0) {
    sections.push({
      title: t('notifications.new'),
      data: unreadNotifications,
      showMarkAll: true,
    });
  }
  if (readNotifications.length > 0) {
    sections.push({
      title: t('notifications.old'),
      data: readNotifications,
      showMarkAll: false,
    });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.separatorColor }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LinearGradient
            colors={colors.primaryGradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoIcon}
          >
            <Ionicons name="book" size={18} color="#fff" />
          </LinearGradient>
          <Text style={[styles.logoText, { color: colors.textDark }]}>{t('home.title')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.profileBtn, { backgroundColor: colors.iconBg }]}
          onPress={() => navigation.navigate('ProfileScreen')}
        >
          <Ionicons name="person" size={20} color={colors.iconColor} />
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item: any, index: number) => item.id ? item.id.toString() : index.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={renderNotificationItem}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.sectionHeaderTitle, { color: colors.textDark }]}>{section.title}</Text>
              {section.showMarkAll && (
                <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.unreadBadgeText}>{unreadNotifications.length}</Text>
                </View>
              )}
            </View>
            {section.showMarkAll && (
              <TouchableOpacity onPress={handleMarkAllRead} disabled={isMarkingAllRead}>
                {isMarkingAllRead ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.markReadText, { color: colors.primary }]}>{t('notifications.markAllAsRead')}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 80, paddingHorizontal: 20 }}>
            <Ionicons name="notifications-off-outline" size={64} color={colors.textLight} />
            <Text style={{ marginTop: 15, fontSize: 18, fontWeight: 'bold', color: colors.textDark }}>{t('notifications.emptyStateTitle')}</Text>
            <Text style={{ fontSize: 15, color: colors.textLight, textAlign: 'center', marginTop: 10 }}>{t('notifications.emptyStateSub')}</Text>
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  unreadBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markReadText: {
    fontSize: 14,
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
  cardRead: {
    borderLeftWidth: 6,
    borderLeftColor: 'transparent',
    opacity: 0.75,
  },
  messageTextRead: {
    color: colors.textLight,
  },
  usernameTextRead: {
    color: colors.textLight,
  },
  normalTextRead: {
    color: colors.textLight,
  },
  timeTextRead: {
    color: colors.textMuted,
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
