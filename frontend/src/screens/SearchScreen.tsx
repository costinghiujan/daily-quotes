import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';

import { userService, UserProfile } from '../api/userService';
import { friendshipService } from '../api/friendshipService';
import { quoteService } from '../api/quoteService';

import { ThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface SearchResultUser extends UserProfile {
  friendship_status?: 'pending' | 'accepted' | null;
  requester_id?: number;
}

export default function SearchScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const initialQuery = route?.params?.initialQuery || '';

  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'users' | 'quotes'>('users');

  const [userResults, setUserResults] = useState<SearchResultUser[]>([]);
  const [quoteResults, setQuoteResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const incomingQuery = route?.params?.initialQuery;

    if (incomingQuery) {
      setSearchQuery(incomingQuery);
      setActiveTab('quotes');

      navigation.setParams({ initialQuery: undefined });
    }
  }, [route?.params?.initialQuery, navigation]);

  useEffect(() => {
    const cleanQuery = searchQuery?.trim() || '';

    if (!cleanQuery) {
      setUserResults([]);
      setQuoteResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      if (!cleanQuery) return;

      setIsLoading(true);
      try {
        if (activeTab === 'users') {
          const users = await userService.searchUsers(cleanQuery);
          setUserResults(users);
        } else {
          const quotes = await quoteService.searchQuotes(cleanQuery);
          setQuoteResults(quotes);
        }
      } catch (error) {
        console.log(error);
        console.error('[SearchScreen] Eroare la căutare API.');
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeTab]);

  const handleAddFriend = async (userId: number) => {
    setUserResults((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, friendship_status: 'pending' } : u)),
    );
    try {
      await friendshipService.sendRequest(userId);
    } catch (error: any) {
      setUserResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, friendship_status: null } : u)),
      );
      Alert.alert('Eroare', error.response?.data?.message || 'Nu s-a putut trimite cererea.');
    }
  };

  const renderTextWithHashtags = (text: string) => {
    const parts = text.split(/(#\w+)/g);

    return parts.map((part, index) => {
      if (part.match(/(#\w+)/)) {
        return (
          <Text
            key={index}
            style={styles.hashtag}
            onPress={() => {
              setSearchQuery(part);
              setActiveTab('quotes');
            }}
          >
            {part}
          </Text>
        );
      }
      return (
        <Text key={index} style={styles.quoteTextNormal}>
          {part}
        </Text>
      );
    });
  };

  const renderUserItem = ({ item }: { item: SearchResultUser }) => {
    const isFriend = item.friendship_status === 'accepted';
    const isPending = item.friendship_status === 'pending';

    return (
      <View style={styles.card}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={24} color={colors.white} />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.mainText}>{item.full_name || item.username}</Text>
          <Text style={styles.subText}>@{item.username}</Text>
        </View>
        {isFriend ? (
          <View style={[styles.badge, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.badgeText, { color: colors.success }]}>Prieteni</Text>
          </View>
        ) : isPending ? (
          <View style={[styles.badge, { backgroundColor: colors.secondary + '20' }]}>
            <Ionicons name="time" size={16} color={colors.secondary} />
            <Text style={[styles.badgeText, { color: colors.secondary }]}>În așteptare</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleAddFriend(item.id)}>
            <Ionicons name="person-add" size={20} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderQuoteItem = ({ item }: { item: any }) => (
    <View style={styles.quoteCard}>
      <View style={styles.quoteHeader}>
        <View style={styles.avatarPlaceholderSmall}>
          <Ionicons name="person" size={14} color={colors.white} />
        </View>
        <Text style={styles.quoteUser}>@{item.username}</Text>
      </View>

      <Text style={styles.quoteTextContainer}>&quot;{renderTextWithHashtags(item.text)}&quot;</Text>
      <Text style={styles.quoteAuthor}>— {item.original_author}</Text>

      <View style={styles.quoteFooter}>
        <Ionicons name="heart" size={16} color={colors.primary} />
        <Text style={styles.reactionCount}>{item.blue_heart_count || 0}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={
            activeTab === 'users' ? 'Caută utilizatori...' : 'Caută cuvinte sau #hashtag-uri...'
          }
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Utilizatori
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'quotes' && styles.activeTab]}
          onPress={() => setActiveTab('quotes')}
        >
          <Text style={[styles.tabText, activeTab === 'quotes' && styles.activeTabText]}>
            Citate
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}

      <FlatList
        data={activeTab === 'users' ? userResults : quoteResults}
        keyExtractor={(item) => item.id.toString()}
        renderItem={activeTab === 'users' ? renderUserItem : renderQuoteItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading && searchQuery.trim() !== '' ? (
            <Text style={styles.emptyText}>
              Nu am găsit rezultate pentru &quot;{searchQuery}&quot;.
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      margin: 15,
      marginBottom: 10,
      borderRadius: 10,
      paddingHorizontal: 15,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 5,
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, height: 50, fontSize: 16, color: colors.textDark },

    tabsContainer: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 10, gap: 10 },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTab: { borderBottomColor: colors.primary },
    tabText: { fontSize: 15, fontWeight: '600', color: colors.textLight },
    activeTabText: { color: colors.primary },

    loader: { marginTop: 20 },
    listContent: { paddingHorizontal: 15, paddingBottom: 20 },

    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      padding: 15,
      marginBottom: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
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
    infoContainer: { flex: 1 },
    mainText: { fontSize: 16, fontWeight: 'bold', color: colors.textDark },
    subText: { fontSize: 14, color: colors.textLight, marginTop: 2 },
    actionBtn: {
      backgroundColor: colors.primary,
      padding: 10,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 40,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 4,
    },
    badgeText: { fontSize: 13, fontWeight: 'bold' },

    quoteCard: {
      backgroundColor: colors.card,
      padding: 15,
      marginBottom: 15,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    quoteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatarPlaceholderSmall: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    quoteUser: { fontSize: 14, fontWeight: '600', color: colors.textDark },

    quoteTextContainer: { fontSize: 16, lineHeight: 24, marginBottom: 8 },
    quoteTextNormal: { color: colors.textDark, fontStyle: 'italic' },
    hashtag: { color: colors.primary, fontWeight: 'bold', fontStyle: 'normal' },

    quoteAuthor: {
      fontSize: 13,
      fontWeight: 'bold',
      color: colors.textLight,
      textAlign: 'right',
      marginBottom: 10,
    },
    quoteFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
    reactionCount: { fontSize: 14, color: colors.textLight, marginLeft: 6, fontWeight: 'bold' },

    emptyText: { textAlign: 'center', marginTop: 40, color: colors.textLight, fontSize: 16 },
  });
