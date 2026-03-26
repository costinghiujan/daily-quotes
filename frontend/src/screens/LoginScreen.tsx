import React, { useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { authService } from '../api/authService';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

import { ThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

export default function LoginScreen({ navigation }: any) {
  const { loginState } = useContext(AuthContext);

  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
          password: password,
        });

        console.log('[Login Reușit] Bine ai venit:', response.data.user.username);

        loginState(response.data.token, response.data.user);
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
          placeholderTextColor={colors.textLight}
          value={identifier}
          onChangeText={(text) => {
            setIdentifier(text);
            if (identifierError) setIdentifierError(false);
          }}
          autoCapitalize="none"
        />
        {identifierError && (
          <Text style={styles.errorText}>Introduceți un email sau un nume de utilizator.</Text>
        )}

        <View style={{ width: '100%', justifyContent: 'center' }}>
          <TextInput
            style={[styles.input, passwordError && styles.inputError, { paddingRight: 50 }]}
            placeholder="Parolă"
            placeholderTextColor={colors.textLight}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError(false);
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={{ position: 'absolute', right: 15 }}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        {passwordError && <Text style={styles.errorText}>Introduceți parola.</Text>}

        <TouchableOpacity
          style={[styles.button, isSubmitting && { backgroundColor: colors.primary + '80' }]}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
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

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      padding: 20,
    },
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
    subtitle: {
      fontSize: 16,
      color: colors.textLight,
      marginBottom: 25,
      textAlign: 'center',
    },
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
    inputError: {
      borderColor: colors.error,
      borderWidth: 1.5,
    },
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
    buttonText: {
      color: colors.white,
      fontSize: 18,
      fontWeight: 'bold',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
    },
    footerText: {
      color: colors.textDark,
      fontSize: 14,
    },
    link: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: 'bold',
    },
  });
