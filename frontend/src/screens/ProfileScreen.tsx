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
  Modal, // NOU: Componenta pentru fereastra suprapusă
  ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { userService, UserProfile } from '../api/userService';
import { sessionService, Session } from '../api/sessionService'; // NOU: Importăm serviciul de sesiuni
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

  // ==========================================
  // Stări noi pentru Modulul de Securitate
  // ==========================================
  const [isSecurityModalVisible, setSecurityModalVisible] = useState(false);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);

  // ==========================================
  // 1. Încărcarea Datelor de Profil
  // ==========================================
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
    }, [])
  );

  // ==========================================
  // 2. Acțiuni Profil (Editare, Poză, Logout curent)
  // ==========================================
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

  // ==========================================
  // 3. Funcții pentru Modulul de Securitate
  // ==========================================
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
            // Ștergem sesiunea din lista vizuală instantaneu
            setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
            Alert.alert('Succes', 'Dispozitivul a fost deconectat.');
          } catch (error) {
            Alert.alert('Eroare', 'Nu s-a putut deconecta dispozitivul.');
          }
        }
      }
    ]);
  };

  const renderQuoteItem = ({ item }: { item: any }) => (
    <View style={styles.quoteCard}>
      <Text style={styles.quoteText}>"{item.text}"</Text>
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
                <Text style={styles.btnText}>Editează</Text>
              </TouchableOpacity>

              {/* Butonul de Securitate (Nou) */}
              <TouchableOpacity style={styles.securityBtn} onPress={openSecurityModal}>
                <Ionicons name="shield-checkmark" size={16} color="#fff" />
                <Text style={styles.btnText}>Securitate</Text>
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

      {/* ========================================== */}
      {/* MODALUL DE SECURITATE (Dispozitive Conectate) */}
      {/* ========================================== */}
      <Modal
        visible={isSecurityModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSecurityModalVisible(false)}
      >
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
                        <Ionicons 
                          name={session.device_name.includes('ios') || session.device_name.includes('android') ? "phone-portrait-outline" : "laptop-outline"} 
                          size={24} color="#555" 
                        />
                        <View style={styles.sessionDetails}>
                          <Text style={styles.deviceName} numberOfLines={1}>
                            {session.device_name.substring(0, 30)}
                          </Text>
                          <Text style={styles.sessionDate}>Logat pe: {date}</Text>
                          {isCurrent && <Text style={styles.currentBadge}>Dispozitivul curent</Text>}
                        </View>
                      </View>

                      {!isCurrent && (
                        <TouchableOpacity 
                          style={styles.revokeBtn} 
                          onPress={() => handleRevokeSession(session.id)}
                        >
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

    </View>
  );
}

// ==========================================
// Stiluri (Design)
// ==========================================
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
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 5 },
  securityBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 5 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#F44336', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  
  editContainer: { width: '100%' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: '#f9f9f9' },
  actionButtons: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', padding: 15, color: '#333' },
  listContent: { paddingHorizontal: 15, paddingBottom: 20 },
  quoteCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: colors.primary },
  quoteText: { fontSize: 16, fontStyle: 'italic', color: '#444', marginBottom: 5 },
  quoteAuthor: { fontSize: 14, fontWeight: 'bold', color: '#777', textAlign: 'right' },
  emptyText: { textAlign: 'center', color: '#757575', marginTop: 20 },

  // Stiluri Modal Securitate
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
  revokeBtnText: { color: '#F44336', fontWeight: 'bold', fontSize: 13 }
});