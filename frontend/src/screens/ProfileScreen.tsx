import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  Image // NOU: Importăm componenta nativă pentru imagini
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // NOU: Importăm selectorul de galerie
import { userService, UserProfile } from '../api/userService';
import { colors } from '../theme/colors';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false); // NOU: Stare pentru spinner-ul de upload

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

  // ==========================================
  // NOU: Funcția de selectare și încărcare a imaginii
  // ==========================================
  const handlePickImage = async () => {
    // 1. Cerem permisiunea de a accesa galeria
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Atenție', 'Avem nevoie de permisiunea ta pentru a accesa galeria foto!');
      return;
    }

    // 2. Deschidem galeria (limităm la imagini, permitem tăierea/crop-ul în pătrat)
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Forțăm un format pătrat perfect pentru avatar
      quality: 0.7,   // Comprimăm puțin imaginea (70%) pentru a salva lățimea de bandă
    });

    // 3. Dacă utilizatorul a selectat o poză (nu a anulat acțiunea)
    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setIsUploading(true);
      try {
        // Trimitem URI-ul local către serviciul nostru API
        const updatedProfile = await userService.uploadAvatar(pickerResult.assets[0].uri);
        
        // Actualizăm starea locală cu noul URL primit de la server
        setProfile(updatedProfile);
        Alert.alert('Succes', 'Fotografia de profil a fost actualizată!');
      } catch (error) {
        Alert.alert('Eroare', 'Nu s-a putut încărca fotografia.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const renderQuoteItem = ({ item }: { item: any }) => (
    <View style={styles.quoteCard}>
      <Text style={styles.quoteText}>"{item.text}"</Text>
      <Text style={styles.quoteAuthor}>— {item.author}</Text>
    </View>
  );

  if (isLoading && !profile) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        
        {/* NOU: Zona interactivă pentru Avatar */}
        <TouchableOpacity onPress={handlePickImage} disabled={isUploading} style={styles.avatarContainer}>
          {profile?.profile_picture_url ? (
            <Image 
              source={{ uri: profile.profile_picture_url }} 
              style={styles.avatarImage} 
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color="#fff" />
            </View>
          )}
          
          {/* Suprapunem un mic indicator de încărcare sau iconița de cameră */}
          <View style={styles.avatarOverlay}>
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={16} color="#fff" />
            )}
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
            <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
              <Ionicons name="pencil" size={16} color="#fff" />
              <Text style={styles.btnText}>Editează Profilul</Text>
            </TouchableOpacity>
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
    </View>
  );
}

// ==========================================
// Stiluri (Design actualizat pentru avatar)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    backgroundColor: '#fff', padding: 20, alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#eee',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5,
  },
  avatarContainer: {
    position: 'relative', // Pentru a putea poziționa iconița de cameră peste poză
    marginBottom: 15,
  },
  avatarImage: {
    width: 100, height: 100, borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarOverlay: {
    position: 'absolute', right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  infoContainer: { alignItems: 'center' },
  fullName: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  username: { fontSize: 14, color: '#757575', marginBottom: 10 },
  bio: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 15, paddingHorizontal: 20 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary,
    paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, gap: 5,
  },
  btnText: { color: '#fff', fontWeight: 'bold' },
  editContainer: { width: '100%' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 10, marginBottom: 10, backgroundColor: '#f9f9f9'
  },
  actionButtons: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', padding: 15, color: '#333' },
  listContent: { paddingHorizontal: 15, paddingBottom: 20 },
  quoteCard: {
    backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10,
    borderLeftWidth: 4, borderLeftColor: colors.primary,
  },
  quoteText: { fontSize: 16, fontStyle: 'italic', color: '#444', marginBottom: 5 },
  quoteAuthor: { fontSize: 14, fontWeight: 'bold', color: '#777', textAlign: 'right' },
  emptyText: { textAlign: 'center', color: '#757575', marginTop: 20 }
});