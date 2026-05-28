import React, { useState, useCallback, useContext, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { friendshipService, Friend, LeaderboardEntry } from '../api/friendshipService';
import { ThemeContext } from '../context/ThemeContext';
import { AlertContext } from '../context/AlertContext';
import { ThemeColors } from '../theme/colors';

type TabType = 'friends' | 'leaderboard';

export default function FriendsScreen() {
  const { colors } = useContext(ThemeContext);
  const { showAlert } = useContext(AlertContext);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFriends = async () => {
    setIsLoading(true);
    try {
      const data = await friendshipService.getFriends();
      setFriends(data);
    } catch (error) {
      console.error('[Eroare UI] Nu am putut încărca prietenii:', error);
      showAlert({ title: t('common.error'), message: t('friends.errorLoad'), hideCancel: true, confirmText: t('common.ok') });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await friendshipService.getLeaderboard();
      setLeaderboard(data);
    } catch (error) {
      console.error('[Eroare UI] Nu am putut încărca leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'friends') {
        fetchFriends();
      } else {
        fetchLeaderboard();
      }
    }, [activeTab]),
  );

  const handleUnfriend = (friendshipId: number, friendName: string) => {
    showAlert({
      title: t('friends.removeFriend'),
      message: t('friends.removeConfirm', { name: friendName }) || `${t('friends.removeFriend')} ${friendName}?`,
      confirmText: t('friends.remove'),
      cancelText: t('common.cancel'),
      isDestructive: true,
      onConfirm: async () => {
        try {
          setFriends((prev) => prev.filter((f) => f.friendship_id !== friendshipId));
          await friendshipService.removeFriendOrRequest(friendshipId);
        } catch (error) {
          console.error('[Eroare UI] Ștergere prieten:', error);
          fetchFriends();
          showAlert({ title: t('common.error'), message: t('friends.errorRemove'), hideCancel: true, confirmText: t('common.ok') });
        }
      },
    });
  };

  const handleBlock = (userId: number, friendName: string) => {
    showAlert({
      title: t('friends.blockUser'),
      message: t('friends.blockConfirm', { name: friendName }),
      confirmText: t('friends.block'),
      cancelText: t('common.cancel'),
      isDestructive: true,
      onConfirm: async () => {
        try {
          setFriends((prev) => prev.filter((f) => f.id !== userId));
          await friendshipService.blockUser(userId);
        } catch (error) {
          console.error('[Eroare UI] Blocare utilizator:', error);
          fetchFriends();
          showAlert({ title: t('common.error'), message: t('friends.errorBlock'), hideCancel: true, confirmText: t('common.ok') });
        }
      },
    });
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const displayName = item.full_name || item.username;

    return (
      <View style={styles.friendCard}>
        <TouchableOpacity
          style={styles.friendInfo}
          onPress={() => navigation.navigate('ProfileScreen', { userId: item.id })}
        >
          {item.profile_picture_url ? (
            <Image source={{ uri: item.profile_picture_url }} style={styles.avatar} />
          ) : (
            <Image source={require('../../assets/user-default.jpg')} style={styles.avatar} />
          )}
          <View style={styles.textContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText} numberOfLines={1}>
                {displayName}
              </Text>
              {item.streak_count && item.streak_count > 0 ? (
                <View style={styles.streakBadge}>
                  <Text style={styles.streakText}>🔥 {item.streak_count}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.usernameText}>@{item.username}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() =>
              navigation.navigate('CallScreen', {
                otherUserId: item.id,
                otherUsername: displayName,
                otherUserAvatar: item.profile_picture_url,
                isVideo: false,
                initiator: 'me',
              })
            }
          >
            <Ionicons name="call" size={18} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.callBtn}
            onPress={() =>
              navigation.navigate('CallScreen', {
                otherUserId: item.id,
                otherUsername: displayName,
                otherUserAvatar: item.profile_picture_url,
                isVideo: true,
                initiator: 'me',
              })
            }
          >
            <Ionicons name="videocam" size={18} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.unfriendBtn}
            onPress={() => handleUnfriend(item.friendship_id, displayName)}
          >
            <Text style={styles.unfriendBtnText}>{t('friends.remove')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.blockBtn}
            onPress={() => handleBlock(item.id, displayName)}
          >
            <Ionicons name="ban" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const displayName = item.full_name || item.username;
    const rank = index + 1;

    return (
      <TouchableOpacity
        style={[styles.leaderboardCard, rank <= 3 && styles.leaderboardTopCard]}
        onPress={() => navigation.navigate('ProfileScreen', { userId: item.id })}
      >
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, rank <= 3 && styles.rankTextTop]}>
            {getRankEmoji(rank)}
          </Text>
        </View>
        {item.profile_picture_url ? (
          <Image source={{ uri: item.profile_picture_url }} style={styles.avatar} />
        ) : (
          <Image source={require('../../assets/user-default.jpg')} style={styles.avatar} />
        )}
        <View style={styles.leaderboardInfo}>
          <Text style={styles.leaderboardName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.leaderboardUsername}>@{item.username}</Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.level}</Text>
            <Text style={styles.statLabel}>Lvl</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.xp}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
          {item.daily_streak > 0 && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>🔥{item.daily_streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && friends.length === 0 && leaderboard.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.topBar, { borderBottomColor: colors.separatorColor }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.iconBg }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.iconColor} />
          </TouchableOpacity>
          <Text style={[styles.logoText, { color: colors.textDark }]}>
            {activeTab === 'friends' ? t('friends.title') : t('friends.leaderboard')}
          </Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={[styles.tabBar, { borderBottomColor: colors.separatorColor }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Ionicons
            name="people"
            size={18}
            color={activeTab === 'friends' ? colors.primary : colors.textLight}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'friends' ? colors.primary : colors.textLight },
            ]}
          >
            {t('friends.title')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Ionicons
            name="trophy"
            size={18}
            color={activeTab === 'leaderboard' ? colors.primary : colors.textLight}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'leaderboard' ? colors.primary : colors.textLight },
            ]}
          >
            {t('friends.leaderboard')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'friends' ? (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderFriendItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyText}>{t('friends.emptyTitle')}</Text>
              <Text style={styles.emptySubText}>
                {t('friends.emptySub')}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderLeaderboardItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.leaderboardHeader}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.leaderboardHeaderText}>
                {t('friends.leaderboardDesc')}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="trophy-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyText}>{t('friends.noLeaderboard')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
    logoText: {
      fontSize: 22,
      fontWeight: '800',
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    tabBar: {
      flexDirection: 'row',
      marginHorizontal: 15,
      marginBottom: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separatorColor,
      overflow: 'hidden',
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      gap: 6,
    },
    activeTab: {
      backgroundColor: colors.primary + '15',
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
    },
    listContent: { padding: 15, paddingBottom: 30 },

    friendCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      padding: 15,
      marginBottom: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    friendInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
    avatar: { width: 46, height: 46, borderRadius: 23, marginRight: 12 },
    avatarPlaceholder: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    textContainer: { flex: 1, justifyContent: 'center' },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    nameText: { fontSize: 16, fontWeight: 'bold', color: colors.textDark, flexShrink: 1 },

    streakBadge: {
      backgroundColor: 'rgba(255, 140, 0, 0.1)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: 6,
    },
    streakText: { fontSize: 12, fontWeight: 'bold', color: '#FF8C00' },

    usernameText: { fontSize: 13, color: colors.textLight },

    actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    callBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.iconBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    unfriendBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    unfriendBtnText: { color: colors.textDark, fontSize: 13, fontWeight: 'bold' },

    blockBtn: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.error,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // Leaderboard styles
    leaderboardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      marginBottom: 10,
    },
    leaderboardHeaderText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textLight,
    },
    leaderboardCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      padding: 14,
      marginBottom: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    leaderboardTopCard: {
      borderColor: '#FFD700',
      borderWidth: 1.5,
    },
    rankContainer: {
      width: 40,
      alignItems: 'center',
      marginRight: 8,
    },
    rankText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textLight,
    },
    rankTextTop: {
      fontSize: 22,
    },
    leaderboardInfo: {
      flex: 1,
      marginRight: 8,
    },
    leaderboardName: {
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.textDark,
    },
    leaderboardUsername: {
      fontSize: 12,
      color: colors.textLight,
      marginTop: 2,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 10,
      color: colors.textLight,
      textTransform: 'uppercase',
    },

    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
    emptyText: { marginTop: 15, fontSize: 18, fontWeight: 'bold', color: colors.textDark },
    emptySubText: {
      fontSize: 15,
      color: colors.textLight,
      textAlign: 'center',
      marginTop: 10,
      lineHeight: 22,
    },
  });
