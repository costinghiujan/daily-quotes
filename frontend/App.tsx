import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, FlatList, ActivityIndicator, 
  SafeAreaView, TextInput, TouchableOpacity, Alert, Keyboard 
} from 'react-native';
import { quoteService } from './src/api/quoteService';
import { Quote } from './src/types/Quote';

export default function App() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [newText, setNewText] = useState<string>('');
  const [newAuthor, setNewAuthor] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  const handleAddQuote = async () => {
    if (!newText.trim() || !newAuthor.trim()) {
      Alert.alert('Eroare de validare', 'Te rugăm să completezi textul și autorul.');
      return;
    }

    try {
      setIsSubmitting(true); 
      const createdQuote = await quoteService.create({
        text: newText.trim(),
        author: newAuthor.trim(),
        category: newCategory.trim() || undefined
      });

      setQuotes([createdQuote, ...quotes]);

      setNewText('');
      setNewAuthor('');
      setNewCategory('');
      Keyboard.dismiss();

    } catch (err) {
      Alert.alert('Eroare', 'Citatul nu a putut fi salvat. Încearcă din nou.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // Logica pentru Ștergerea Citatului (DELETE)
  // ==========================================
  const handleDeleteQuote = (id: number) => {
    // Robustețe: Prevenim ștergerile accidentale solicitând confirmarea utilizatorului
    Alert.alert(
      'Ștergere Citat',
      'Ești sigur că vrei să ștergi acest citat definitiv?',
      [
        { text: 'Anulează', style: 'cancel' },
        { 
          text: 'Șterge', 
          style: 'destructive', // Colorează butonul cu roșu pe iOS
          onPress: async () => {
            try {
              // 1. Apelăm API-ul pentru a șterge din baza de date
              await quoteService.delete(id);
              
              // 2. Actualizăm interfața (Immutability): filtrăm array-ul păstrând doar citatele care NU au ID-ul șters
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
        
        <TouchableOpacity 
          style={[styles.button, isSubmitting && styles.buttonDisabled]} 
          onPress={handleAddQuote}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Adaugă Citat</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Secțiunea superioară a cardului (Text + Autor) */}
            <View>
              <Text style={styles.quoteText}>"{item.text}"</Text>
              <Text style={styles.authorText}>- {item.author}</Text>
            </View>
            
            {/* Secțiunea inferioară a cardului (Categorie + Buton Ștergere) */}
            <View style={styles.cardFooter}>
              {item.category ? (
                <Text style={styles.categoryBadge}>{item.category}</Text>
              ) : (
                <View /> /* Spațiu gol dacă nu există categorie, pentru a împinge butonul de ștergere la dreapta */
              )}
              
              <TouchableOpacity 
                onPress={() => handleDeleteQuote(item.id)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Șterge</Text>
              </TouchableOpacity>
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
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  flex1: { flex: 1 },
  button: { backgroundColor: '#006064', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#80b0b2' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  quoteText: { fontSize: 18, fontStyle: 'italic', color: '#333', marginBottom: 12, lineHeight: 24 },
  authorText: { fontSize: 16, fontWeight: 'bold', color: '#555', textAlign: 'right' },
  
  // Stiluri noi pentru Footer-ul Cardului și Butonul de Ștergere
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  categoryBadge: { backgroundColor: '#e0f7fa', color: '#006064', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, fontSize: 12, fontWeight: '600', overflow: 'hidden' },
  deleteButton: { backgroundColor: '#ffebee', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  deleteButtonText: { color: '#c62828', fontSize: 12, fontWeight: 'bold' },
  
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 16 }
});