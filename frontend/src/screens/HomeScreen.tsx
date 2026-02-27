import React, { useEffect, useState, useContext } from 'react';
import { 
  StyleSheet, Text, View, FlatList, ActivityIndicator,
   TextInput, TouchableOpacity, Alert, Keyboard 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { quoteService } from '../api/quoteService';
import { Quote } from '../types/Quote';
import { homeStyles as styles } from '../theme/appStyles';
import { AuthContext } from '../context/AuthContext';

export default function App() {
  const { logout } = useContext(AuthContext)

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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 }}>
        <Text style={[styles.headerTitle, { marginVertical: 0 }]}>Daily Quotes</Text>
        <TouchableOpacity 
          onPress={logout} 
          style={{ backgroundColor: '#ffebee', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
        >
          <Text style={{ color: '#d32f2f', fontWeight: 'bold' }}>Ieșire Cont</Text>
        </TouchableOpacity>
      </View>
      
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