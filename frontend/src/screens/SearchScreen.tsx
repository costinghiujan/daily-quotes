import React, { useState, useEffect, useContext, useMemo } from 'react';
import { 
  View, Text, TextInput, FlatList, TouchableOpacity, 
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { userService, UserProfile } from '../api/userService';
import { friendshipService } from '../api/friendshipService';

import { ThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface SearchResult extends UserProfile {
  friendship_status?: 'pending' | 'accepted' | null;
  requester_id?: number;
}

export default function SearchScreen() {
  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const users = await userService.searchUsers(searchQuery);
        setResults(users);
      } catch (error) {
        console.error('Eroare la căutare:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleAddFriend = async (userId: number, username: string) => {
    setResults(prev => prev.map(u => 
      u.id === userId ? { ...u, friendship_status: 'pending' } : u
    ));

    try {
      await friendshipService.sendRequest(userId);
    } catch (error: any) {
      setResults(prev => prev.map(u => 
        u.id === userId ? { ...u, friendship_status: null } : u
      ));
      const errorMsg = error.response?.data?.message || 'Nu s-a putut trimite cererea.';
      Alert.alert('Eroare', errorMsg);
    }
  };

  const renderUserItem = ({ item }: { item: SearchResult }) => {
    const isFriend = item.friendship_status === 'accepted';
    const isPending = item.friendship_status === 'pending';

    return (
      <View style={styles.userCard}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={24} color={colors.white} />
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.full_name || item.username}</Text>
          <Text style={styles.userHandle}>@{item.username}</Text>
        </View>

        {isFriend ? (
          <View style={[styles.statusBadge, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.statusText, { color: colors.success }]}>Prieteni</Text>
          </View>
        ) : isPending ? (
          <View style={[styles.statusBadge, { backgroundColor: colors.secondary + '20' }]}>
            <Ionicons name="time" size={16} color={colors.secondary} />
            <Text style={[styles.statusText, { color: colors.secondary }]}>În așteptare</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => handleAddFriend(item.id, item.username)}
          >
            <Ionicons name="person-add" size={20} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Caută utilizatori..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {isLoading && <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading && searchQuery.trim() !== '' ? (
            <Text style={styles.emptyText}>Nu am găsit niciun utilizator.</Text>
          ) : null
        }
      />
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, margin: 15, borderRadius: 10, paddingHorizontal: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 50, fontSize: 16, color: colors.textDark },
  loader: { marginTop: 20 },
  listContent: { paddingHorizontal: 15, paddingBottom: 20 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 15, marginBottom: 10, borderRadius: 10 },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: colors.textDark },
  userHandle: { fontSize: 14, color: colors.textLight, marginTop: 2 },
  addButton: { backgroundColor: colors.primary, padding: 10, borderRadius: 20, justifyContent: 'center', alignItems: 'center', minWidth: 40 },
  
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  statusText: { fontSize: 13, fontWeight: 'bold' },

  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: colors.textLight,
    fontSize: 16,
  }
});