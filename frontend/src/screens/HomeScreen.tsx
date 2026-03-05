import React, { useState, useEffect, useCallback } from 'react';
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
import { colors } from '../theme/colors';

// Configurația reacțiilor noastre
const REACTIONS_CONFIG = [
  { key: 'BLUE_HEART', emoji: '💙', prop: 'blue_heart_count' },
  { key: 'APPLAUSE', emoji: '👏', prop: 'applause_count' },
  { key: 'SAD', emoji: '😢', prop: 'sad_count' },
  { key: 'TOUCHING', emoji: '🥺', prop: 'touching_count' },
  { key: 'HUG', emoji: '🫂', prop: 'hug_count' },
  { key: 'MIND_BLOWN', emoji: '🤯', prop: 'mind_blown_count' },
];

export default function HomeScreen() {
  const [feedQuotes, setFeedQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [newText, setNewText] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // Încărcare și Refresh
  // ==========================================
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

  // ==========================================
  // Postare Citat Nou
  // ==========================================
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
    } catch (error) {
      Alert.alert('Eroare', 'Nu am putut posta citatul.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // ARHITECTURĂ: Manipularea Reacțiilor (Optimistic UI)
  // ==========================================
  const handleToggleReaction = async (quoteId: number, reactionKey: string) => {
    // 1. Modificăm starea locală instantaneu pentru a oferi feedback vizual utilizatorului
    setFeedQuotes(prevQuotes => prevQuotes.map(quote => {
      if (quote.id !== quoteId) return quote;

      const updatedQuote = { ...quote };
      const currentReaction = updatedQuote.user_reaction;
      const targetProp = reactionKey.toLowerCase() + '_count';

      if (currentReaction === reactionKey) {
        // Cazul B: Apasă pe aceeași reacție -> O șterge
        updatedQuote[targetProp] = Math.max(0, parseInt(updatedQuote[targetProp] || 0) - 1);
        updatedQuote.user_reaction = null;
      } else {
        // Cazul A & C: Apasă pe o reacție nouă
        if (currentReaction) {
          // Scădem contorul de la reacția veche (dacă se răzgândește)
          const oldProp = currentReaction.toLowerCase() + '_count';
          updatedQuote[oldProp] = Math.max(0, parseInt(updatedQuote[oldProp] || 0) - 1);
        }
        // Creștem contorul la noua reacție
        updatedQuote[targetProp] = parseInt(updatedQuote[targetProp] || 0) + 1;
        updatedQuote.user_reaction = reactionKey;
      }
      return updatedQuote;
    }));

    // 2. Trimitem cererea în fundal către server
    try {
      await quoteService.toggleReaction(quoteId, reactionKey);
    } catch (error) {
      console.error('A apărut o eroare de rețea la salvarea reacției.', error);
      // Notă: Într-o aplicație complexă, aici am da "Revert" la setFeedQuotes dacă pică netul
    }
  };

  // ==========================================
  // UI Component: Citat din Feed
  // ==========================================
  const renderFeedItem = ({ item }: { item: any }) => (
    <View style={styles.feedCard}>
      <View style={styles.postHeader}>
        {item.profile_picture_url ? (
          <Image source={{ uri: item.profile_picture_url }} style={styles.avatarSmall} />
        ) : (
          <View style={styles.avatarPlaceholderSmall}>
            <Ionicons name="person" size={16} color="#fff" />
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

      {/* BARA DE REACȚII */}
      <View style={styles.reactionsBar}>
        {REACTIONS_CONFIG.map((reaction) => {
          const count = parseInt(item[reaction.prop] || 0);
          const isSelected = item.user_reaction === reaction.key;

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
    </View>
  );

  const headerElement = (
    <View style={styles.createPostContainer}>
      <Text style={styles.createPostTitle}>Împarte un citat cu prietenii</Text>
      <TextInput style={[styles.input, { height: 80 }]} placeholder="Scrie citatul aici..." value={newText} onChangeText={setNewText} multiline />
      <TextInput style={styles.input} placeholder="Autorul citatului (ex: Albert Einstein)" value={newAuthor} onChangeText={setNewAuthor} />
      <TouchableOpacity style={styles.postButton} onPress={handleAddQuote} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.postButtonText}>Postează</Text>}
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
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Feed-ul tău este gol.</Text>
            <Text style={styles.emptySubText}>Caută prieteni și acceptă cereri pentru a vedea citatele lor aici!</Text>
          </View>
        }
      />
    </View>
  );
}

// ==========================================
// Stiluri (Design)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 15, paddingBottom: 30 },
  
  createPostContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  createPostTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 15 },
  postButton: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  postButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  feedCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  avatarPlaceholderSmall: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  postUserName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  postUserHandle: { fontSize: 13, color: '#777' },
  quoteContent: { borderLeftWidth: 3, borderLeftColor: colors.primary, paddingLeft: 10, marginTop: 5, marginBottom: 15 }, // Adăugat marginBottom
  quoteText: { fontSize: 16, fontStyle: 'italic', color: '#444', marginBottom: 8, lineHeight: 22 },
  quoteAuthor: { fontSize: 14, fontWeight: 'bold', color: '#888' },

  emptyContainer: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#555', marginTop: 15 },
  emptySubText: { fontSize: 15, color: '#777', textAlign: 'center', marginTop: 10, lineHeight: 22 },

  // ==========================================
  // Stiluri Noi pentru Bara de Reacții
  // ==========================================
  reactionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Le spațiază egal pe lățimea cardului
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f9f9f9', // Fundal subtil
  },
  reactionBtnActive: {
    backgroundColor: '#e3f2fd', // Culoare albăstruie dacă ai apăsat pe el
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  emojiText: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#777',
    marginLeft: 4,
  },
  reactionCountActive: {
    color: '#1976d2',
  }
});