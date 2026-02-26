import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, 
  Platform, Keyboard, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { authService } from '../api/authService';
import { authStyles as styles } from '../theme/appStyles';

export default function RegisterScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [usernameError, setUsernameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let score = 0;
    if (password.length >= 6) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    setPasswordStrength(score);
  }, [password]);

  const isValidEmail = (emailText: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailText);
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    let isValid = true;

    setUsernameError(false);
    setEmailError(false);
    setPasswordError(false);

    if (!username.trim()) {
      setUsernameError(true);
      isValid = false;
    }

    if (!email.trim() || !isValidEmail(email)) {
      setEmailError(true);
      isValid = false;
    }

    if (!password.trim() || passwordStrength < 5) {
      setPasswordError(true);
      isValid = false;
    }

    if (isValid) {
      try {
        setIsSubmitting(true);
        
        await authService.register({
          username: username.trim(),
          email: email.trim(),
          password: password
        });

        Alert.alert(
          'Cont Creat!', 
          'Te-ai înregistrat cu succes. Te rugăm să te loghezi.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );

      } catch (error: any) {
        Alert.alert('Eroare la înregistrare', error.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const strengthWidth = `${(passwordStrength / 5) * 100}%`;
  
  const getStrengthColor = () => {
    if (passwordStrength === 0) return '#e0e0e0'; 
    if (passwordStrength <= 2) return '#ff4d4d';
    if (passwordStrength <= 4) return '#ffa64d';
    return '#33cc33';
  };

  const getStrengthLabel = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'Slabă';
    if (passwordStrength <= 4) return 'Medie';
    return 'Puternică';
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          <Text style={styles.title}>Creare Cont</Text>
          <Text style={styles.subtitle}>Alătură-te comunității noastre</Text>

          <TextInput
            style={[styles.input, usernameError && styles.inputError]}
            placeholder="Username"
            value={username}
            onChangeText={(t) => { setUsername(t); if (usernameError) setUsernameError(false); }}
            autoCapitalize="none"
          />
          {usernameError && <Text style={styles.errorText}>Username-ul este obligatoriu.</Text>}

          <TextInput
            style={[styles.input, emailError && styles.inputError]}
            placeholder="Email"
            value={email}
            onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(false); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailError && <Text style={styles.errorText}>Introduceți un email valid.</Text>}

          <TextInput
            style={[styles.input, passwordError && styles.inputError]}
            placeholder="Parolă"
            value={password}
            onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(false); }}
            secureTextEntry
          />

          <View style={styles.strengthContainer}>
            <View style={styles.strengthBarBackground}>
              <View style={[styles.strengthBarFill, { width: strengthWidth as any, backgroundColor: getStrengthColor() }]} />
            </View>
            <Text style={[styles.strengthLabel, { color: getStrengthColor() }]}>{getStrengthLabel()}</Text>
          </View>

          <View style={styles.rulesContainer}>
            <Text style={password.length >= 6 ? styles.ruleMet : styles.ruleUnmet}>• Minim 6 caractere</Text>
            <Text style={/[a-z]/.test(password) ? styles.ruleMet : styles.ruleUnmet}>• O literă mică</Text>
            <Text style={/[A-Z]/.test(password) ? styles.ruleMet : styles.ruleUnmet}>• O literă mare</Text>
            <Text style={/[0-9]/.test(password) ? styles.ruleMet : styles.ruleUnmet}>• Un număr</Text>
            <Text style={/[^A-Za-z0-9]/.test(password) ? styles.ruleMet : styles.ruleUnmet}>• Un caracter special (!@#$%)</Text>
          </View>
          {passwordError && <Text style={styles.errorText}>Parola nu respectă toate regulile.</Text>}

          <TouchableOpacity 
            style={[styles.button, isSubmitting && { backgroundColor: '#80b0b2' }]} 
            onPress={handleRegister}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Înregistrare</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Ai deja un cont? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Loghează-te aici</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}