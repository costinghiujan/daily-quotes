import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
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
  RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { quoteService } from '../api/quoteService';

import { ThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

const REACTIONS_CONFIG = [
  { key: 'BLUE_HEART', emoji: '💙', prop: 'blue_heart_count' },
  { key: 'APPLAUSE', emoji: '👏', prop: 'applause_count' },
  { key: 'SAD', emoji: '😢', prop: 'sad_count' },
  { key: 'TOUCHING', emoji: '🥺', prop: 'touching_count' },
  { key: 'HUG', emoji: '🫂', prop: 'hug_count' },
  { key: 'MIND_BLOWN', emoji: '🤯', prop: 'mind_blown_count' },
];

export default function HomeScreen({ navigation }: any) {
  const { colors, theme } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors, theme), [colors, theme]);

  const [feedQuotes, setFeedQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [newText, setNewText] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      Alert.alert('Succes', 'Citatul a fost postat!');
      setNewText('');
      setNewAuthor('');
      onRefresh(); 
    } catch (error) {
      Alert.alert('Eroare', 'Nu am putut posta citatul.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFeedItem = ({ item }: { item: any }) => {
    const handleToggleReaction = async (quoteId: number, reactionKey: string) => {
      setFeedQuotes(prevQuotes => prevQuotes.map(quote => {
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
      }));
  
      try {
        await quoteService.toggleReaction(quoteId, reactionKey);
      } catch (error) {
        console.error('A apărut o eroare de rețea la salvarea reacției.', error);
      }
    };

    return (
      <View style={styles.feedCard}>
        <View style={styles.postHeader}>
          {item.profile_picture_url ? (
            <Image source={{ uri: item.profile_picture_url }} style={styles.avatarSmall} />
          ) : (
            <View style={styles.avatarPlaceholderSmall}>
              <Ionicons name="person" size={16} color={colors.white} />
            </View>
          )}
          <View>
            <Text style={styles.postUserName}>{item.full_name || item.username}</Text>
            <Text style={styles.postUserHandle}>@{item.username}</Text>
          </View>
        </View>

        <View style={styles.quoteContent}>
          <Text style={styles.quoteText}>"{item.text}"</Text>
          <Text style={styles.quoteAuthor}>— {item.original_author}</Text>
        </View>

        <View style={styles.reactionsBar}>
          <View style={{ flexDirection: 'row', flex: 1, flexWrap: 'wrap', gap: 4 }}>
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
                  {count > 0 && (
                    <Text style={[styles.reactionCount, isSelected && styles.reactionCountActive]}>
                      {count}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity 
            style={styles.commentIconBtn}
            onPress={() => navigation.navigate('Comments', { quoteId: item.id })}
          >
            <Ionicons name="chatbubble-outline" size={22} color={colors.textLight} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const headerElement = (
    <View style={styles.createPostContainer}>
      <Text style={styles.createPostTitle}>Împarte un citat cu prietenii</Text>
      <TextInput 
        style={[styles.input, { height: 80 }]} 
        placeholder="Scrie citatul aici..." 
        placeholderTextColor={colors.textLight}
        value={newText} 
        onChangeText={setNewText} 
        multiline 
      />
      <TextInput 
        style={styles.input} 
        placeholder="Autorul citatului (ex: Albert Einstein)" 
        placeholderTextColor={colors.textLight}
        value={newAuthor} 
        onChangeText={setNewAuthor} 
      />
      <TouchableOpacity style={styles.postButton} onPress={handleAddQuote} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color={colors.white} size="small" /> : <Text style={styles.postButtonText}>Postează</Text>}
      </TouchableOpacity>
    </View>
  );

  if (isLoading && feedQuotes.length === 0) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={feedQuotes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFeedItem}
        ListHeaderComponent={headerElement}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textLight} />
            <Text style={styles.emptyText}>Feed-ul tău este gol.</Text>
            <Text style={styles.emptySubText}>Caută prieteni și acceptă cereri pentru a vedea citatele lor aici!</Text>
          </View>
        }
      />
    </View>
  );
}

const getStyles = (colors: ThemeColors, theme: string) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  listContent: { padding: 15, paddingBottom: 30, paddingTop: 50 },
  
  createPostContainer: { backgroundColor: colors.card, padding: 15, borderRadius: 10, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  createPostTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textDark, marginBottom: 10 },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 15, color: colors.textDark },
  postButton: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  postButtonText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },

  feedCard: { backgroundColor: colors.card, borderRadius: 10, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  avatarPlaceholderSmall: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  postUserName: { fontSize: 15, fontWeight: 'bold', color: colors.textDark },
  postUserHandle: { fontSize: 13, color: colors.textLight },
  quoteContent: { borderLeftWidth: 3, borderLeftColor: colors.primary, paddingLeft: 10, marginTop: 5, marginBottom: 15 },
  quoteText: { fontSize: 16, fontStyle: 'italic', color: colors.textDark, marginBottom: 8, lineHeight: 22 },
  quoteAuthor: { fontSize: 14, fontWeight: 'bold', color: colors.textLight },

  emptyContainer: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: colors.textDark, marginTop: 15 },
  emptySubText: { fontSize: 15, color: colors.textLight, textAlign: 'center', marginTop: 10, lineHeight: 22 },

  reactionsBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  commentIconBtn: { padding: 8, marginLeft: 10, backgroundColor: colors.background, borderRadius: 20 },
  reactionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 20, backgroundColor: theme === 'dark' ? '#2c2c2c' : '#f9f9f9' },
  reactionBtnActive: { backgroundColor: colors.primary + '30', borderWidth: 1, borderColor: colors.primary + '50' },
  emojiText: { fontSize: 16 },
  reactionCount: { fontSize: 13, fontWeight: 'bold', color: colors.textLight, marginLeft: 4 },
  reactionCountActive: { color: colors.primary }
});