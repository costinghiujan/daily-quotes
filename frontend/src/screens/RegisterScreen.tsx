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
  ActivityIndicator,
} from 'react-native';
import { authService } from '../api/authService';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemeContext } from '../context/ThemeContext';
import { AlertContext } from '../context/AlertContext';

export default function RegisterScreen({ navigation }: any) {
  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { showAlert } = useContext(AlertContext);
  const { t } = useTranslation();

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

        showAlert({
          title: t('auth.registerSuccess'),
          message: t('auth.registerSuccessMsg'),
          confirmText: t('common.ok'),
          hideCancel: true,
          onConfirm: () => navigation.navigate('Login'),
        });
      } catch (error: any) {
        showAlert({
          title: t('auth.registerError'),
          message: error.message,
          confirmText: t('common.ok'),
          hideCancel: true,
        });
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
    if (passwordStrength <= 2) return t('auth.weak');
    if (passwordStrength <= 4) return t('auth.medium');
    return t('auth.strong');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, string]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          <View style={styles.logoSection}>
            <LinearGradient
              colors={colors.primaryGradient as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoIcon}
            >
              <Ionicons name="book" size={28} color="#fff" />
            </LinearGradient>
            <Text style={styles.title}>{t('auth.createAccount')}</Text>
            <Text style={styles.subtitle}>{t('auth.registerSubtitle')}</Text>
          </View>

          <TextInput
            style={[styles.input, usernameError && styles.inputError]}
            placeholder={t('auth.username')}
            placeholderTextColor={colors.textLight}
            value={username}
            onChangeText={(t) => {
              setUsername(t);
              if (usernameError) setUsernameError(false);
            }}
            autoCapitalize="none"
          />
          {usernameError && (
            <Text style={styles.errorText}>{t('auth.usernameRequired')}</Text>
          )}

          <TextInput
            style={[styles.input, emailError && styles.inputError]}
            placeholder={t('auth.email')}
            placeholderTextColor={colors.textLight}
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (emailError) setEmailError(false);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailError && <Text style={styles.errorText}>{t('auth.emailRequired')}</Text>}

          <View style={{ width: '100%', justifyContent: 'center' }}>
            <TextInput
              style={[styles.input, passwordError && styles.inputError, { paddingRight: 50 }]}
              placeholder={t('auth.password')}
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
              {t('auth.passwordStrength')}
            </Text>
          )}

          <View style={styles.strengthContainer}>
            <View style={[styles.strengthBarBackground, { backgroundColor: colors.progressBarBg }]}>
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
            style={[styles.button, isSubmitting && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={colors.buttonPrimaryBg as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.buttonPrimaryText} />
              ) : (
                <Text style={styles.buttonText}>{t('auth.register')}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.haveAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>{t('auth.loginHere')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    formContainer: {
      backgroundColor: colors.card,
      padding: 24,
      borderRadius: 20,
      elevation: 5,
      shadowColor: colors.cardShadow,
      shadowOpacity: 0.15,
      shadowRadius: 15,
      shadowOffset: { width: 0, height: 8 },
    },
    logoSection: {
      alignItems: 'center',
      marginBottom: 25,
    },
    logoIcon: {
      width: 56,
      height: 56,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.textDark,
      marginBottom: 5,
      textAlign: 'center',
    },
    subtitle: { fontSize: 15, color: colors.textLight, textAlign: 'center' },

    input: {
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 12,
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
      borderRadius: 12,
      overflow: 'hidden',
      marginTop: 10,
    },
    buttonGradient: {
      paddingVertical: 15,
      alignItems: 'center',
    },
    buttonText: { color: colors.buttonPrimaryText, fontSize: 18, fontWeight: 'bold' },

    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    footerText: { color: colors.textLight, fontSize: 14 },
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
      borderRadius: 3,
      marginRight: 10,
    },
    strengthBarFill: { height: '100%', borderRadius: 3 },
    strengthLabel: { fontSize: 12, fontWeight: 'bold', width: 60, textAlign: 'right' },
  });
