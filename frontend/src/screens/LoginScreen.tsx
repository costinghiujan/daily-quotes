import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, Keyboard, Alert, ActivityIndicator 
} from 'react-native';
import { authService } from '../api/authService';

export default function LoginScreen({ navigation }: any) {
  const [identifier, setIdentifier] = useState(''); 
  const [password, setPassword] = useState('');

  const [identifierError, setIdentifierError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    Keyboard.dismiss(); 
    let isValid = true;

    setIdentifierError(false);
    setPasswordError(false);

    if (!identifier.trim()) {
      setIdentifierError(true);
      isValid = false;
    }
    
    if (!password.trim()) {
      setPasswordError(true);
      isValid = false;
    }

    if (isValid) {
      try {
        setIsSubmitting(true);
        
        const response = await authService.login({
          identifier: identifier.trim(),
          password: password 
        });

        console.log('[Login Reușit] Bine ai venit:', response.data.username);
        
        setPassword('');
        
        navigation.navigate('Home');

      } catch (error: any) {
        Alert.alert('Eroare de Autentificare', error.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>Bine ai revenit!</Text>
        <Text style={styles.subtitle}>Conectează-te la contul tău</Text>

        <TextInput
          style={[styles.input, identifierError && styles.inputError]}
          placeholder="Email sau Username"
          value={identifier}
          onChangeText={(text) => {
            setIdentifier(text);
            if (identifierError) setIdentifierError(false);
          }}
          autoCapitalize="none"
        />
        {identifierError && <Text style={styles.errorText}>Acest câmp este obligatoriu.</Text>}

        <TextInput
          style={[styles.input, passwordError && styles.inputError]}
          placeholder="Parolă"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) setPasswordError(false);
          }}
          secureTextEntry
        />
        {passwordError && <Text style={styles.errorText}>Parola este obligatorie.</Text>}

        <TouchableOpacity 
          style={[styles.button, isSubmitting && { backgroundColor: '#80b0b2' }]} 
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Loghează-te</Text>
          )}
        </TouchableOpacity>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center' },
  formContainer: { backgroundColor: '#fff', padding: 24, marginHorizontal: 20, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 12, color: '#333' },
  inputError: { borderColor: '#d32f2f', backgroundColor: '#ffebee' },
  errorText: { color: '#d32f2f', fontSize: 12, marginTop: -8, marginBottom: 12, marginLeft: 4 },
  button: { backgroundColor: '#006064', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#666', fontSize: 14 },
  link: { color: '#006064', fontSize: 14, fontWeight: 'bold' }
});