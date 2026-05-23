import React, { useState, useCallback, useContext, useEffect, useLayoutEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

import { userService, UserProfile, AllBadge } from '../api/userService';
import { quoteService } from '../api/quoteService';
import { friendshipService, Friend } from '../api/friendshipService';

import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { AlertContext } from '../context/AlertContext';
import { useTranslation } from 'react-i18next';

type ActiveTab = 'posts' | 'friends' | 'badges';

export default function ProfileScreen() {
  const { colors } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);

  // If userId param is provided, we're viewing someone else's profile
  const viewedUserId = route.params?.userId;
  const isOwnProfile = !viewedUserId || viewedUserId === user?.id;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');

  const [activeTab, setActiveTab] = useState<ActiveTab>('posts');

  // Friends state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isFriendsLoading, setIsFriendsLoading] = useState(false);
  const [friendsSearchQuery, setFriendsSearchQuery] = useState('');
  const [debouncedFriendsQuery, setDebouncedFriendsQuery] = useState('');

  // All badges state
  const [allBadges, setAllBadges] = useState<AllBadge[]>([]);
  const [isBadgesLoading, setIsBadgesLoading] = useState(false);

  // Friendship state for viewing other profiles
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const [isFriendActionLoading, setIsFriendActionLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      if (isOwnProfile) {
        const data = await userService.getMyProfile();
        setProfile(data.profile);
        setQuotes(data.quotes);
        setEditFullName(data.profile.full_name || '');
        setEditBio(data.profile.bio || '');
      } else {
        const data = await userService.getUserProfile(viewedUserId);
        setProfile(data.profile);
        setQuotes(data.quotes);
        // Check friendship status
        try {
          const status = await friendshipService.checkStatus(viewedUserId);
          setFriendshipStatus(status);
        } catch (error) {
          console.error('[Eroare] Verificare status prietenie:', error);
        }
      }
    } catch (error) {
      console.error('Eroare la incarcare profil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFriends = async () => {
    setIsFriendsLoading(true);
    try {
      const data = await friendshipService.getFriends();
      setFriends(data);
    } catch (error) {
      console.error('[Eroare UI] Nu am putut încărca prietenii:', error);
    } finally {
      setIsFriendsLoading(false);
    }
  };

  const fetchAllBadges = async () => {
    setIsBadgesLoading(true);
    try {
      const data = await userService.getAllBadges();
      setAllBadges(data);
    } catch (error) {
      console.error('[Eroare UI] Nu am putut încărca toate insignele:', error);
    } finally {
      setIsBadgesLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [viewedUserId]),
  );

  // Debounce friends search query
  useEffect(() => {
    const cleanQuery = friendsSearchQuery?.trim() || '';

    if (!cleanQuery) {
      setDebouncedFriendsQuery('');
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setDebouncedFriendsQuery(cleanQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [friendsSearchQuery]);

  // Filtered friends based on debounced search query
  const filteredFriends = useMemo(() => {
    const cleanQuery = debouncedFriendsQuery?.trim().toLowerCase() || '';
    if (!cleanQuery) return friends;

    return friends.filter((friend) => {
      const fullName = (friend.full_name || '').toLowerCase();
      const username = (friend.username || '').toLowerCase();
      return fullName.includes(cleanQuery) || username.includes(cleanQuery);
    });
  }, [friends, debouncedFriendsQuery]);

  // Fetch friends/badges data when tab changes
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'friends' && friends.length === 0) {
      fetchFriends();
    }
    if (tab === 'badges' && allBadges.length === 0) {
      fetchAllBadges();
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updatedData = await userService.updateProfile({
        full_name: editFullName,
        bio: editBio,
      });
      setProfile((prev) => (prev ? { ...prev, ...updatedData } : null));
      setIsEditing(false);
      showAlert({ title: t('settings.success'), message: t('profile.profileUpdated'), hideCancel: true, confirmText: 'OK' });
    } catch (error) {
      console.error(error);
      showAlert({ title: t('settings.error'), message: t('profile.updateError'), hideCancel: true, confirmText: 'OK' });
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      showAlert({ title: t('profile.permissionDenied'), message: '', hideCancel: true, confirmText: 'OK' });
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setIsUploading(true);
      try {
        const response = await userService.uploadAvatar(pickerResult.assets[0].uri);
        setProfile((prev) =>
          prev ? { ...prev, profile_picture_url: response.data.profile_picture_url } : null,
        );
        showAlert({ title: t('settings.success'), message: t('profile.photoUpdated'), hideCancel: true, confirmText: t('common.ok') });
      } catch (error) {
        console.error(error);
        showAlert({ title: t('settings.error'), message: t('profile.photoError'), hideCancel: true, confirmText: t('common.ok') });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handlePickCoverPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      showAlert({ title: t('profile.permissionDenied'), message: '', hideCancel: true, confirmText: 'OK' });
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setIsUploadingCover(true);
      try {
        const response = await userService.uploadCoverPhoto(pickerResult.assets[0].uri);
        setProfile((prev) =>
          prev ? { ...prev, cover_photo_url: response.data.cover_photo_url } : null,
        );
        showAlert({ title: t('settings.success'), message: t('profile.photoUpdated'), hideCancel: true, confirmText: t('common.ok') });
      } catch (error) {
        console.error(error);
        showAlert({ title: t('settings.error'), message: t('profile.photoError'), hideCancel: true, confirmText: t('common.ok') });
      } finally {
        setIsUploadingCover(false);
      }
    }
  };

  const handleDeleteQuote = (quoteId: number) => {
    showAlert({
      title: t('profile.deleteQuoteTitle'),
      message: t('profile.deleteQuoteMessage'),
      confirmText: t('profile.delete'),
      cancelText: t('profile.cancel'),
      isDestructive: true,
      onConfirm: async () => {
        try {
          await quoteService.delete(quoteId);
          setQuotes((prevQuotes) => prevQuotes.filter((q) => q.id !== quoteId));
        } catch (error) {
          console.error(error);
          showAlert({
            title: t('settings.error'),
            message: t('profile.errorDelete'),
            hideCancel: true,
            confirmText: t('common.ok'),
          });
        }
      },
    });
  };

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

  const handleAddFriend = async () => {
    if (!viewedUserId) return;
    setIsFriendActionLoading(true);
    try {
      await friendshipService.sendRequest(viewedUserId);
      setFriendshipStatus('pending');
      showAlert({ title: t('common.success'), message: t('search.requestSent'), hideCancel: true, confirmText: t('common.ok') });
    } catch (error: any) {
      showAlert({ title: t('common.error'), message: error.response?.data?.message || t('search.errorRequest'), hideCancel: true, confirmText: t('common.ok') });
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!viewedUserId) return;
    setIsFriendActionLoading(true);
    try {
      // Find the friendship_id from the friends list
      const friendEntry = friends.find(f => f.id === viewedUserId);
      if (friendEntry) {
        await friendshipService.removeFriendOrRequest(friendEntry.friendship_id);
      }
      setFriendshipStatus(null);
      showAlert({ title: t('common.success'), message: t('friends.removeSuccess'), hideCancel: true, confirmText: t('common.ok') });
    } catch (error) {
      console.error('[Eroare] Eliminare prieten:', error);
      showAlert({ title: t('common.error'), message: t('friends.errorRemove'), hideCancel: true, confirmText: t('common.ok') });
    } finally {
      setIsFriendActionLoading(false);
    }
  };

  const currentXp = profile?.xp || 0;
  const currentLevel = profile?.level || 1;
  const xpInCurrentLevel = currentXp % 50;
  const progressPercentage = (xpInCurrentLevel / 50) * 100;

  const coverPhotoUrl = profile?.cover_photo_url || null;

  const renderTimelinePost = ({ item, index }: { item: any, index: number }) => {
    return (
      <View style={[styles.feedItem, { backgroundColor: colors.commentBg, borderColor: colors.commentBorder }]}>
        <View style={styles.postHeader}>
          {profile?.profile_picture_url ? (
            <Image source={{ uri: profile.profile_picture_url }} style={styles.avatarSmall} />
          ) : (
            <Image source={require('../../assets/user-default.jpg')} style={styles.avatarSmall} />
          )}
          <View style={styles.postHeaderInfo}>
            <Text style={[styles.postUserName, { color: colors.textDark }]}>
              {profile?.full_name || profile?.username}
            </Text>
            <Text style={[styles.postSubText, { color: colors.timestampColor }]}>
              {item.created_at ? new Date(item.created_at).toLocaleDateString() : t('home.justNow')}
            </Text>
          </View>
          {isOwnProfile && (
            <TouchableOpacity
              style={[styles.deleteBtn, { backgroundColor: colors.errorBg }]}
              onPress={() => handleDeleteQuote(item.id)}
            >
              <Ionicons name="trash-outline" size={16} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.postText, { color: colors.textPrimary }]}>
          {'\u201C'}{item.text}{'\u201D'} — {item.author}
        </Text>
      </View>
    );
  };

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const displayName = item.full_name || item.username;

    return (
      <View style={styles.friendCard}>
        <TouchableOpacity
          style={styles.friendInfo}
          onPress={() => navigation.push('ProfileScreen', { userId: item.id })}
        >
          {item.profile_picture_url ? (
            <Image source={{ uri: item.profile_picture_url }} style={styles.friendAvatar} />
          ) : (
            <Image source={require('../../assets/user-default.jpg')} style={styles.friendAvatar} />
          )}
          <View style={styles.friendTextContainer}>
            <View style={styles.friendNameRow}>
              <Text style={[styles.friendNameText, { color: colors.textDark }]} numberOfLines={1}>
                {displayName}
              </Text>
              {item.streak_count && item.streak_count > 0 ? (
                <View style={[styles.streakBadge, { backgroundColor: colors.streakBadgeBg }]}>
                  <Text style={[styles.streakText, { color: colors.streakBadgeText }]}>🔥 {item.streak_count}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.friendUsernameText, { color: colors.textLight }]}>@{item.username}</Text>
          </View>
        </TouchableOpacity>

        {isOwnProfile && (
          <View style={styles.friendActionButtons}>
            <TouchableOpacity
              style={[styles.unfriendBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => handleUnfriend(item.friendship_id, displayName)}
            >
              <Text style={[styles.unfriendBtnText, { color: colors.textDark }]}>{t('friends.remove')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.blockBtn, { backgroundColor: colors.error }]}
              onPress={() => handleBlock(item.id, displayName)}
            >
              <Ionicons name="ban" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderBadgeItem = (badge: AllBadge) => {
    const isEarned = badge.earned;
    return (
      <View key={badge.id} style={styles.allBadgeItem}>
        <LinearGradient
          colors={isEarned ? (colors.primaryGradient as [string, string]) : [colors.badgeUnearned, colors.badgeUnearned]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.allBadgeIcon, !isEarned && { opacity: 0.6 }]}
        >
          <Ionicons name={badge.icon_name as any} size={24} color={isEarned ? '#fff' : colors.textMuted} />
        </LinearGradient>
        <Text style={[styles.allBadgeName, { color: isEarned ? colors.textDark : colors.textMuted }]} numberOfLines={2}>
          {badge.name}
        </Text>
        <Text style={[styles.allBadgeDesc, { color: colors.textLight }]} numberOfLines={2}>
          {badge.description}
        </Text>
        {isEarned && badge.earned_at && (
          <Text style={[styles.allBadgeDate, { color: colors.primary }]}>
            {new Date(badge.earned_at).toLocaleDateString()}
          </Text>
        )}
      </View>
    );
  };

  if (isLoading && !profile) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false} bounces={false}>
      {/* Cover Photo Area with Gradient Overlay */}
      <View style={[styles.coverPhotoContainer, !coverPhotoUrl && { backgroundColor: colors.coverPhotoPlaceholder }]}>
        {coverPhotoUrl ? (
          <Image source={{ uri: coverPhotoUrl }} style={styles.coverPhoto} />
        ) : null}
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)']}
          style={styles.coverGradient}
        />
        {isEditing && (
          <TouchableOpacity
            style={[styles.coverCameraBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            onPress={handlePickCoverPhoto}
            disabled={isUploadingCover}
            activeOpacity={0.8}
          >
            {isUploadingCover ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        )}
        <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
          {!isOwnProfile && (
            <TouchableOpacity
              style={[styles.topBarBackBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
          )}
          <LinearGradient
            colors={colors.primaryGradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topBarLogo}
          >
            <Ionicons name="book" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{t('home.title')}</Text>
          </LinearGradient>
          <View style={styles.statusIcons}>
            {isOwnProfile && (
              <TouchableOpacity
                style={[styles.topBarIconBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                onPress={() => navigation.navigate('SettingsScreen')}
                activeOpacity={0.8}
              >
                <Ionicons name="settings" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Main Profile Card Overlay */}
      <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
        <View style={styles.avatarWrapper}>
          <TouchableOpacity onPress={isEditing ? handlePickImage : undefined} disabled={!isEditing || isUploading} activeOpacity={0.8}>
            {profile?.profile_picture_url ? (
              <Image
                source={{ uri: profile.profile_picture_url }}
                style={[styles.mainAvatar, { borderColor: colors.card }]}
              />
            ) : (
              <Image
                source={require('../../assets/user-default.jpg')}
                style={[styles.mainAvatar, { borderColor: colors.card }]}
              />
            )}
            {isUploading && (
               <View style={[styles.avatarOverlay, { borderColor: colors.card }]}>
                  <ActivityIndicator size="small" color="#fff" />
               </View>
            )}
            {isEditing && (
              <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          {isOwnProfile && !isEditing && (
            <TouchableOpacity
              style={[styles.editBadge, { backgroundColor: colors.primary }]}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="pencil" size={14} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {!isEditing ? (
           <>
              <Text style={[styles.nameText, { color: colors.textDark }]}>
                 {profile?.full_name || profile?.username}
              </Text>
              <View style={styles.levelRow}>
                <LinearGradient
                  colors={(colors.levelBadgeBg ? [colors.levelBadgeBg, colors.levelBadgeBg] : colors.primaryGradient) as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.levelBadge, { borderColor: colors.levelBadgeBorder }]}
                >
                  <Ionicons name="star" size={12} color={colors.levelBadgeText} />
                  <Text style={[styles.levelBadgeText, { color: colors.levelBadgeText }]}>Lvl {currentLevel}</Text>
                </LinearGradient>
              </View>
              <Text style={[styles.bioText, { color: colors.textLight }]}>
                {profile?.bio || t('profile.bioPlaceholder')}
              </Text>

              {/* XP Progress Bar */}
              <View style={[styles.xpContainer, { backgroundColor: colors.profileStatBg, borderColor: colors.profileStatBorder }]}>
                <View style={styles.xpHeader}>
                  <Text style={[styles.xpLabel, { color: colors.textLight }]}>{t('profile.levelProgress')}</Text>
                  <Text style={[styles.xpNumbers, { color: colors.primary }]}>{xpInCurrentLevel} / 50 XP</Text>
                </View>
                <View style={[styles.progressBarBackground, { backgroundColor: colors.progressBarBg }]}>
                  <LinearGradient
                    colors={colors.progressBarFillGradient as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressBarFill, { width: `${progressPercentage}%` }]}
                  />
                </View>
              </View>

              {/* Stats Row - smaller numbers */}
              <View style={styles.statsRow}>
                <View style={[styles.statItem, { backgroundColor: colors.profileStatBg, borderColor: colors.profileStatBorder }]}>
                  <Text style={[styles.statNumber, { color: colors.textDark }]}>{quotes.length}</Text>
                  <Text style={[styles.statLabel, { color: colors.textLight }]}>{t('profile.quotes')}</Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: colors.profileStatBg, borderColor: colors.profileStatBorder }]}>
                  <Text style={[styles.statNumber, { color: colors.textDark }]}>{profile?.xp || 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.textLight }]}>XP</Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: colors.profileStatBg, borderColor: colors.profileStatBorder }]}>
                  <Text style={[styles.statNumber, { color: colors.textDark }]}>{profile?.badges?.length || 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.textLight }]}>{t('profile.badges')}</Text>
                </View>
              </View>

              {/* Friend action buttons for other users' profiles */}
              {!isOwnProfile && (
                <View style={styles.friendActionRow}>
                  {friendshipStatus === 'accepted' || friendshipStatus === 'FRIENDS' ? (
                    <TouchableOpacity
                      style={[styles.friendActionBtn, { backgroundColor: colors.error }]}
                      onPress={handleRemoveFriend}
                      disabled={isFriendActionLoading}
                    >
                      {isFriendActionLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="person-remove" size={18} color="#fff" />
                          <Text style={styles.friendActionBtnText}>{t('friends.removeFriend')}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : friendshipStatus === 'pending' ? (
                    <View style={[styles.friendActionBtn, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="time" size={18} color="#fff" />
                      <Text style={styles.friendActionBtnText}>{t('search.pending')}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.friendActionBtn, { backgroundColor: colors.primary }]}
                      onPress={handleAddFriend}
                      disabled={isFriendActionLoading}
                    >
                      {isFriendActionLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="person-add" size={18} color="#fff" />
                          <Text style={styles.friendActionBtnText}>{t('search.addFriend')}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.friendActionBtn, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.navigate('ChatScreen', {
                      userId: viewedUserId,
                      username: profile?.username,
                      avatar: profile?.profile_picture_url,
                    })}
                  >
                    <Ionicons name="chatbubble" size={18} color="#fff" />
                    <Text style={styles.friendActionBtnText}>{t('profile.sendMessage')}</Text>
                  </TouchableOpacity>
                </View>
              )}
           </>
        ) : (
           <View style={styles.editContainer}>
             <TextInput
               style={[styles.inputField, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textDark }]}
               placeholder={t('profile.fullNamePlaceholder')}
               placeholderTextColor={colors.textMuted}
               value={editFullName}
               onChangeText={setEditFullName}
             />
             <TextInput
               style={[styles.inputField, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textDark, height: 80 }]}
               placeholder={t('profile.bioPlaceholder')}
               placeholderTextColor={colors.textMuted}
               value={editBio}
               onChangeText={setEditBio}
               multiline
             />
             <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 10 }}>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.success }]}
                  onPress={handleSaveProfile}
                >
                   <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{t('profile.save')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.error }]}
                  onPress={() => setIsEditing(false)}
                >
                   <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>{t('profile.cancel')}</Text>
                </TouchableOpacity>
             </View>
           </View>
        )}

        {/* Tabs */}
        <View style={[styles.tabsContainer, { borderBottomColor: colors.separatorColor }]}>
          <TouchableOpacity style={styles.tabItem} onPress={() => handleTabChange('posts')}>
            <Text style={[activeTab === 'posts' ? styles.tabTextActive : styles.tabText, { color: activeTab === 'posts' ? colors.textDark : colors.textLight }]}>
              {t('profile.posts')}
            </Text>
            {activeTab === 'posts' && <View style={[styles.activeTabLine, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => handleTabChange('friends')}>
            <Text style={[activeTab === 'friends' ? styles.tabTextActive : styles.tabText, { color: activeTab === 'friends' ? colors.textDark : colors.textLight }]}>
              {t('profile.friends')}
            </Text>
            {activeTab === 'friends' && <View style={[styles.activeTabLine, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => handleTabChange('badges')}>
            <Text style={[activeTab === 'badges' ? styles.tabTextActive : styles.tabText, { color: activeTab === 'badges' ? colors.textDark : colors.textLight }]}>
              {t('profile.badges')}
            </Text>
            {activeTab === 'badges' && <View style={[styles.activeTabLine, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <>
            {/* Posts */}
            {quotes.map((item, index) => (
               <View key={item.id || index}>
                 {renderTimelinePost({ item, index })}
               </View>
            ))}

            {quotes.length === 0 && (
               <View style={styles.emptyQuotes}>
                 <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.textMuted} />
                 <Text style={[styles.emptyQuotesText, { color: colors.textLight }]}>{t('profile.noQuotes')}</Text>
               </View>
            )}
          </>
        )}

        {activeTab === 'friends' && (
          <>
            {/* Friends Search Bar */}
            <View style={[styles.friendsSearchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="search" size={18} color={colors.textLight} style={styles.friendsSearchIcon} />
              <TextInput
                style={[styles.friendsSearchInput, { color: colors.textDark }]}
                placeholder={t('friends.searchPlaceholder')}
                placeholderTextColor={colors.textLight}
                value={friendsSearchQuery}
                onChangeText={setFriendsSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {friendsSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setFriendsSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textLight} />
                </TouchableOpacity>
              )}
            </View>

            {isFriendsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 30 }} />
            ) : filteredFriends.length > 0 ? (
              filteredFriends.map((friend) => (
                <View key={friend.id}>
                  {renderFriendItem({ item: friend })}
                </View>
              ))
            ) : friends.length > 0 && friendsSearchQuery.trim() !== '' ? (
              <View style={styles.emptySection}>
                <Ionicons name="search-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptySectionText, { color: colors.textLight }]}>
                  {t('friends.noFriendsFound')}
                </Text>
              </View>
            ) : (
              <View style={styles.emptySection}>
                <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptySectionText, { color: colors.textLight }]}>{t('friends.emptyTitle')}</Text>
                <Text style={[styles.emptySectionSubtext, { color: colors.textMuted }]}>{t('friends.emptySub')}</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'badges' && (
          <>
            {isBadgesLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 30 }} />
            ) : allBadges.length > 0 ? (
              <View style={styles.allBadgesGrid}>
                {allBadges.map((badge) => renderBadgeItem(badge))}
              </View>
            ) : (
              <View style={styles.emptySection}>
                <Ionicons name="trophy-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptySectionText, { color: colors.textLight }]}>{t('profile.noBadges')}</Text>
              </View>
            )}
          </>
        )}

      </View>
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  coverPhotoContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  coverCameraBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  topBarBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusIcons: {
    flexDirection: 'row',
  },
  topBarIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginTop: -45,
    marginBottom: 10,
    position: 'relative',
    alignSelf: 'center',
  },
  mainAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
  },
  mainAvatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
     position: 'absolute',
     width: 90,
     height: 90,
     borderRadius: 45,
     backgroundColor: 'rgba(0,0,0,0.5)',
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 4,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    borderRadius: 14,
    padding: 6,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    borderRadius: 16,
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  levelRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  levelBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  bioText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  editContainer: {
    marginBottom: 20,
  },
  inputField: {
     borderWidth: 1,
     borderRadius: 12,
     padding: 14,
     marginBottom: 12,
     fontSize: 15,
  },
  btn: {
     paddingHorizontal: 24,
     paddingVertical: 12,
     borderRadius: 12,
  },
  xpContainer: {
    width: '100%',
    marginBottom: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpLabel: { fontSize: 13, fontWeight: '600' },
  xpNumbers: { fontSize: 13, fontWeight: 'bold' },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  friendActionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  friendActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  friendActionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 20,
  },
  tabItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabTextActive: {
    fontSize: 14,
    fontWeight: '700',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabLine: {
    marginTop: 8,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
  // Posts
  feedItem: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  avatarSmallPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postHeaderInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: 15,
    fontWeight: '700',
  },
  postSubText: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  emptyQuotes: {
    alignItems: 'center',
    marginTop: 20,
  },
  emptyQuotesText: {
    fontSize: 15,
    marginTop: 8,
  },
  // Friends Search
  friendsSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  friendsSearchIcon: { marginRight: 8 },
  friendsSearchInput: { flex: 1, height: 44, fontSize: 15 },

  // Friends
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  friendAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  friendTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  friendNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  friendNameText: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  streakBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  streakText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  friendUsernameText: {
    fontSize: 13,
  },
  friendActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unfriendBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  unfriendBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  blockBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Badges
  allBadgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  allBadgeItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  allBadgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  allBadgeName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  allBadgeDesc: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  allBadgeDate: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  emptySection: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  emptySectionText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  emptySectionSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
