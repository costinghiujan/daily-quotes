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
  Modal,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { quoteService } from '../api/quoteService';
import { ThemeContext } from '../context/ThemeContext';
import { FeedQuote } from '../types/FeedQuote';
import { ThemeColors } from '../theme/colors';
import { ExploreFeedSkeleton } from '../components/SkeletonLoader';

interface ExploreNavigationProp {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
  setOptions: (options: Record<string, unknown>) => void;
}

interface QuoteOfTheDay {
  id: number;
  text: string;
  author: string;
  username: string;
  user_id: number;
  profile_picture_url: string | null;
  full_name: string | null;
  total_reactions: number;
  blue_heart_count: number;
}

export default function ExploreScreen() {
  const navigation = useNavigation<ExploreNavigationProp>();
  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [exploreQuotes, setExploreQuotes] = useState<FeedQuote[]>([]);
  const [quoteOfTheDay, setQuoteOfTheDay] = useState<QuoteOfTheDay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Feature H: Similar quotes modal state
  const [similarQuotes, setSimilarQuotes] = useState<FeedQuote[]>([]);
  const [similarSourceQuote, setSimilarSourceQuote] = useState<FeedQuote | null>(null);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

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

  // Feature H: Load similar quotes
  const handleFindSimilar = useCallback(async (quote: FeedQuote) => {
    setSimilarSourceQuote(quote);
    setShowSimilarModal(true);
    setIsLoadingSimilar(true);
    try {
      const result = await quoteService.getSimilarQuotes(quote.id);
      setSimilarQuotes(result.data || []);
    } catch (error) {
      console.error('[Explore] Failed to load similar quotes:', error);
      setSimilarQuotes([]);
    } finally {
      setIsLoadingSimilar(false);
    }
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

  const renderQuoteItem = ({ item }: { item: FeedQuote }) => (
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Feature H: Find similar quotes button */}
          <TouchableOpacity
            style={styles.similarBtn}
            onPress={() => handleFindSimilar(item)}
          >
            <Ionicons name="shuffle" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.commentBtn}
            onPress={() => navigation.navigate('Comments', { quoteId: item.id })}
          >
            <Ionicons name="chatbubble-outline" size={18} color={colors.textLight} />
          </TouchableOpacity>
        </View>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    style={styles.zenModeBtn}
                    onPress={() => navigation.navigate('ZenQuote', { quoteId: quoteOfTheDay.id })}
                  >
                    <Ionicons name="leaf" size={14} color="#fff" />
                    <Text style={styles.zenModeBtnText}>{t('explore.zenMode')}</Text>
                  </TouchableOpacity>
                  <View style={styles.hofReactionBadge}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={styles.hofReactionText}>
                      {quoteOfTheDay.total_reactions} {t('explore.reactions')}
                    </Text>
                  </View>
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
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <ExploreFeedSkeleton colors={{ skeleton: colors.skeleton, shimmer: colors.shimmer }} count={3} />
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

      {/* Feature H: Similar Quotes Modal */}
      <Modal
        visible={showSimilarModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSimilarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.separatorColor }]}>
              <Text style={[styles.modalTitle, { color: colors.textDark }]}>
                {t('explore.similarQuotes')}
              </Text>
              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: colors.iconBg }]}
                onPress={() => setShowSimilarModal(false)}
              >
                <Ionicons name="close" size={20} color={colors.iconColor} />
              </TouchableOpacity>
            </View>

            {similarSourceQuote && (
              <View style={[styles.modalSourceQuote, { borderBottomColor: colors.separatorColor }]}>
                <Text style={[styles.modalSourceLabel, { color: colors.textLight }]}>
                  {t('explore.sourceQuote')}
                </Text>
                <Text style={[styles.modalSourceText, { color: colors.textPrimary }]}>
                  {'\u201C'}{similarSourceQuote.text}{'\u201D'}
                </Text>
                <Text style={[styles.modalSourceAuthor, { color: colors.textLight }]}>
                  — {similarSourceQuote.author}
                </Text>
              </View>
            )}

            {isLoadingSimilar ? (
              <View style={styles.emptySimilar}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.emptySimilarText, { color: colors.textLight }]}>
                  {t('common.loading')}
                </Text>
              </View>
            ) : similarQuotes.length === 0 ? (
              <View style={styles.emptySimilar}>
                <Ionicons name="search-outline" size={40} color={colors.textLight} />
                <Text style={[styles.emptySimilarText, { color: colors.textLight }]}>
                  {t('explore.noSimilarQuotes')}
                </Text>
              </View>
            ) : (
              <ScrollView>
                {similarQuotes.map((sq, index) => (
                  <TouchableOpacity
                    key={sq.id || index}
                    style={[styles.similarItem, { borderBottomColor: colors.separatorColor }]}
                    onPress={() => {
                      setShowSimilarModal(false);
                      navigation.navigate('Comments', { quoteId: sq.id });
                    }}
                  >
                    <Text style={[styles.similarItemText, { color: colors.textPrimary }]}>
                      {'\u201C'}{sq.text}{'\u201D'}
                    </Text>
                    <Text style={[styles.similarItemAuthor, { color: colors.textLight }]}>
                      — {sq.author}
                    </Text>
                    {sq.recommendation_score !== undefined && (
                      <Text style={styles.similarItemScore}>
                        {t('explore.similarityScore')}: {Math.round((sq.recommendation_score || 0) * 100)}%
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
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
    zenModeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    zenModeBtnText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
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
    similarBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
    },
    // Feature H: Similar quotes modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: '#fff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      paddingBottom: 30,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#333',
    },
    modalCloseBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#f0f0f0',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalSourceQuote: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    modalSourceLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: '#999',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4,
    },
    modalSourceText: {
      fontSize: 14,
      fontStyle: 'italic',
      color: '#666',
      lineHeight: 20,
    },
    modalSourceAuthor: {
      fontSize: 12,
      fontWeight: '600',
      color: '#999',
      textAlign: 'right',
      marginTop: 4,
    },
    similarItem: {
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#f5f5f5',
    },
    similarItemText: {
      fontSize: 15,
      fontStyle: 'italic',
      color: '#333',
      lineHeight: 22,
    },
    similarItemAuthor: {
      fontSize: 13,
      fontWeight: '600',
      color: '#666',
      textAlign: 'right',
      marginTop: 6,
    },
    similarItemScore: {
      fontSize: 11,
      color: '#667eea',
      fontWeight: '600',
      marginTop: 4,
    },
    emptySimilar: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    emptySimilarText: {
      fontSize: 14,
      color: '#999',
      marginTop: 8,
    },
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
