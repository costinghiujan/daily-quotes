import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { authService } from '../api/authService';
import { Ionicons } from '@expo/vector-icons';

import { ThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

export default function RegisterScreen({ navigation }: any) {
  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);

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
          password: password,
        });

        Alert.alert('Cont Creat!', 'Te-ai înregistrat cu succes. Te rugăm să te loghezi.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } catch (error: any) {
        Alert.alert('Eroare la înregistrare', error.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const strengthWidth = `${(passwordStrength / 5) * 100}%`;

  const getStrengthColor = () => {
    if (passwordStrength === 0) return colors.border;
    if (passwordStrength <= 2) return colors.error;
    if (passwordStrength <= 4) return '#ffa64d';
    return colors.success;
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
            placeholderTextColor={colors.textLight}
            value={username}
            onChangeText={(t) => {
              setUsername(t);
              if (usernameError) setUsernameError(false);
            }}
            autoCapitalize="none"
          />
          {usernameError && (
            <Text style={styles.errorText}>Introduceți un nume de utilizator.</Text>
          )}

          <TextInput
            style={[styles.input, emailError && styles.inputError]}
            placeholder="Email"
            placeholderTextColor={colors.textLight}
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (emailError) setEmailError(false);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailError && <Text style={styles.errorText}>Introduceți un email valid.</Text>}

          <View style={{ width: '100%', justifyContent: 'center' }}>
            <TextInput
              style={[styles.input, passwordError && styles.inputError, { paddingRight: 50 }]}
              placeholder="Parolă"
              placeholderTextColor={colors.textLight}
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
                name={showPassword ? 'eye-off' : 'eye'}
                size={24}
                color={colors.textLight}
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
              <View
                style={[
                  styles.strengthBarFill,
                  { width: strengthWidth as any, backgroundColor: getStrengthColor() },
                ]}
              />
            </View>
            <Text style={[styles.strengthLabel, { color: getStrengthColor() }]}>
              {getStrengthLabel()}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, isSubmitting && { backgroundColor: colors.primary + '80' }]}
            onPress={handleRegister}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.white} />
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

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    formContainer: {
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 15,
      elevation: 3,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 5,
      textAlign: 'center',
    },
    subtitle: { fontSize: 16, color: colors.textLight, marginBottom: 25, textAlign: 'center' },

    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 15,
      marginBottom: 15,
      fontSize: 16,
      color: colors.textDark,
    },
    inputError: { borderColor: colors.error, borderWidth: 1.5 },
    errorText: {
      color: colors.error,
      fontSize: 12,
      marginTop: -10,
      marginBottom: 10,
      marginLeft: 5,
    },

    button: {
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 10,
    },
    buttonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },

    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    footerText: { color: colors.textDark, fontSize: 14 },
    link: { color: colors.primary, fontSize: 14, fontWeight: 'bold' },

    strengthContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: -5,
      marginBottom: 15,
    },
    strengthBarBackground: {
      flex: 1,
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      marginRight: 10,
    },
    strengthBarFill: { height: '100%', borderRadius: 3 },
    strengthLabel: { fontSize: 12, fontWeight: 'bold', width: 60, textAlign: 'right' },
  });
