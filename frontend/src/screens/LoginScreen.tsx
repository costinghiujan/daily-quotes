import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, Keyboard 
} from 'react-native';

// Primim obiectul "navigation" automat de la Stack.Navigator-ul din App.tsx
export default function LoginScreen({ navigation }: any) {
  // 1. Starea datelor introduse
  const [identifier, setIdentifier] = useState(''); // Poate fi Email sau Username
  const [password, setPassword] = useState('');

  // 2. Starea erorilor (pentru feedback vizual)
  const [identifierError, setIdentifierError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Funcția declanșată la apăsarea butonului de Login
  const handleLogin = () => {
    Keyboard.dismiss(); // Ascundem tastatura
    let isValid = true;

    // Resetăm erorile la fiecare nouă încercare de logare
    setIdentifierError(false);
    setPasswordError(false);

    // ==========================================
    // Validare și Robustețe
    // ==========================================
    if (!identifier.trim()) {
      setIdentifierError(true);
      isValid = false;
    }
    
    if (!password.trim()) {
      setPasswordError(true);
      isValid = false;
    }

    // Dacă formularul este complet, trecem mai departe
    if (isValid) {
      // TODO: Aici vom conecta backend-ul Node.js mai târziu. 
      // Deocamdată simulăm o logare cu succes și navigăm spre HomeScreen.
      console.log('Autentificare simulată pentru:', identifier);
      navigation.navigate('Home');
    }
  };

  return (
    // KeyboardAvoidingView previne acoperirea formularului de către tastatura telefonului
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>Bine ai revenit!</Text>
        <Text style={styles.subtitle}>Conectează-te la contul tău</Text>

        {/* Câmpul Email/Username */}
        <TextInput
          // Dacă identifierError este true, aplicăm SUPRASCRIEREA de stil (marginea roșie)
          style={[styles.input, identifierError && styles.inputError]}
          placeholder="Email sau Username"
          value={identifier}
          onChangeText={(text) => {
            setIdentifier(text);
            // Ștergem eroarea vizuală în secunda în care utilizatorul începe să tasteze
            if (identifierError) setIdentifierError(false);
          }}
          autoCapitalize="none" // Foarte important pentru email-uri și username-uri
        />
        {identifierError && <Text style={styles.errorText}>Acest câmp este obligatoriu.</Text>}

        {/* Câmpul Parolă */}
        <TextInput
          style={[styles.input, passwordError && styles.inputError]}
          placeholder="Parolă"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) setPasswordError(false);
          }}
          secureTextEntry // Ascunde caracterele (afișează puncte)
        />
        {passwordError && <Text style={styles.errorText}>Parola este obligatorie.</Text>}

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Loghează-te</Text>
        </TouchableOpacity>

        {/* Zona de navigare către Register */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Nu ai cont? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Creează unul acum</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ==========================================
// Stiluri și UI Design
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center' },
  formContainer: { backgroundColor: '#fff', padding: 24, marginHorizontal: 20, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 },
  
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 12, color: '#333' },
  // Clasa CSS care se aplică doar la eroare (suprascrie borderColor-ul de mai sus)
  inputError: { borderColor: '#d32f2f', backgroundColor: '#ffebee' },
  errorText: { color: '#d32f2f', fontSize: 12, marginTop: -8, marginBottom: 12, marginLeft: 4 },
  
  button: { backgroundColor: '#006064', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#666', fontSize: 14 },
  link: { color: '#006064', fontSize: 14, fontWeight: 'bold' }
});