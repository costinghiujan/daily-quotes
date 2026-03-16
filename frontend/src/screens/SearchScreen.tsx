import React, { useState, useEffect, useContext, useMemo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { userService, UserProfile } from '../api/userService';
import { friendshipService } from '../api/friendshipService';

import { ThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

export default function SearchScreen() {
  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
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
    try {
      await friendshipService.sendRequest(userId);
      Alert.alert('Succes', `Cerere de prietenie trimisă către ${username}!`);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Nu s-a putut trimite cererea.';
      Alert.alert('Eroare', errorMsg);
    }
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <View style={styles.userCard}>
      <View style={styles.avatarPlaceholder}>
        <Ionicons name="person" size={24} color={colors.white} />
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.full_name || item.username}</Text>
        <Text style={styles.userHandle}>@{item.username}</Text>
      </View>

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => handleAddFriend(item.id, item.username)}
      >
        <Ionicons name="person-add" size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    margin: 15,
    borderRadius: 10,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: colors.textDark,
  },
  loader: {
    marginTop: 20,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
  },
  userHandle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: colors.textLight,
    fontSize: 16,
  }
});