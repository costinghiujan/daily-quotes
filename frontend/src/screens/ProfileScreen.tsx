import React, { useState, useCallback, useContext, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { userService, UserProfile } from '../api/userService';
import { quoteService } from '../api/quoteService';

import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

export default function ProfileScreen() {
  const { theme, colors } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

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
      console.error('Eroare la încărcare profil:', error);
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
      Alert.alert('Succes', 'Profilul a fost actualizat!');
    } catch (error) {
      console.error(error);
      Alert.alert('Eroare', 'Nu am putut salva modificările.');
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Atenție', 'Avem nevoie de permisiunea ta pentru a accesa galeria foto!');
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
        Alert.alert('Succes', 'Fotografia de profil a fost actualizată!');
      } catch (error) {
        console.error(error);
        Alert.alert('Eroare', 'Nu s-a putut încărca fotografia.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDeleteQuote = (quoteId: number) => {
    Alert.alert(
      'Șterge Citatul',
      'Ești sigur că vrei să ștergi acest citat?',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Șterge',
          style: 'destructive',
          onPress: async () => {
            try {
              await quoteService.delete(quoteId);
              setQuotes((prevQuotes) => prevQuotes.filter((q) => q.id !== quoteId));
            } catch (error) {
              console.error(error);
              Alert.alert('Eroare', 'Nu s-a putut șterge citatul.');
            }
          },
        },
      ],
    );
  };

  const currentXp = profile?.xp || 0;
  const currentLevel = profile?.level || 1;
  const xpInCurrentLevel = currentXp % 50;
  const progressPercentage = (xpInCurrentLevel / 50) * 100;

  const getMockImage = (id: number) => `https://picsum.photos/seed/${id}/400/400`;
  const coverPhotoUrl = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200';

  const renderTimelinePost = ({ item, index }: { item: any, index: number }) => {
    return (
      <View style={styles.feedItem}>
        <View style={styles.postHeader}>
          <Image source={{ uri: profile?.profile_picture_url || getMockImage(99) }} style={styles.avatarSmall} />
          <View style={styles.postHeaderInfo}>
            <Text style={styles.postUserName}>{profile?.full_name || profile?.username}</Text>
            <Text style={styles.postSubText}>
              {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Just now'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handleDeleteQuote(item.id)}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

        <Text style={styles.postText}>&quot;{item.text}&quot; — {item.author}</Text>
      </View>
    );
  };

  if (isLoading && !profile) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.white }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.white }]} showsVerticalScrollIndicator={false} bounces={false}>
      {/* Cover Photo Area */}
      <View style={styles.coverPhotoContainer}>
        <Image source={{ uri: coverPhotoUrl }} style={styles.coverPhoto} />
        <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="book" size={24} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>DailyQuotes</Text>
          </View>
          <View style={styles.statusIcons}>
            <Ionicons name="settings" size={24} color="#fff" onPress={() => navigation.navigate('SettingsScreen')} />
          </View>
        </View>
      </View>

      {/* Main Profile Card Overlay */}
      <View style={styles.profileCard}>
        <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickImage} disabled={isUploading}>
          <Image 
            source={{ uri: profile?.profile_picture_url || getMockImage(99) }} 
            style={styles.mainAvatar} 
          />
          {isUploading && (
             <View style={styles.avatarOverlay}>
                <ActivityIndicator size="small" color="#fff" />
             </View>
          )}
        </TouchableOpacity>

        {!isEditing ? (
           <>
              <Text style={styles.nameText}>
                 {profile?.full_name || profile?.username}
                 <Text style={styles.levelBadgeText}> Lvl {currentLevel}</Text>
              </Text>
              <Text style={styles.locationText}>{profile?.bio || 'Add a bio...'}</Text>

              {/* BARA DE XP */}
              <View style={styles.xpContainer}>
                <View style={styles.xpHeader}>
                  <Text style={styles.xpLabel}>Progres Nivel</Text>
                  <Text style={styles.xpNumbers}>{xpInCurrentLevel} / 50 XP</Text>
                </View>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.circleActionBtn} onPress={() => setIsEditing(true)}>
                  <View style={styles.iconCircleBg}>
                     <Ionicons name="pencil" size={22} color={colors.primary} />
                  </View>
                  <Text style={styles.actionBtnLabel}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.circleActionBtn} onPress={() => navigation.navigate('SettingsScreen')}>
                  <View style={styles.iconCircleBg}>
                     <Ionicons name="settings" size={22} color={colors.primary} />
                  </View>
                  <Text style={styles.actionBtnLabel}>More</Text>
                </TouchableOpacity>
              </View>
           </>
        ) : (
           <View style={{ marginBottom: 20 }}>
             <TextInput
               style={styles.inputField}
               placeholder="Nume Complet"
               placeholderTextColor={colors.textLight}
               value={editFullName}
               onChangeText={setEditFullName}
             />
             <TextInput
               style={[styles.inputField, { height: 60 }]}
               placeholder="O scurtă descriere (Bio)"
               placeholderTextColor={colors.textLight}
               value={editBio}
               onChangeText={setEditBio}
               multiline
             />
             <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 10 }}>
                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.success }]} onPress={handleSaveProfile}>
                   <Text style={{ color: '#fff', fontWeight: 'bold' }}>Salvare</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, { backgroundColor: colors.error }]} onPress={() => setIsEditing(false)}>
                   <Text style={{ color: '#fff', fontWeight: 'bold' }}>Anulare</Text>
                </TouchableOpacity>
             </View>
           </View>
        )}

        <View style={styles.tabsContainer}>
          <View style={styles.tabItem}>
            <Text style={styles.tabTextActive}>Timeline</Text>
            <View style={styles.activeWavyLine} />
          </View>
          <View style={styles.tabItem}><Text style={styles.tabText}>About</Text></View>
          <View style={styles.tabItem}><Text style={styles.tabText}>Friends</Text></View>
          <View style={styles.tabItem}><Text style={styles.tabText}>Badges</Text></View>
        </View>

        {!isEditing && profile?.badges && profile.badges.length > 0 && (
           <View style={{ marginBottom: 20 }}>
              <View style={styles.sectionHeader}>
                 <Text style={styles.sectionTitle}>Badges <Text style={styles.sectionCount}>{profile.badges.length}</Text></Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                 {profile.badges.map(badge => (
                    <View key={badge.id} style={{ alignItems: 'center', marginRight: 15, width: 70 }}>
                       <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                          <Ionicons name={badge.icon_name as any} size={24} color="#fff" />
                       </View>
                       <Text style={{ fontSize: 11, textAlign: 'center', color: colors.textDark }}>{badge.name}</Text>
                    </View>
                 ))}
              </ScrollView>
           </View>
        )}

        {quotes.map((item, index) => (
           <View key={item.id || index}>
             {renderTimelinePost({ item, index })}
           </View>
        ))}

        {quotes.length === 0 && (
           <Text style={{ textAlign: 'center', color: colors.textLight, marginTop: 20 }}>Nu ai adăugat niciun citat încă.</Text>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  timeStatus: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusIcons: {
    flexDirection: 'row',
  },
  profileCard: {
    marginTop: -40,
    backgroundColor: '#FFFFFF',
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
    borderColor: '#FFFFFF',
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
     borderColor: '#FFFFFF',
  },
  nameText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C1E21',
    textAlign: 'center',
    marginBottom: 4,
  },
  levelBadgeText: {
    fontSize: 14,
    color: '#1877F2',
    fontWeight: 'bold',
  },
  locationText: {
    fontSize: 14,
    color: '#8A8D91',
    textAlign: 'center',
    marginBottom: 15,
  },
  inputField: {
     borderWidth: 1,
     borderColor: '#EAEAEA',
     backgroundColor: '#F0F2F5',
     borderRadius: 8,
     padding: 12,
     marginBottom: 10,
     color: '#1C1E21',
  },
  btn: {
     paddingHorizontal: 20,
     paddingVertical: 10,
     borderRadius: 8,
  },
  xpContainer: { width: '100%', marginBottom: 20 },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  xpLabel: { fontSize: 12, color: '#8A8D91', fontWeight: '600' },
  xpNumbers: { fontSize: 12, color: '#1877F2', fontWeight: 'bold' },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#F0F2F5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1877F2',
    borderRadius: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 25,
    gap: 25,
  },
  circleActionBtn: {
    alignItems: 'center',
  },
  iconCircleBg: {
     width: 44,
     height: 44,
     borderRadius: 22,
     backgroundColor: '#F0F2F5',
     justifyContent: 'center',
     alignItems: 'center',
  },
  actionBtnLabel: {
    fontSize: 12,
    color: '#8A8D91',
    marginTop: 6,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    paddingBottom: 15,
    marginBottom: 20,
  },
  tabItem: {
    alignItems: 'center',
  },
  tabTextActive: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1E21',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8A8D91',
  },
  activeWavyLine: {
    marginTop: 8,
    width: 30,
    height: 3,
    backgroundColor: '#1877F2',
    borderRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1E21',
  },
  sectionCount: {
    fontSize: 14,
    color: '#8A8D91',
    fontWeight: '500',
  },
  feedItem: {
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 12,
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
    color: '#1C1E21',
  },
  postSubText: {
    fontSize: 12,
    color: '#8A8D91',
    marginTop: 2,
  },
  postText: {
    fontSize: 15,
    color: '#1C1E21',
    lineHeight: 22,
    fontStyle: 'italic',
  },
});
