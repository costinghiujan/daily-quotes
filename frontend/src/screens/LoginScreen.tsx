import React, { useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { authService } from '../api/authService';
import { AuthContext } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemeContext } from '../context/ThemeContext';
import { AlertContext } from '../context/AlertContext';

export default function LoginScreen({ navigation }: any) {
  const { loginState } = useContext(AuthContext);
  const { t } = useTranslation();

  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { showAlert } = useContext(AlertContext);

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
        showAlert({
          title: t('auth.loginError'),
          message: error.message,
          confirmText: t('common.ok'),
          hideCancel: true,
        });
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
      <LinearGradient
        colors={colors.backgroundGradient as [string, string, string]}
        style={StyleSheet.absoluteFill}
      />
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
          <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
          <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
        </View>

        <TextInput
          style={[styles.input, identifierError && styles.inputError]}
          placeholder={t('auth.emailOrUsername')}
          placeholderTextColor={colors.textLight}
          value={identifier}
          onChangeText={(text) => {
            setIdentifier(text);
            if (identifierError) setIdentifierError(false);
          }}
          autoCapitalize="none"
        />
        {identifierError && (
          <Text style={styles.errorText}>{t('auth.identifierRequired')}</Text>
        )}

        <View style={{ width: '100%', justifyContent: 'center' }}>
          <TextInput
            style={[styles.input, passwordError && styles.inputError, { paddingRight: 50 }]}
            placeholder={t('auth.password')}
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

        {passwordError && <Text style={styles.errorText}>{t('auth.passwordRequired')}</Text>}

        <TouchableOpacity
          style={[styles.button, isSubmitting && { opacity: 0.7 }]}
          onPress={handleLogin}
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
              <Text style={styles.buttonText}>{t('auth.login')}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.noAccount')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>{t('auth.createOne')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
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
    subtitle: {
      fontSize: 15,
      color: colors.textLight,
      textAlign: 'center',
    },
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
      borderRadius: 12,
      overflow: 'hidden',
      marginTop: 10,
    },
    buttonGradient: {
      paddingVertical: 15,
      alignItems: 'center',
    },
    buttonText: {
      color: colors.buttonPrimaryText,
      fontSize: 18,
      fontWeight: 'bold',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 20,
    },
    footerText: {
      color: colors.textLight,
      fontSize: 14,
    },
    link: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: 'bold',
    },
  });
