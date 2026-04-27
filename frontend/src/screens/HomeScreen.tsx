import React, { useState, useEffect, useCallback, useContext, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { quoteService } from '../api/quoteService';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const REACTIONS_CONFIG = [
  { key: 'BLUE_HEART', emoji: '💙', prop: 'blue_heart_count' },
  { key: 'APPLAUSE', emoji: '👏', prop: 'applause_count' },
  { key: 'SAD', emoji: '😢', prop: 'sad_count' },
  { key: 'TOUCHING', emoji: '🥺', prop: 'touching_count' },
  { key: 'HUG', emoji: '🫂', prop: 'hug_count' },
  { key: 'MIND_BLOWN', emoji: '🤯', prop: 'mind_blown_count' },
];

export default function HomeScreen({ navigation }: any) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [feedQuotes, setFeedQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [newText, setNewText] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { colors } = useContext(ThemeContext);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const data = await quoteService.getFeed();
      setFeedQuotes(data);
    } catch (error) {
      console.error('Eroare la încărcarea feed-ului:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await quoteService.getFeed();
      setFeedQuotes(data);
    } catch (error) {
      console.error('Eroare la reîmprospătare:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleAddQuote = async () => {
    if (!newText.trim() || !newAuthor.trim()) {
      Alert.alert('Eroare', 'Completează textul și autorul!');
      return;
    }
    setIsSubmitting(true);
    try {
      await quoteService.create({ text: newText, author: newAuthor, category: 'General' });
      setNewText('');
      setNewAuthor('');
      onRefresh();
    } catch (error) {
      console.error(error);
      Alert.alert('Eroare', 'Nu am putut posta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMockImage = (id: number) => `https://picsum.photos/seed/${id}/600/800`;
  const getMockAvatar = (id: number) => `https://picsum.photos/seed/avatar${id}/100/100`;

  const renderFeedItem = ({ item, index }: { item: any, index: number }) => {
    const handleToggleReaction = async (quoteId: number, reactionKey: string) => {
      setFeedQuotes((prevQuotes) =>
        prevQuotes.map((quote) => {
          if (quote.id !== quoteId) return quote;
          const updatedQuote = { ...quote };
          const currentReactions = Array.isArray(updatedQuote.user_reactions) ? updatedQuote.user_reactions : [];
          const targetProp = reactionKey.toLowerCase() + '_count';
          const hasReacted = currentReactions.includes(reactionKey);

          if (hasReacted) {
            updatedQuote[targetProp] = Math.max(0, parseInt(updatedQuote[targetProp] || 0) - 1);
            updatedQuote.user_reactions = currentReactions.filter((key: string) => key !== reactionKey);
          } else {
            updatedQuote[targetProp] = parseInt(updatedQuote[targetProp] || 0) + 1;
            updatedQuote.user_reactions = [...currentReactions, reactionKey];
          }
          return updatedQuote;
        }),
      );
      try {
        await quoteService.toggleReaction(quoteId, reactionKey);
      } catch (error) {
        console.error('A apărut o eroare de rețea la salvarea reacției.', error);
      }
    };

    const hasAnyReaction = REACTIONS_CONFIG.some(r => parseInt(item[r.prop] || 0) > 0);
    const totalReactions = REACTIONS_CONFIG.reduce((acc, r) => acc + parseInt(item[r.prop] || 0), 0);

    return (
      <View style={styles.feedItem}>
        <View style={styles.postHeader}>
          {item.profile_picture_url ? (
            <Image source={{ uri: item.profile_picture_url }} style={styles.avatarSmall} />
          ) : (
            <Image source={{ uri: getMockAvatar(item.id || index) }} style={styles.avatarSmall} />
          )}
          <View style={styles.postHeaderInfo}>
            <Text style={styles.postUserName}>{item.full_name || item.username || 'User'}</Text>
            <Text style={styles.postSubText}>
               {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'A day exploring the city'}
            </Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textDark} />
          </TouchableOpacity>
        </View>

        <Text style={styles.postText}>&quot;{item.text}&quot; — {item.original_author}</Text>



        <View style={styles.likesRow}>
          <View style={styles.reactionsStack}>
            {hasAnyReaction ? REACTIONS_CONFIG.map((r, i) => {
              if (parseInt(item[r.prop] || 0) > 0 && i < 3) {
                 return (
                   <View key={r.key} style={[styles.reactionCircle, { backgroundColor: '#F0F2F5', zIndex: 3 - i, marginLeft: i > 0 ? -6 : 0 }]}>
                     <Text style={{ fontSize: 10 }}>{r.emoji}</Text>
                   </View>
                 );
              }
              return null;
            }) : (
              <View style={[styles.reactionCircle, { backgroundColor: '#1877F2', zIndex: 3 }]}>
                <Ionicons name="thumbs-up" size={10} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.likesText}>
            {totalReactions > 0 ? `${totalReactions} reactions` : 'No reactions yet'}
          </Text>
        </View>

        {/* Action bar for Like / Comment */}
        <View style={styles.reactionsBar}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              {REACTIONS_CONFIG.map((reaction) => {
                 const count = parseInt(item[reaction.prop] || 0);
                 const isSelected = Array.isArray(item.user_reactions) && item.user_reactions.includes(reaction.key);
                 return (
                    <TouchableOpacity
                       key={reaction.key}
                       style={[styles.reactionBtn, isSelected && styles.reactionBtnActive]}
                       onPress={() => handleToggleReaction(item.id, reaction.key)}
                    >
                       <Text style={styles.emojiText}>{reaction.emoji}</Text>
                       {count > 0 && <Text style={[styles.reactionCount, isSelected && styles.reactionCountActive]}>{count}</Text>}
                    </TouchableOpacity>
                 );
              })}
           </ScrollView>
           <TouchableOpacity
             style={styles.commentIconBtn}
             onPress={() => navigation.navigate('Comments', { quoteId: item.id })}
           >
             <Ionicons name="chatbubble-outline" size={22} color={colors.textDark} />
           </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 15, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Ionicons name="book" size={28} color={colors.primary} style={{ marginRight: 10 }} />
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.textDark }}>DailyQuotes</Text>
      </View>

      <View style={styles.createPostContainer}>
        <View style={styles.createPostTop}>
          {user?.profile_picture_url ? (
            <Image source={{ uri: user.profile_picture_url }} style={styles.myAvatar} />
          ) : (
            <Image source={{ uri: getMockAvatar(99) }} style={styles.myAvatar} />
          )}
          <View style={styles.mindInputWrapper}>
            <TextInput
              style={styles.mindInput}
              placeholder="What's on your mind?"
              placeholderTextColor={colors.textLight}
              value={newText}
              onChangeText={setNewText}
            />
          </View>
        </View>
        <TextInput
           style={[styles.mindInputWrapper, { flex: undefined, marginBottom: 15, borderRadius: 10, paddingVertical: 8 }]}
           placeholder="Author (e.g. Albert Einstein)"
           placeholderTextColor={colors.textLight}
           value={newAuthor}
           onChangeText={setNewAuthor}
        />


        {(newText.length > 0 || newAuthor.length > 0) && (
           <TouchableOpacity style={styles.postSubmitBtn} onPress={handleAddQuote} disabled={isSubmitting}>
             {isSubmitting ? (
                <ActivityIndicator color={colors.white} size="small" />
             ) : (
                <Text style={styles.postSubmitText}>Postează</Text>
             )}
           </TouchableOpacity>
        )}
      </View>

      <Text style={styles.recentTitle}>Recent</Text>
    </View>
  );

  if (isLoading && feedQuotes.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={feedQuotes}
        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
        renderItem={renderFeedItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40, paddingHorizontal: 20 }}>
            <Ionicons name="people-outline" size={64} color={colors.textLight} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textDark, marginTop: 15 }}>Feed-ul tău este gol.</Text>
            <Text style={{ fontSize: 15, color: colors.textLight, textAlign: 'center', marginTop: 10 }}>Caută prieteni și acceptă cereri pentru a vedea citatele lor aici!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#E5EFFF',
    paddingBottom: 8,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    fontSize: 18,
    color: '#1877F2',
    flex: 1,
    fontWeight: '500',
  },
  createPostContainer: {
    marginBottom: 30,
  },
  createPostTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  myAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  mindInputWrapper: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  mindInput: {
    fontSize: 16,
    color: '#1C1E21',
  },

  postSubmitBtn: {
     backgroundColor: '#1877F2',
     padding: 12,
     borderRadius: 8,
     alignItems: 'center',
     marginTop: 15,
  },
  postSubmitText: {
     color: '#FFFFFF',
     fontWeight: 'bold',
     fontSize: 16,
  },
  recentTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1E21',
    marginBottom: 15,
  },
  feedItem: {
    paddingHorizontal: 20,
    marginBottom: 35,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postHeaderInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1E21',
  },
  postSubText: {
    fontSize: 13,
    color: '#8A8D91',
    marginTop: 2,
  },
  postText: {
    fontSize: 15,
    color: '#1C1E21',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  postImageContainer: {
    width: '100%',
    height: 380,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  paginationBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paginationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  nextImageHint: {
    position: 'absolute',
    right: -20,
    top: 0,
    bottom: 0,
    width: 30,
    backgroundColor: '#000',
    opacity: 0.2,
    borderRadius: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D0D0D0',
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: '#1C1E21',
  },
  likesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reactionsStack: {
    flexDirection: 'row',
    marginRight: 8,
  },
  reactionCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  likesText: {
    fontSize: 13,
    color: '#1C1E21',
    fontWeight: '500',
  },
  reactionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
    paddingTop: 12,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    marginRight: 6,
  },
  reactionBtnActive: {
    backgroundColor: '#E5EFFF',
    borderWidth: 1,
    borderColor: '#A0C3FF',
  },
  emojiText: { fontSize: 16 },
  reactionCount: { fontSize: 13, fontWeight: 'bold', color: '#8A8D91', marginLeft: 4 },
  reactionCountActive: { color: '#1877F2' },
  commentIconBtn: {
    padding: 8,
    marginLeft: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
  },
});
