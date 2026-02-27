import React, { useState, useContext } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, Keyboard, Alert, ActivityIndicator 
} from 'react-native';
import { authService } from '../api/authService';
import { authStyles as styles } from '../theme/appStyles';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const { loginState } = useContext(AuthContext);
  
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

        console.log('[Login Reușit] Bine ai venit:', response.data.user.username);
        
        loginState(response.data.token);

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
        {identifierError && <Text style={styles.errorText}>Introduceți un email sau un nume de utilizator.</Text>}

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
        {passwordError && <Text style={styles.errorText}>Introduceți parola.</Text>}

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