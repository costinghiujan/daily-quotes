import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, Text, View, FlatList, ActivityIndicator, 
  SafeAreaView, TextInput, TouchableOpacity, Alert, Keyboard 
} from 'react-native';
import { quoteService } from './src/api/quoteService';
import { Quote } from './src/types/Quote';

export default function App() {
  // Starea pentru lista de citate și încărcarea inițială
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // Starea Formularului (Controlled Components)
  // ==========================================
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

  // ==========================================
  // Logica pentru Adăugarea Citatului
  // ==========================================
  const handleAddQuote = async () => {
    // 1. Validarea datelor (Robustețe)
    if (!newText.trim() || !newAuthor.trim()) {
      Alert.alert('Eroare de validare', 'Te rugăm să completezi textul și autorul.');
      return;
    }

    try {
      setIsSubmitting(true); // Prevenim apăsarea multiplă pe buton
      
      // 2. Apelăm API-ul
      const createdQuote = await quoteService.create({
        text: newText.trim(),
        author: newAuthor.trim(),
        category: newCategory.trim() || undefined
      });

      // 3. Actualizăm interfața adăugând noul citat la începutul listei (Immutability)
      setQuotes([createdQuote, ...quotes]);

      // 4. Curățăm formularul și închidem tastatura
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
      
      {/* ========================================== */}
      {/* Zona Formularului */}
      {/* ========================================== */}
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

      {/* ========================================== */}
      {/* Lista de Citate */}
      {/* ========================================== */}
      <FlatList
        data={quotes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.quoteText}>"{item.text}"</Text>
            <Text style={styles.authorText}>- {item.author}</Text>
            {item.category && <Text style={styles.categoryBadge}>{item.category}</Text>}
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
  
  // Stiluri noi pentru formular
  formContainer: { backgroundColor: '#fff', padding: 16, marginHorizontal: 16, marginBottom: 16, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  flex1: { flex: 1 },
  button: { backgroundColor: '#006064', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#80b0b2' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Stiluri existente pentru listă
  listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  quoteText: { fontSize: 18, fontStyle: 'italic', color: '#333', marginBottom: 12, lineHeight: 24 },
  authorText: { fontSize: 16, fontWeight: 'bold', color: '#555', textAlign: 'right' },
  categoryBadge: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: '#e0f7fa', color: '#006064', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, fontSize: 12, fontWeight: '600', overflow: 'hidden' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 16 }
});