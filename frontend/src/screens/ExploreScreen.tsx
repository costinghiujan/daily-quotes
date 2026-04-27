import React, { useState, useCallback, useContext, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { quoteService } from '../api/quoteService';
import { ThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

export default function ExploreScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

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

      const data = await quoteService.getExploreFeed();

      console.log("🏆 TOP RECOMANDĂRI PENTRU TINE:");
      data.forEach((quote: any, index: number) => {
        console.log(`${index + 1}. [Scor: ${Number(quote.recommendation_score).toFixed(3)}] ${quote.original_author} - ${quote.text.substring(0, 30)}...`);
      });

      setExploreQuotes(feedData);
      setQuoteOfTheDay(hofData);
    } catch (error) {
      console.error('[Eroare UI] Nu am putut încărca Explore Feed:', error);
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
    <View style={styles.quoteCard}>
      <View style={styles.quoteHeader}>
        <View style={styles.avatarPlaceholderSmall}>
          <Ionicons name="person" size={16} color={colors.white} />
        </View>
        <View>
          <Text style={styles.quoteUserName}>{item.full_name || item.username}</Text>
          <Text style={styles.quoteUserHandle}>@{item.username}</Text>
        </View>
      </View>

      <Text style={styles.quoteTextContainer}>&quot;{renderTextWithHashtags(item.text)}&quot;</Text>
      <Text style={styles.quoteAuthor}>— {item.original_author}</Text>

      <View style={styles.reactionsBar}>
        <View style={styles.reactionBtn}>
          <Ionicons name="heart" size={18} color={colors.primary} />
          <Text style={styles.reactionCount}>{item.blue_heart_count || 0}</Text>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Ionicons name="book" size={28} color={colors.primary} style={{ marginRight: 10 }} />
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.textDark }}>DailyQuotes</Text>
        </View>

        {quoteOfTheDay && (
          <View style={styles.hofContainer}>
            <View style={styles.hofHeader}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
              <Text style={styles.hofTitle}>Citatul Zilei</Text>
              <Ionicons name="trophy" size={20} color="#FFD700" />
            </View>
            <View style={styles.hofCard}>
              <Text style={styles.hofQuoteText}>
                &quot;{renderTextWithHashtags(quoteOfTheDay.text)}&quot;
              </Text>
              <Text style={styles.hofQuoteAuthor}>— {quoteOfTheDay.original_author}</Text>
              <View style={styles.hofFooter}>
                <Text style={styles.hofPostedBy}>
                  Postat de <Text style={{ fontWeight: 'bold' }}>@{quoteOfTheDay.username}</Text>
                </Text>
                <View style={styles.hofReactionBadge}>
                  <Ionicons name="star" size={12} color="#FFD700" />
                  <Text style={styles.hofReactionText}>
                    {quoteOfTheDay.total_reactions} Reacții
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </>
    );
  };

  if (isLoading && exploreQuotes.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
            <Text style={styles.emptyText}>Nu am găsit citate noi momentan.</Text>
            <Text style={styles.emptySubText}>Trage în jos pentru a reîmprospăta.</Text>
          </View>
        }
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

    headerTitleContainer: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 15,
      backgroundColor: colors.background,
    },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.textDark },
    headerSubtitle: { fontSize: 15, color: colors.textLight, marginTop: 4 },

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
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 2,
      borderColor: '#FFD700',
      elevation: 5,
      shadowColor: '#FFD700',
      shadowOpacity: 0.2,
      shadowRadius: 10,
    },
    hofQuoteText: {
      fontSize: 19,
      lineHeight: 28,
      fontStyle: 'italic',
      color: colors.textDark,
      textAlign: 'center',
      marginBottom: 15,
    },
    hofQuoteAuthor: {
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.textLight,
      textAlign: 'right',
      marginBottom: 15,
    },
    hofFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
    },
    hofPostedBy: { fontSize: 12, color: colors.textLight },
    hofReactionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 215, 0, 0.1)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    hofReactionText: { fontSize: 12, fontWeight: 'bold', color: '#B8860B' },

    listContent: { paddingBottom: 30 },

    quoteCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 18,
      marginBottom: 15,
      marginHorizontal: 15,
      elevation: 3,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    quoteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatarPlaceholderSmall: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    quoteUserName: { fontSize: 15, fontWeight: 'bold', color: colors.textDark },
    quoteUserHandle: { fontSize: 13, color: colors.textLight },

    quoteTextContainer: { fontSize: 17, lineHeight: 26, marginBottom: 12 },
    quoteTextNormal: { color: colors.textDark, fontStyle: 'italic' },
    hashtag: { color: colors.primary, fontWeight: 'bold', fontStyle: 'normal' },

    quoteAuthor: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.textLight,
      textAlign: 'right',
      marginBottom: 15,
    },

    reactionsBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
    },
    reactionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },
    reactionCount: { fontSize: 14, fontWeight: 'bold', color: colors.primary, marginLeft: 6 },
    commentBtn: { padding: 5 },

    emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
    emptyText: {
      marginTop: 15,
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textDark,
      textAlign: 'center',
    },
    emptySubText: {
      fontSize: 15,
      color: colors.textLight,
      textAlign: 'center',
      marginTop: 10,
      lineHeight: 22,
    },
  });
