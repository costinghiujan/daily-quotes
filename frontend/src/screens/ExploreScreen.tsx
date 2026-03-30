import React, { useState, useCallback, useContext, useMemo } from 'react';
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

import { quoteService } from '../api/quoteService';
import { ThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

export default function ExploreScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [exploreQuotes, setExploreQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchExploreFeed = async () => {
    try {
      const data = await quoteService.getExploreFeed();
      setExploreQuotes(data);
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

  if (isLoading && exploreQuotes.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Descoperă</Text>
        <Text style={styles.headerSubtitle}>Citate de la oameni noi</Text>
      </View>

      <FlatList
        data={exploreQuotes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderQuoteItem}
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
      paddingBottom: 10,
      backgroundColor: colors.background,
    },
    headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.textDark },
    headerSubtitle: { fontSize: 15, color: colors.textLight, marginTop: 4 },

    listContent: { padding: 15, paddingBottom: 30 },

    quoteCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 18,
      marginBottom: 15,
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
