import React, { useEffect, useRef, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface ZenQuoteCardProps {
  text: string;
  author: string;
  onClose: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

const GRADIENT_COLORS: [string, string][] = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a18cd1', '#fbc2eb'],
  ['#fccb90', '#d57eeb'],
  ['#e0c3fc', '#8ec5fc'],
];

export default function ZenQuoteCard({
  text,
  author,
  onClose,
  isMuted,
  onToggleMute,
}: ZenQuoteCardProps) {
  const { colors, theme } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const gradientIndex = useRef(0);
  const gradientAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setHidden(true, 'fade');
    return () => {
      StatusBar.setHidden(false, 'fade');
    };
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    const interval = setInterval(() => {
      gradientIndex.current = (gradientIndex.current + 1) % GRADIENT_COLORS.length;
      Animated.timing(gradientAnim, {
        toValue: gradientIndex.current,
        duration: 4000,
        useNativeDriver: false,
      }).start();
    }, 6000);

    return () => clearInterval(interval);
  }, [gradientAnim]);

  const interpolatedGradient = gradientAnim.interpolate({
    inputRange: GRADIENT_COLORS.map((_, i) => i),
    outputRange: GRADIENT_COLORS.map((colors) => JSON.stringify(colors)),
  });

  const currentGradient = GRADIENT_COLORS[0];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={currentGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Top bar with controls */}
        <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlBtn}
            onPress={onToggleMute}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isMuted ? 'volume-mute' : 'volume-high'}
              size={26}
              color="rgba(255,255,255,0.9)"
            />
          </TouchableOpacity>
        </View>

        {/* Quote content */}
        <Animated.View
          style={[
            styles.contentContainer,
            { opacity: fadeAnim },
          ]}
        >
          <Text style={styles.quoteMark}>{'\u201C'}</Text>
          <Text style={styles.quoteText}>{text}</Text>
          <Text style={styles.authorText}>— {author}</Text>
        </Animated.View>

        {/* Bottom hint */}
        <View style={[styles.bottomHint, { paddingBottom: insets.bottom + 20 }]}>
          <Ionicons name="chevron-down" size={24} color="rgba(255,255,255,0.4)" />
          <Text style={styles.hintText}>Swipe down or tap X to exit</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
      justifyContent: 'space-between',
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 10,
    },
    controlBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0,0,0,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    contentContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    quoteMark: {
      fontSize: 64,
      color: 'rgba(255,255,255,0.3)',
      marginBottom: 10,
      lineHeight: 70,
    },
    quoteText: {
      fontSize: 26,
      lineHeight: 38,
      color: '#FFFFFF',
      textAlign: 'center',
      fontStyle: 'italic',
      fontWeight: '500',
      letterSpacing: 0.5,
    },
    authorText: {
      fontSize: 18,
      color: 'rgba(255,255,255,0.8)',
      textAlign: 'right',
      marginTop: 24,
      fontWeight: '600',
      alignSelf: 'flex-end',
    },
    bottomHint: {
      alignItems: 'center',
      paddingBottom: 20,
    },
    hintText: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.4)',
      marginTop: 4,
    },
  });
