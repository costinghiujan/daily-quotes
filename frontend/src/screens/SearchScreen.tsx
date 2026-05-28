import React, { useState, useEffect, useContext, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { userService, UserProfile } from '../api/userService';
import { friendshipService } from '../api/friendshipService';
import { quoteService } from '../api/quoteService';

import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { AlertContext } from '../context/AlertContext';
import { ThemeColors } from '../theme/colors';
import { FeedQuote } from '../types/FeedQuote';


interface SearchResultUser extends UserProfile {
  friendship_status?: 'pending' | 'accepted' | null;
  requester_id?: number;
}

interface SearchRouteParams {
  initialQuery?: string;
}

interface SearchNavigationProp {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
  setOptions: (options: Record<string, unknown>) => void;
  setParams: (params: Record<string, unknown>) => void;
}

export default function SearchScreen() {
  const route = useRoute<{ key: string; name: string; params?: SearchRouteParams }>();
  const navigation = useNavigation<SearchNavigationProp>();
  const initialQuery = route?.params?.initialQuery || '';
  const { t } = useTranslation();

  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { user } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'users' | 'quotes'>('users');

  const [userResults, setUserResults] = useState<SearchResultUser[]>([]);
  const [quoteResults, setQuoteResults] = useState<FeedQuote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Feature G: Semantic search toggle
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

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
          // Feature G: Use semantic search when toggle is on
          if (useSemanticSearch) {
            const quotes = await quoteService.semanticSearchQuotes(cleanQuery);
            setQuoteResults(quotes);
          } else {
            const quotes = await quoteService.searchQuotes(cleanQuery);
            setQuoteResults(quotes);
          }
        }
      } catch (error) {
        console.log(error);
        console.error('[SearchScreen] Eroare la căutare API.');
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeTab, useSemanticSearch]);

  const handleAddFriend = async (userId: number) => {
    setUserResults((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, friendship_status: 'pending' } : u)),
    );
    try {
      await friendshipService.sendRequest(userId);
    } catch (error: unknown) {
      setUserResults((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, friendship_status: null } : u)),
      );
      const err = error as { response?: { data?: { message?: string } } };
      showAlert({ title: t('common.error'), message: err.response?.data?.message || t('search.errorRequest'), hideCancel: true, confirmText: t('common.ok') });
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
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ProfileScreen', { userId: item.id })}
      >
        {item.profile_picture_url ? (
          <Image source={{ uri: item.profile_picture_url }} style={styles.avatar} />
        ) : (
          <Image source={require('../../assets/user-default.jpg')} style={styles.avatar} />
        )}
        <View style={styles.infoContainer}>
          <Text style={styles.mainText}>{item.full_name || item.username}</Text>
          <Text style={styles.subText}>@{item.username}</Text>
        </View>
        {isFriend ? (
          <View style={[styles.badge, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.badgeText, { color: colors.success }]}>{t('search.friends')}</Text>
          </View>
        ) : isPending ? (
          <View style={[styles.badge, { backgroundColor: colors.secondary + '20' }]}>
            <Ionicons name="time" size={16} color={colors.secondary} />
            <Text style={[styles.badgeText, { color: colors.secondary }]}>{t('search.pending')}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleAddFriend(item.id)}>
            <Ionicons name="person-add" size={20} color={colors.white} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderQuoteItem = ({ item }: { item: FeedQuote }) => (
    <View style={styles.quoteCard}>
      <View style={styles.quoteHeader}>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen', { userId: item.user_id })}>
          {item.profile_picture_url ? (
            <Image source={{ uri: item.profile_picture_url }} style={styles.avatarSmall} />
          ) : (
            <Image source={require('../../assets/user-default.jpg')} style={styles.avatarSmall} />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen', { userId: item.user_id })}>
          <Text style={styles.quoteUser}>@{item.username}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.quoteTextContainer}>{'\u201C'}{renderTextWithHashtags(item.text)}{'\u201D'}</Text>
      <Text style={styles.quoteAuthor}>— {item.author}</Text>

      <View style={styles.quoteFooter}>
        <Ionicons name="heart" size={16} color={colors.primary} />
        <Text style={styles.reactionCount}>{item.blue_heart_count || 0}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.topBar, { borderBottomColor: colors.separatorColor }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LinearGradient
            colors={colors.primaryGradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoIcon}
          >
            <Ionicons name="search" size={18} color="#fff" />
          </LinearGradient>
          <Text style={[styles.logoText, { color: colors.textDark }]}>{t('search.title')}</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={
            activeTab === 'users' ? t('search.searchUsers') : t('search.searchQuotes')
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
            {t('search.usersTab')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'quotes' && styles.activeTab]}
          onPress={() => setActiveTab('quotes')}
        >
          <Text style={[styles.tabText, activeTab === 'quotes' && styles.activeTabText]}>
            {t('search.quotesTab')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Feature G: Semantic search toggle - only show on quotes tab */}
      {activeTab === 'quotes' && (
        <TouchableOpacity
          style={styles.semanticToggle}
          onPress={() => setUseSemanticSearch(!useSemanticSearch)}
        >
          <Ionicons
            name={useSemanticSearch ? "sparkles" : "search"}
            size={16}
            color={useSemanticSearch ? colors.primary : colors.textLight}
          />
          <Text
            style={[
              styles.semanticToggleText,
              { color: useSemanticSearch ? colors.primary : colors.textLight },
            ]}
          >
            {useSemanticSearch ? t('search.semanticActive') : t('search.semanticOff')}
          </Text>
        </TouchableOpacity>
      )}

      {isLoading && <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}

      {activeTab === 'users' ? (
        <FlatList
          data={userResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            !isLoading && searchQuery.trim() !== '' ? (
              <Text style={styles.emptyText}>
                {t('search.noResults', { query: searchQuery })}
              </Text>
            ) : null
          }
        />
      ) : (
        <FlatList
          data={quoteResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderQuoteItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            !isLoading && searchQuery.trim() !== '' ? (
              <Text style={styles.emptyText}>
                {t('search.noResults', { query: searchQuery })}
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 15,
      marginBottom: 10,
      borderBottomWidth: 1,
    },
    logoIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    logoText: {
      fontSize: 22,
      fontWeight: '800',
    },
    profileBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
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
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 15,
    },
    avatarSmall: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: 8,
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

    semanticToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-end',
      marginRight: 15,
      marginBottom: 10,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    semanticToggleText: { fontSize: 13, fontWeight: '600' },

    emptyText: { textAlign: 'center', marginTop: 40, color: colors.textLight, fontSize: 16 },
  });
