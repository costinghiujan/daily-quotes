import React, { useState, useEffect, useContext, useMemo } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, FlatList, 
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { quoteService, Comment } from '../api/quoteService';

import { ThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

export default function CommentsScreen({ route, navigation }: any) {
  const { quoteId } = route.params;

  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const data = await quoteService.getComments(quoteId);
      setComments(data);
    } catch (error) {
      Alert.alert('Eroare', 'Nu am putut încărca discuția.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [quoteId]);

  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const postedComment = await quoteService.addComment(quoteId, newComment.trim());
      setComments((prev) => [...prev, postedComment]);
      setNewComment('');
    } catch (error) {
      Alert.alert('Eroare', 'Nu am putut posta comentariul.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const date = new Date(item.created_at).toLocaleDateString('ro-RO', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.commentCard}>
        {item.profile_picture_url ? (
          <Image source={{ uri: item.profile_picture_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={16} color={colors.white} />
          </View>
        )}
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.username}>{item.full_name || item.username}</Text>
            <Text style={styles.timeText}>{date}</Text>
          </View>
          <Text style={styles.commentText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {isLoading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderComment}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Fii primul care lasă un comentariu!</Text>
          }
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Adaugă un comentariu..."
          placeholderTextColor={colors.textLight}
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !newComment.trim() && { opacity: 0.5 }]} 
          onPress={handleSendComment}
          disabled={isSubmitting || !newComment.trim()}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="send" size={20} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 15, paddingBottom: 20 },
  
  commentCard: { flexDirection: 'row', marginBottom: 15 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  
  commentContent: { flex: 1, backgroundColor: colors.card, padding: 12, borderRadius: 12, borderTopLeftRadius: 2, borderWidth: 1, borderColor: colors.border },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  username: { fontWeight: 'bold', fontSize: 14, color: colors.textDark },
  timeText: { fontSize: 11, color: colors.textLight },
  commentText: { fontSize: 14, color: colors.textDark, lineHeight: 20 },
  
  emptyText: { textAlign: 'center', color: colors.textLight, marginTop: 40, fontSize: 15 },
  
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center' },
  input: { flex: 1, backgroundColor: colors.background, color: colors.textDark, borderRadius: 20, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 10, minHeight: 40, maxHeight: 100, borderWidth: 1, borderColor: colors.border },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});