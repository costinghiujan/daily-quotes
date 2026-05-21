import React, { useState, useCallback, useContext, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { quoteService } from '../api/quoteService';
import { ThemeContext } from '../context/ThemeContext';

export default function ExploreScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [exploreQuotes, setExploreQuotes] = useState<any[]>([]);
  const [quoteOfTheDay, setQuoteOfTheDay] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const fetchExploreFeed = async () => {
    try {
      const [feedData, hofData] = await Promise.all([
        quoteService.getExploreFeed(),
        quoteService.getQuoteOfTheDay(),
      ]);
      setExploreQuotes(feedData);
      setQuoteOfTheDay(hofData);
    } catch (error) {
      console.error('[Eroare UI] Nu am putut incarca Explore Feed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchExploreFeed();
    }, []),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchExploreFeed();
    setIsRefreshing(false);
  }, []);

  const renderTextWithHashtags = (text: string) => {
    const parts = text.split(/(#\w+)/g);
    return parts.map((part, index) => {
      if (part.match(/(#\w+)/)) {
        return (
          <Text
            key={index}
            style={styles.hashtag}
            onPress={() => {
              navigation.navigate('Search', { initialQuery: part });
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

  const renderQuoteItem = ({ item }: { item: any }) => (
    <View style={[styles.quoteCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.quoteHeader}>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen', { userId: item.user_id })}>
          {item.profile_picture_url ? (
            <Image source={{ uri: item.profile_picture_url }} style={styles.avatarSmall} />
          ) : (
            <Image source={require('../../assets/user-default.jpg')} style={styles.avatarSmall} />
          )}
        </TouchableOpacity>
        <View>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen', { userId: item.user_id })}>
            <Text style={[styles.quoteUserName, { color: colors.textDark }]}>{item.full_name || item.username}</Text>
          </TouchableOpacity>
          <Text style={[styles.quoteUserHandle, { color: colors.textLight }]}>@{item.username}</Text>
        </View>
      </View>

      <Text style={[styles.quoteTextContainer, { color: colors.textPrimary }]}>
        {'\u201C'}{renderTextWithHashtags(item.text)}{'\u201D'}
      </Text>
      <Text style={[styles.quoteAuthor, { color: colors.textLight }]}>— {item.author}</Text>

      <View style={[styles.reactionsBar, { borderTopColor: colors.separatorColor }]}>
        <View style={[styles.reactionBtn, { backgroundColor: colors.reactionBg }]}>
          <Ionicons name="heart" size={18} color={colors.primary} />
          <Text style={[styles.reactionCount, { color: colors.primary }]}>{item.blue_heart_count || 0}</Text>
        </View>
        <TouchableOpacity
          style={styles.commentBtn}
          onPress={() => navigation.navigate('Comments', { quoteId: item.id })}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.textLight} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHeader = () => {
    return (
      <>
        {/* Top Bar */}
        <View style={[styles.topBar, { borderBottomColor: colors.separatorColor }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LinearGradient
              colors={colors.primaryGradient as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoIcon}
            >
              <Ionicons name="compass" size={18} color="#fff" />
            </LinearGradient>
            <Text style={[styles.logoText, { color: colors.textDark }]}>{t('explore.title')}</Text>
          </View>
        </View>

        {quoteOfTheDay && (
          <View style={styles.hofContainer}>
            <View style={styles.hofHeader}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
              <Text style={styles.hofTitle}>{t('explore.quoteOfTheDay')}</Text>
              <Ionicons name="trophy" size={20} color="#FFD700" />
            </View>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hofCard}
            >
              <Text style={styles.hofQuoteText}>
                {'\u201C'}{renderTextWithHashtags(quoteOfTheDay.text)}{'\u201D'}
              </Text>
              <Text style={styles.hofQuoteAuthor}>— {quoteOfTheDay.author}</Text>
              <View style={[styles.hofFooter, { borderTopColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={styles.hofPostedBy}>
                  {t('explore.postedBy')} <Text style={{ fontWeight: 'bold' }}>@{quoteOfTheDay.username}</Text>
                </Text>
                <View style={styles.hofReactionBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.hofReactionText}>
                    {quoteOfTheDay.total_reactions} {t('explore.reactions')}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}
      </>
    );
  };

  if (isLoading && exploreQuotes.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <FlatList
        data={exploreQuotes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderQuoteItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="compass-outline" size={64} color={colors.textLight} />
            <Text style={[styles.emptyText, { color: colors.textDark }]}>{t('explore.noQuotes')}</Text>
            <Text style={[styles.emptySubText, { color: colors.textLight }]}>{t('explore.pullToRefresh')}</Text>
          </View>
        }
      />
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
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
    hofContainer: {
      paddingHorizontal: 15,
      marginBottom: 20,
    },
    hofHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
      gap: 10,
    },
    hofTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFD700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    hofCard: {
      borderRadius: 16,
      padding: 20,
      elevation: 5,
      shadowColor: '#667eea',
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
    hofQuoteText: {
      fontSize: 19,
      lineHeight: 28,
      fontStyle: 'italic',
      color: '#fff',
      textAlign: 'center',
      marginBottom: 15,
    },
    hofQuoteAuthor: {
      fontSize: 15,
      fontWeight: 'bold',
      color: 'rgba(255,255,255,0.8)',
      textAlign: 'right',
      marginBottom: 15,
    },
    hofFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      paddingTop: 12,
    },
    hofPostedBy: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
    hofReactionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 215, 0, 0.2)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    hofReactionText: { fontSize: 12, fontWeight: 'bold', color: '#FFD700' },
    listContent: { paddingBottom: 30 },
    quoteCard: {
      borderRadius: 12,
      padding: 18,
      marginBottom: 15,
      marginHorizontal: 15,
      elevation: 3,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 6,
      borderWidth: 1,
    },
    quoteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatarSmall: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginRight: 10,
    },
    avatarPlaceholderSmall: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    quoteUserName: { fontSize: 15, fontWeight: 'bold' },
    quoteUserHandle: { fontSize: 13 },
    quoteTextContainer: { fontSize: 17, lineHeight: 26, marginBottom: 12 },
    quoteTextNormal: { fontStyle: 'italic' },
    hashtag: { color: colors.primary, fontWeight: 'bold', fontStyle: 'normal' },
    quoteAuthor: {
      fontSize: 14,
      fontWeight: 'bold',
      textAlign: 'right',
      marginBottom: 15,
    },
    reactionsBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      paddingTop: 12,
    },
    reactionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },
    reactionCount: { fontSize: 14, fontWeight: 'bold', marginLeft: 6 },
    commentBtn: { padding: 5 },
    emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
    emptyText: {
      marginTop: 15,
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    emptySubText: {
      fontSize: 15,
      textAlign: 'center',
      marginTop: 10,
      lineHeight: 22,
    },
  });
