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

export default function HomeScreen() {
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
      console.error('Eroare la reîmprospătarea feed-ului:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleAddQuote = async () => {
    if (!newText.trim() || !newAuthor.trim()) {
      Alert.alert('Eroare', 'Te rugăm să completezi textul și autorul citatului!');
      return;
    }

    setIsSubmitting(true);
    try {
      await quoteService.create({ text: newText, author: newAuthor, category: 'General' });
      Alert.alert('Succes', 'Citatul a fost postat pe profilul tău!');
      setNewText('');
      setNewAuthor('');
      
    } catch (error) {
      Alert.alert('Eroare', 'Nu am putut posta citatul.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
    </View>
  );

  const headerElement = (
    <View style={styles.createPostContainer}>
      <Text style={styles.createPostTitle}>Împarte un citat cu prietenii</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Scrie citatul aici..."
        value={newText}
        onChangeText={setNewText}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Autorul citatului (ex: Albert Einstein)"
        value={newAuthor}
        onChangeText={setNewAuthor}
      />
      <TouchableOpacity 
        style={styles.postButton} 
        onPress={handleAddQuote}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.postButtonText}>Postează</Text>
        )}
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
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Feed-ul tău este gol.</Text>
            <Text style={styles.emptySubText}>Caută prieteni și acceptă cereri pentru a vedea citatele lor aici!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 15, paddingBottom: 30 },
  
  createPostContainer: {
    backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5,
  },
  createPostTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  input: {
    backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', 
    borderRadius: 8, padding: 12, marginBottom: 10, fontSize: 15,
  },
  postButton: {
    backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center',
  },
  postButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  feedCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 15,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  avatarPlaceholderSmall: {
    width: 40, height: 40, borderRadius: 20, marginRight: 10,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  postUserName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  postUserHandle: { fontSize: 13, color: '#777' },
  quoteContent: { borderLeftWidth: 3, borderLeftColor: colors.primary, paddingLeft: 10, marginTop: 5 },
  quoteText: { fontSize: 16, fontStyle: 'italic', color: '#444', marginBottom: 8, lineHeight: 22 },
  quoteAuthor: { fontSize: 14, fontWeight: 'bold', color: '#888' },

  emptyContainer: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#555', marginTop: 15 },
  emptySubText: { fontSize: 15, color: '#777', textAlign: 'center', marginTop: 10, lineHeight: 22 },
});