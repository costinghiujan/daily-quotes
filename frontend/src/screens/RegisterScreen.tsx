import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, 
  Platform, Keyboard, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { authService } from '../api/authService';

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 20 },
  formContainer: { backgroundColor: '#fff', padding: 24, marginHorizontal: 20, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 },
  
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 12, color: '#333' },
  inputError: { borderColor: '#d32f2f', backgroundColor: '#ffebee' },
  errorText: { color: '#d32f2f', fontSize: 12, marginTop: -8, marginBottom: 12, marginLeft: 4 },
  
  strengthContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  strengthBarBackground: { flex: 1, height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, overflow: 'hidden', marginRight: 10 },
  strengthBarFill: { height: '100%', borderRadius: 4 },
  strengthLabel: { fontSize: 12, fontWeight: 'bold', width: 60, textAlign: 'right' },
  
  rulesContainer: { marginBottom: 16, paddingHorizontal: 4 },
  ruleMet: { color: '#33cc33', fontSize: 12, marginBottom: 2 }, 
  ruleUnmet: { color: '#9e9e9e', fontSize: 12, marginBottom: 2 },
  
  button: { backgroundColor: '#006064', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#666', fontSize: 14 },
  link: { color: '#006064', fontSize: 14, fontWeight: 'bold' }
});