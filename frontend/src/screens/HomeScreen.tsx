import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, FlatList, ActivityIndicator,
   TextInput, TouchableOpacity, Alert, Keyboard 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { quoteService } from '../api/quoteService';
import { Quote } from '../types/Quote';

export default function App() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [newText, setNewText] = useState<string>('');
  const [newAuthor, setNewAuthor] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const [editingQuoteId, setEditingQuoteId] = useState<number | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await quoteService.getAll();
      setQuotes(data);
    } catch (err) {
      setError('Nu am putut contacta serverul. Verifică IP-ul!');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewText('');
    setNewAuthor('');
    setNewCategory('');
    setEditingQuoteId(null);
    Keyboard.dismiss();
  };

  const handleSubmit = async () => {
    if (!newText.trim() || !newAuthor.trim()) {
      Alert.alert('Eroare de validare', 'Te rugăm să completezi textul și autorul.');
      return;
    }

    try {
      setIsSubmitting(true); 
      
      const payload = {
        text: newText.trim(),
        author: newAuthor.trim(),
        category: newCategory.trim() || undefined
      };

      if (editingQuoteId) {
        const updatedQuote = await quoteService.update(editingQuoteId, payload);
        
        setQuotes(quotes.map(q => (q.id === editingQuoteId ? updatedQuote : q)));
        Alert.alert('Succes', 'Citatul a fost actualizat!');
      } else {
        const createdQuote = await quoteService.create(payload);
        setQuotes([createdQuote, ...quotes]);
      }

      resetForm();
    } catch (err) {
      Alert.alert('Eroare', 'Operațiunea a eșuat. Încearcă din nou.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPress = (quote: Quote) => {
    setNewText(quote.text);
    setNewAuthor(quote.author);
    setNewCategory(quote.category || '');
    setEditingQuoteId(quote.id);
  };

  const handleDeleteQuote = (id: number) => {
    Alert.alert(
      'Ștergere Citat',
      'Ești sigur că vrei să ștergi acest citat definitiv?',
      [
        { text: 'Anulează', style: 'cancel' },
        { 
          text: 'Șterge', 
          style: 'destructive',
          onPress: async () => {
            try {
              await quoteService.delete(id);
              setQuotes(quotes.filter(quote => quote.id !== id));
            } catch (err) {
              Alert.alert('Eroare', 'Citatul nu a putut fi șters. Verifică conexiunea.');
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Se descarcă citatele...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Daily Quotes</Text>
      
      <View style={styles.formContainer}>
        {editingQuoteId && (
          <Text style={styles.editModeText}>Mod Editare Activ</Text>
        )}
        
        <TextInput 
          style={styles.input} 
          placeholder="Citatul (ex: Fii schimbarea...)" 
          value={newText}
          onChangeText={setNewText}
          multiline
        />
        <View style={styles.row}>
          <TextInput 
            style={[styles.input, styles.flex1, { marginRight: 8 }]} 
            placeholder="Autor" 
            value={newAuthor}
            onChangeText={setNewAuthor}
          />
          <TextInput 
            style={[styles.input, styles.flex1]} 
            placeholder="Categorie (opțional)" 
            value={newCategory}
            onChangeText={setNewCategory}
          />
        </View>
        
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity 
            style={[styles.button, styles.flex1, isSubmitting && styles.buttonDisabled]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {editingQuoteId ? 'Salvează' : 'Adaugă Citat'}
              </Text>
            )}
          </TouchableOpacity>

          {editingQuoteId && (
            <TouchableOpacity 
              style={[styles.cancelButton, { marginLeft: 8 }]} 
              onPress={resetForm}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Anulează</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.quoteText}>"{item.text}"</Text>
              <Text style={styles.authorText}>- {item.author}</Text>
            </View>
            
            <View style={styles.cardFooter}>
              {item.category ? (
                <Text style={styles.categoryBadge}>{item.category}</Text>
              ) : (
                <View />
              )}
              
              <View style={styles.cardActions}>
                <TouchableOpacity 
                  onPress={() => handleEditPress(item)}
                  style={styles.editButton}
                >
                  <Text style={styles.editButtonText}>Editează</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => handleDeleteQuote(item.id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>Șterge</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Baza de date este goală. Adaugă citate!</Text>}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#333' },
  
  formContainer: { backgroundColor: '#fff', padding: 16, marginHorizontal: 16, marginBottom: 16, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  editModeText: { color: '#f57c00', fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  flex1: { flex: 1 },
  
  button: { backgroundColor: '#006064', paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { backgroundColor: '#80b0b2' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#eeeeee', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: '#333', fontSize: 16, fontWeight: 'bold' },

  listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  quoteText: { fontSize: 18, fontStyle: 'italic', color: '#333', marginBottom: 12, lineHeight: 24 },
  authorText: { fontSize: 16, fontWeight: 'bold', color: '#555', textAlign: 'right' },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  cardActions: { flexDirection: 'row', gap: 8 }, // Adăugat gap pentru a spația butoanele
  categoryBadge: { backgroundColor: '#e0f7fa', color: '#006064', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, fontSize: 12, fontWeight: '600', overflow: 'hidden' },
  editButton: { backgroundColor: '#fff3e0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginRight: 8 },
  editButtonText: { color: '#e65100', fontSize: 12, fontWeight: 'bold' },
  deleteButton: { backgroundColor: '#ffebee', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  deleteButtonText: { color: '#c62828', fontSize: 12, fontWeight: 'bold' },
  
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 16 }
});