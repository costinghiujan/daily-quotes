import React, { useState, useCallback, useContext } from 'react';
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
  Modal,
  ScrollView,
  Switch
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { userService, UserProfile } from '../api/userService';
import { sessionService, Session } from '../api/sessionService';
import { quoteService } from '../api/quoteService';
import { notificationService, NotificationSettings } from '../api/notificationService'; // NOU: Importăm serviciul
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

export default function ProfileScreen() {
  const { logout } = useContext(AuthContext);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');

  const [isSecurityModalVisible, setSecurityModalVisible] = useState(false);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);

  const [isNotificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getMyProfile();
      setProfile(data.profile);
      setQuotes(data.quotes);
      setEditFullName(data.profile.full_name || '');
      setEditBio(data.profile.bio || '');

      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);

    } catch (error) {
      console.error('Eroare la încărcare profil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [])
  );

  const handleSaveProfile = async () => {
    try {
      const updatedData = await userService.updateProfile({ full_name: editFullName, bio: editBio });
      setProfile(updatedData);
      setIsEditing(false);
      Alert.alert('Succes', 'Profilul a fost actualizat!');
    } catch (error) {
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setIsUploading(true);
      try {
        const updatedProfile = await userService.uploadAvatar(pickerResult.assets[0].uri);
        setProfile(updatedProfile);
        Alert.alert('Succes', 'Fotografia de profil a fost actualizată!');
      } catch (error) {
        Alert.alert('Eroare', 'Nu s-a putut încărca fotografia.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert('Delogare', 'Ești sigur că vrei să ieși din cont de pe acest dispozitiv?', [
      { text: 'Anulează', style: 'cancel' },
      { text: 'Ieși', style: 'destructive', onPress: () => logout() }
    ]);
  };

  const openSecurityModal = async () => {
    setSecurityModalVisible(true);
    setIsSessionsLoading(true);
    try {
      const data = await sessionService.getActiveSessions();
      setActiveSessions(data.sessions);
      setCurrentSessionId(data.currentSessionId);
    } catch (error) {
      Alert.alert('Eroare', 'Nu s-au putut încărca dispozitivele conectate.');
      setSecurityModalVisible(false);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  const handleRevokeSession = (sessionId: number) => {
    Alert.alert('Deconectare Dispozitiv', 'Ești sigur că vrei să deconectezi acest dispozitiv de la distanță?', [
      { text: 'Anulează', style: 'cancel' },
      { 
        text: 'Deconectează', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await sessionService.revokeSession(sessionId);
            setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
            Alert.alert('Succes', 'Dispozitivul a fost deconectat.');
          } catch (error) {
            Alert.alert('Eroare', 'Nu s-a putut deconecta dispozitivul.');
          }
        }
      }
    ]);
  };

  const openNotificationsModal = async () => {
    setNotificationsModalVisible(true);
    setIsSettingsLoading(true);
    try {
      const settings = await notificationService.getSettings();
      setNotificationSettings(settings);
    } catch (error) {
      Alert.alert('Eroare', 'Nu s-au putut încărca setările de notificări.');
      setNotificationsModalVisible(false);
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const handleToggleSetting = async (key: keyof NotificationSettings, value: boolean) => {
    if (!notificationSettings) return;

    const previousSettings = { ...notificationSettings };
    
    const updatedSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(updatedSettings);

    try {
      await notificationService.updateSettings(updatedSettings);
    } catch (error) {
      setNotificationSettings(previousSettings);
      Alert.alert('Eroare conexiune', 'Setarea nu a putut fi salvată.');
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
              setQuotes(prevQuotes => prevQuotes.filter(q => q.id !== quoteId));
            } catch (error) {
              Alert.alert('Eroare', 'Nu s-a putut șterge citatul.');
            }
          } 
        }
      ]
    );
  };

  const renderQuoteItem = ({ item }: { item: any }) => (
    <View style={styles.quoteCard}>
      <View style={styles.quoteCardHeader}>
        <Text style={styles.quoteText}>"{item.text}"</Text>
        <TouchableOpacity onPress={() => handleDeleteQuote(item.id)} style={styles.deleteQuoteBtn}>
          <Ionicons name="trash-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
      <Text style={styles.quoteAuthor}>— {item.author}</Text>
    </View>
  );

  if (isLoading && !profile) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePickImage} disabled={isUploading} style={styles.avatarContainer}>
          {profile?.profile_picture_url ? (
            <Image source={{ uri: profile.profile_picture_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}><Ionicons name="person" size={40} color="#fff" /></View>
          )}
          <View style={styles.avatarOverlay}>
            {isUploading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={16} color="#fff" />}
          </View>
        </TouchableOpacity>

        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput style={styles.input} placeholder="Nume Complet" value={editFullName} onChangeText={setEditFullName} />
            <TextInput style={[styles.input, { height: 60 }]} placeholder="O scurtă descriere (Bio)" value={editBio} onChangeText={setEditBio} multiline />
            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#4CAF50' }]} onPress={handleSaveProfile}><Text style={styles.btnText}>Salvează</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: '#F44336' }]} onPress={() => setIsEditing(false)}><Text style={styles.btnText}>Anulează</Text></TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.infoContainer}>
            <Text style={styles.fullName}>{profile?.full_name || 'Nume nesetat'}</Text>
            <Text style={styles.username}>@{profile?.username}</Text>
            {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
            
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={16} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={openNotificationsModal}>
                <Ionicons name="notifications-outline" size={18} color="#fff" />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={openSecurityModal}>
                <Ionicons name="shield-checkmark" size={18} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={18} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Citatele Mele ({quotes.length})</Text>
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderQuoteItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>Nu ai adăugat niciun citat încă.</Text>}
      />

      <Modal visible={isSecurityModalVisible} animationType="slide" transparent={true} onRequestClose={() => setSecurityModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dispozitive Conectate</Text>
              <TouchableOpacity onPress={() => setSecurityModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {isSessionsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <ScrollView style={styles.sessionsList}>
                {activeSessions.map((session) => {
                  const isCurrent = session.id === currentSessionId;
                  const date = new Date(session.created_at).toLocaleDateString('ro-RO');
                  return (
                    <View key={session.id} style={styles.sessionCard}>
                      <View style={styles.sessionInfo}>
                        <Ionicons name={session.device_name.includes('ios') || session.device_name.includes('android') ? "phone-portrait-outline" : "laptop-outline"} size={24} color="#555" />
                        <View style={styles.sessionDetails}>
                          <Text style={styles.deviceName} numberOfLines={1}>{session.device_name.substring(0, 30)}</Text>
                          <Text style={styles.sessionDate}>Logat pe: {date}</Text>
                          {isCurrent && <Text style={styles.currentBadge}>Dispozitivul curent</Text>}
                        </View>
                      </View>
                      {!isCurrent && (
                        <TouchableOpacity style={styles.revokeBtn} onPress={() => handleRevokeSession(session.id)}>
                          <Text style={styles.revokeBtnText}>Ieși</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={isNotificationsModalVisible} animationType="fade" transparent={true} onRequestClose={() => setNotificationsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Setări Notificări</Text>
              <TouchableOpacity onPress={() => setNotificationsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {isSettingsLoading || !notificationSettings ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <View style={styles.settingsContainer}>
                <View style={styles.settingRow}>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>Reacții la citate</Text>
                    <Text style={styles.settingDescription}>Când cineva reacționează la citatele tale.</Text>
                  </View>
                  <Switch
                    trackColor={{ false: "#d3d3d3", true: "#bbdefb" }}
                    thumbColor={notificationSettings.notify_reactions ? colors.primary : "#f4f3f4"}
                    onValueChange={(val) => handleToggleSetting('notify_reactions', val)}
                    value={notificationSettings.notify_reactions}
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>Cereri de prietenie</Text>
                    <Text style={styles.settingDescription}>Când cineva dorește să se conecteze cu tine.</Text>
                  </View>
                  <Switch
                    trackColor={{ false: "#d3d3d3", true: "#bbdefb" }}
                    thumbColor={notificationSettings.notify_friend_requests ? colors.primary : "#f4f3f4"}
                    onValueChange={(val) => handleToggleSetting('notify_friend_requests', val)}
                    value={notificationSettings.notify_friend_requests}
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>Prietenii acceptate</Text>
                    <Text style={styles.settingDescription}>Când o persoană îți acceptă cererea trimisă.</Text>
                  </View>
                  <Switch
                    trackColor={{ false: "#d3d3d3", true: "#bbdefb" }}
                    thumbColor={notificationSettings.notify_friend_accepted ? colors.primary : "#f4f3f4"}
                    onValueChange={(val) => handleToggleSetting('notify_friend_accepted', val)}
                    value={notificationSettings.notify_friend_accepted}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    backgroundColor: '#fff', padding: 20, alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#eee',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5,
  },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarOverlay: { position: 'absolute', right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  infoContainer: { alignItems: 'center' },
  fullName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  username: { fontSize: 14, color: '#757575', marginBottom: 10 },
  bio: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 15, paddingHorizontal: 20 },
  
  actionButtonsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#F44336', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  
  editContainer: { width: '100%' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: '#f9f9f9' },
  actionButtons: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', padding: 15, color: '#333' },
  listContent: { paddingHorizontal: 15, paddingBottom: 20 },
  
  quoteCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: colors.primary },
  quoteCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  quoteText: { flex: 1, fontSize: 16, fontStyle: 'italic', color: '#444', paddingRight: 10 },
  deleteQuoteBtn: { padding: 5 },
  quoteAuthor: { fontSize: 14, fontWeight: 'bold', color: '#777', textAlign: 'right' },
  emptyText: { textAlign: 'center', color: '#757575', marginTop: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  sessionsList: { paddingBottom: 20 },
  sessionCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sessionInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sessionDetails: { marginLeft: 15, flex: 1 },
  deviceName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  sessionDate: { fontSize: 13, color: '#777', marginTop: 2 },
  currentBadge: { color: colors.primary, fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  revokeBtn: { backgroundColor: '#ffebee', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  revokeBtnText: { color: '#F44336', fontWeight: 'bold', fontSize: 13 },

  settingsContainer: { paddingBottom: 20 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  settingTextContainer: { flex: 1, paddingRight: 15 },
  settingTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  settingDescription: { fontSize: 13, color: '#777', lineHeight: 18 },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F44336',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
    zIndex: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});