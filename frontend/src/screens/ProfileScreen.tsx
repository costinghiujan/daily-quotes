import React, { useState, useCallback, useContext, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { userService, UserProfile } from '../api/userService';
import { quoteService } from '../api/quoteService';

import { ThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

export default function ProfileScreen() {
  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const navigation = useNavigation<any>();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');

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
      'Ești sigur că vrei să ștergi acest citat? Acțiunea este ireversibilă.',
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

  const renderQuoteItem = ({ item }: { item: any }) => (
    <View style={styles.quoteCard}>
      <View style={styles.quoteCardHeader}>
        <Text style={styles.quoteText}>&quot;{item.text}&quot;</Text>
        <TouchableOpacity onPress={() => handleDeleteQuote(item.id)} style={styles.deleteQuoteBtn}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
      <Text style={styles.quoteAuthor}>— {item.author}</Text>
    </View>
  );

  const renderProfileHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.settingsBtn}
        onPress={() => navigation.navigate('SettingsScreen')}
      >
        <Ionicons name="settings-outline" size={26} color={colors.textDark} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handlePickImage}
        disabled={isUploading}
        style={styles.avatarContainer}
      >
        {profile?.profile_picture_url ? (
          <Image source={{ uri: profile.profile_picture_url }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={40} color={colors.white} />
          </View>
        )}
        <View style={styles.avatarOverlay}>
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="camera" size={16} color={colors.white} />
          )}
        </View>
      </TouchableOpacity>

      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nume Complet"
            placeholderTextColor={colors.textLight}
            value={editFullName}
            onChangeText={setEditFullName}
          />
          <TextInput
            style={[styles.input, { height: 60 }]}
            placeholder="O scurtă descriere (Bio)"
            placeholderTextColor={colors.textLight}
            value={editBio}
            onChangeText={setEditBio}
            multiline
          />
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.success }]}
              onPress={handleSaveProfile}
            >
              <Text style={styles.btnText}>Salvează</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.error }]}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.btnText}>Anulează</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.infoContainer}>
          <View style={styles.nameLevelRow}>
            <Text style={styles.fullName}>{profile?.full_name || 'Nume nesetat'}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Lvl {currentLevel}</Text>
            </View>
          </View>
          <Text style={styles.username}>@{profile?.username}</Text>
          {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

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

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
              <Ionicons name="pencil" size={16} color={colors.white} />
              <Text style={[styles.btnText, { marginLeft: 6 }]}>Editează Profilul</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* SECȚIUNEA DE INSIGNE (Apare doar dacă nu suntem în modul editare) */}
      {!isEditing && profile?.badges && profile.badges.length > 0 && (
        <View style={styles.badgesSection}>
          <Text style={styles.badgesSectionTitle}>Insigne Deblocate</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesScroll}
          >
            {profile.badges.map((badge) => (
              <View key={badge.id} style={styles.badgeItem}>
                <View style={styles.badgeIconContainer}>
                  <Ionicons name={badge.icon_name as any} size={28} color={colors.white} />
                </View>
                <Text style={styles.badgeName} numberOfLines={2}>
                  {badge.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  if (isLoading && !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderQuoteItem}
        ListHeaderComponent={renderProfileHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>Nu ai adăugat niciun citat încă.</Text>}
      />
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
    header: {
      backgroundColor: colors.card,
      paddingTop: 20,
      paddingBottom: 25,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      position: 'relative',
    },
    settingsBtn: {
      position: 'absolute',
      top: 15,
      right: 15,
      padding: 5,
      zIndex: 10,
    },
    avatarContainer: { position: 'relative', marginBottom: 15, marginTop: 10 },
    avatarImage: { width: 100, height: 100, borderRadius: 50 },
    avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarOverlay: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.card,
    },
    infoContainer: { alignItems: 'center', width: '100%', paddingHorizontal: 20 },
    nameLevelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    fullName: { fontSize: 20, fontWeight: 'bold', color: colors.textDark, marginRight: 8 },

    levelBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    levelBadgeText: { color: colors.white, fontSize: 12, fontWeight: 'bold' },
    xpContainer: { width: '100%', marginVertical: 15 },
    xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    xpLabel: { fontSize: 12, color: colors.textLight, fontWeight: '600' },
    xpNumbers: { fontSize: 12, color: colors.primary, fontWeight: 'bold' },
    progressBarBackground: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    badgesSection: { width: '100%', marginTop: 25, paddingLeft: 20 },
    badgesSectionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.textDark,
      marginBottom: 10,
    },
    badgesScroll: { paddingRight: 20 },
    badgeItem: { alignItems: 'center', marginRight: 15, width: 70 },
    badgeIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
      elevation: 3,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },
    badgeName: { fontSize: 11, color: colors.textDark, textAlign: 'center', fontWeight: '500' },

    username: { fontSize: 14, color: colors.textLight, marginBottom: 10 },
    bio: {
      fontSize: 15,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: 10,
    },

    actionButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      flexWrap: 'wrap',
    },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
    },
    btnText: { color: colors.white, fontWeight: 'bold', fontSize: 13 },

    editContainer: { width: '100%', paddingHorizontal: 20 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 10,
      marginBottom: 10,
      backgroundColor: colors.background,
      color: colors.textDark,
    },
    actionButtons: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
    btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    listContent: { paddingBottom: 20 },

    quoteCard: {
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      marginHorizontal: 15,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    quoteCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 5,
    },
    quoteText: {
      flex: 1,
      fontSize: 16,
      fontStyle: 'italic',
      color: colors.textDark,
      paddingRight: 10,
    },
    deleteQuoteBtn: { padding: 5 },
    quoteAuthor: { fontSize: 14, fontWeight: 'bold', color: colors.textLight, textAlign: 'right' },
    emptyText: { textAlign: 'center', color: colors.textLight, marginTop: 20 },
  });
