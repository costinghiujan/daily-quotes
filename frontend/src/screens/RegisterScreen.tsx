import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, 
  Platform, Keyboard, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { authService } from '../api/authService';
import { authStyles as styles } from '../theme/appStyles';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

    if (!password.trim() || passwordStrength < 3 || password.length < 6) {
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
          {usernameError && <Text style={styles.errorText}>Introduceți un nume de utilizator.</Text>}

          <TextInput
            style={[styles.input, emailError && styles.inputError]}
            placeholder="Email"
            value={email}
            onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(false); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailError && <Text style={styles.errorText}>Introduceți un email valid.</Text>}

          <View style={{ width: '100%', justifyContent: 'center' }}>
          <TextInput
            style={[styles.input, passwordError && styles.inputError, { paddingRight: 50 }]}
            placeholder="Parolă"
            value={password}
            onChangeText={(t) => { 
              setPassword(t); 
              if (passwordError) setPasswordError(false); 
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />

          <TouchableOpacity 
            style={{ position: 'absolute', right: 15 }} 
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? "eye-off" : "eye"} 
              size={24} 
              color="#757575" 
            />
          </TouchableOpacity>
        </View>

        {passwordError && (
          <Text style={styles.errorText}>
            Introduceți o parolă ce are minim 6 caractere și o putere cel puțin medie.
          </Text>
        )}

          <View style={styles.strengthContainer}>
            <View style={styles.strengthBarBackground}>
              <View style={[styles.strengthBarFill, { width: strengthWidth as any, backgroundColor: getStrengthColor() }]} />
            </View>
            <Text style={[styles.strengthLabel, { color: getStrengthColor() }]}>{getStrengthLabel()}</Text>
          </View>

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