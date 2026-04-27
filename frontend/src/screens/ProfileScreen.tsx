import React, { useState, useCallback, useContext, useLayoutEffect, useMemo } from 'react';
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

import { userService, UserProfile } from '../api/userService';
import { quoteService } from '../api/quoteService';

import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { AlertContext } from '../context/AlertContext';
import { useTranslation } from 'react-i18next';

export default function ProfileScreen() {
  const { colors } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getMyProfile();
      setProfile(data.profile);
      setQuotes(data.quotes);
      setEditFullName(data.profile.full_name || '');
      setEditBio(data.profile.bio || '');
    } catch (error) {
      console.error('Eroare la incarcare profil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, []),
  );

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
        const updatedProfile = await userService.uploadAvatar(pickerResult.assets[0].uri);
        setProfile((prev) =>
          prev ? { ...prev, profile_picture_url: updatedProfile.profile_picture_url } : null,
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

  const currentXp = profile?.xp || 0;
  const currentLevel = profile?.level || 1;
  const xpInCurrentLevel = currentXp % 50;
  const progressPercentage = (xpInCurrentLevel / 50) * 100;

  const getMockImage = (id: number) => `https://picsum.photos/seed/${id}/400/400`;
  const coverPhotoUrl = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200';

  const renderTimelinePost = ({ item, index }: { item: any, index: number }) => {
    return (
      <View style={[styles.feedItem, { backgroundColor: colors.commentBg, borderColor: colors.commentBorder }]}>
        <View style={styles.postHeader}>
          <Image source={{ uri: profile?.profile_picture_url || getMockImage(99) }} style={styles.avatarSmall} />
          <View style={styles.postHeaderInfo}>
            <Text style={[styles.postUserName, { color: colors.textDark }]}>
              {profile?.full_name || profile?.username}
            </Text>
            <Text style={[styles.postSubText, { color: colors.timestampColor }]}>
              {item.created_at ? new Date(item.created_at).toLocaleDateString() : t('home.justNow')}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: colors.errorBg }]}
            onPress={() => handleDeleteQuote(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.postText, { color: colors.textPrimary }]}>
          {'\u201C'}{item.text}{'\u201D'} — {item.author}
        </Text>
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
      <View style={styles.coverPhotoContainer}>
        <Image source={{ uri: coverPhotoUrl }} style={styles.coverPhoto} />
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)']}
          style={styles.coverGradient}
        />
        <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
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
            <TouchableOpacity
              style={[styles.topBarIconBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => navigation.navigate('SettingsScreen')}
              activeOpacity={0.8}
            >
              <Ionicons name="settings" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Profile Card Overlay */}
      <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
        <View style={styles.avatarWrapper}>
          <TouchableOpacity onPress={isEditing ? handlePickImage : undefined} disabled={!isEditing || isUploading} activeOpacity={0.8}>
            <Image
              source={{ uri: profile?.profile_picture_url || getMockImage(99) }}
              style={[styles.mainAvatar, { borderColor: colors.card }]}
            />
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
          {!isEditing && (
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

              {/* Stats Row */}
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
          <View style={styles.tabItem}>
            <Text style={[styles.tabTextActive, { color: colors.textDark }]}>{t('profile.timeline')}</Text>
            <View style={[styles.activeTabLine, { backgroundColor: colors.primary }]} />
          </View>
          <View style={styles.tabItem}>
            <Text style={[styles.tabText, { color: colors.textLight }]}>{t('profile.about')}</Text>
          </View>
          <View style={styles.tabItem}>
            <Text style={[styles.tabText, { color: colors.textLight }]}>{t('profile.friends')}</Text>
          </View>
          <View style={styles.tabItem}>
            <Text style={[styles.tabText, { color: colors.textLight }]}>{t('profile.badges')}</Text>
          </View>
        </View>

        {/* Badges Section */}
        {!isEditing && profile?.badges && profile.badges.length > 0 && (
           <View style={styles.badgesSection}>
              <View style={styles.sectionHeader}>
                 <Text style={[styles.sectionTitle, { color: colors.textDark }]}>{t('profile.badges')}</Text>
                 <Text style={[styles.sectionCount, { color: colors.textLight }]}>{profile.badges.length}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                 {profile.badges.map(badge => (
                    <View key={badge.id} style={styles.badgeItem}>
                       <LinearGradient
                         colors={colors.primaryGradient as [string, string]}
                         start={{ x: 0, y: 0 }}
                         end={{ x: 1, y: 1 }}
                         style={styles.badgeIcon}
                       >
                          <Ionicons name={badge.icon_name as any} size={22} color="#fff" />
                       </LinearGradient>
                       <Text style={[styles.badgeName, { color: colors.textDark }]} numberOfLines={2}>{badge.name}</Text>
                    </View>
                 ))}
              </ScrollView>
           </View>
        )}

        {/* Timeline Posts */}
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
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
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
  badgesSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  badgeItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 72,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeName: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
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
});
