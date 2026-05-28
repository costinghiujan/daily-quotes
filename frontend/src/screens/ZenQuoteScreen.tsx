import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import ZenQuoteCard from '../components/ZenQuoteCard';
import { AudioService } from '../services/AudioService';
import { quoteService } from '../api/quoteService';
import { moodService } from '../api/moodService';
import { userService } from '../api/userService';
import { ThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

type ZenQuoteParams = {
  ZenQuote: {
    quoteId?: number;
    mood?: string;
    quote?: {
      id: number;
      text: string;
      author: string;
    };
  };
};

const EMOTION_OPTIONS = [
  { label: 'Inspired', icon: 'bulb', value: 'inspired' },
  { label: 'Grateful', icon: 'heart', value: 'grateful' },
  { label: 'Hopeful', icon: 'sunny', value: 'hopeful' },
  { label: 'Peaceful', icon: 'leaf', value: 'peaceful' },
  { label: 'Thoughtful', icon: 'chatbubbles', value: 'thoughtful' },
  { label: 'Motivated', icon: 'rocket', value: 'motivated' },
];

export default function ZenQuoteScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ZenQuoteParams, 'ZenQuote'>>();
  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [quote, setQuote] = useState<{ id?: number; text: string; author: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [reflectionNote, setReflectionNote] = useState('');
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [reflectionSaved, setReflectionSaved] = useState(false);

  const audioService = AudioService.getInstance();

  useEffect(() => {
    const loadQuote = async () => {
      const { quoteId, quote: passedQuote, mood } = route.params || {};

      if (passedQuote) {
        setQuote(passedQuote);
        setIsLoading(false);
      } else if (quoteId) {
        try {
          const quotes = await quoteService.getAll();
          const found = quotes.find((q) => q.id === quoteId);
          if (found) {
            setQuote({ id: found.id, text: found.text, author: found.author });
          }
        } catch (error) {
          console.error('[ZenQuote] Failed to fetch quote:', error);
        } finally {
          setIsLoading(false);
        }
      } else if (mood) {
        try {
          const results = await moodService.searchByMood(mood);
          if (results.length > 0) {
            const randomIndex = Math.floor(Math.random() * results.length);
            const moodQuote = results[randomIndex];
            setQuote({ id: moodQuote.id, text: moodQuote.text, author: moodQuote.author });
          }
        } catch (error) {
          console.error('[ZenQuote] Failed to fetch mood quotes:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadQuote();
  }, [route.params]);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: 'none' },
    });
    return () => {
      navigation.setOptions({
        tabBarStyle: undefined,
      });
    };
  }, [navigation]);

  useEffect(() => {
    audioService.play('rain');
    return () => {
      audioService.stop();
    };
  }, [audioService]);

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      audioService.toggleMute();
      return !prev;
    });
  }, [audioService]);

  const handleSaveReflection = async () => {
    if (!quote?.id || !selectedEmotion) return;
    setIsSavingReflection(true);
    try {
      await userService.recordReflection(quote.id, selectedEmotion);
      setReflectionSaved(true);
    } catch (error) {
      console.error('[ZenQuote] Failed to save reflection:', error);
    } finally {
      setIsSavingReflection(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!quote) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ZenQuoteCard
        text={quote.text}
        author={quote.author}
        onClose={handleClose}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Reflection Section */}
      <View style={[styles.reflectionContainer, { paddingBottom: insets.bottom + 20 }]}>
        {!reflectionSaved ? (
          <>
            <TouchableOpacity
              style={[styles.reflectionToggle, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
              onPress={() => setShowReflection(!showReflection)}
            >
              <Ionicons
                name={showReflection ? 'chevron-down' : 'chatbubble-ellipses'}
                size={20}
                color="#fff"
              />
              <Text style={styles.reflectionToggleText}>
                {showReflection ? 'Hide Reflection' : 'Reflect on this quote'}
              </Text>
            </TouchableOpacity>

            {showReflection && (
              <View style={styles.reflectionContent}>
                <Text style={styles.reflectionTitle}>
                  How does this quote make you feel?
                </Text>
                <View style={styles.emotionGrid}>
                  {EMOTION_OPTIONS.map((emotion) => (
                    <TouchableOpacity
                      key={emotion.value}
                      style={[
                        styles.emotionChip,
                        selectedEmotion === emotion.value && styles.emotionChipSelected,
                      ]}
                      onPress={() => setSelectedEmotion(emotion.value)}
                    >
                      <Ionicons
                        name={emotion.icon as any}
                        size={18}
                        color={selectedEmotion === emotion.value ? '#000' : '#fff'}
                      />
                      <Text
                        style={[
                          styles.emotionLabel,
                          selectedEmotion === emotion.value && styles.emotionLabelSelected,
                        ]}
                      >
                        {emotion.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.reflectionInput}
                  placeholder="Add a personal note (optional)..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={reflectionNote}
                  onChangeText={setReflectionNote}
                  multiline
                  numberOfLines={2}
                />

                <TouchableOpacity
                  style={[
                    styles.saveReflectionBtn,
                    !selectedEmotion && styles.saveReflectionBtnDisabled,
                  ]}
                  onPress={handleSaveReflection}
                  disabled={!selectedEmotion || isSavingReflection}
                >
                  {isSavingReflection ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <>
                      <Ionicons name="bookmark" size={18} color="#000" />
                      <Text style={styles.saveReflectionText}>Save Reflection</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <View style={styles.reflectionSavedContainer}>
            <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
            <Text style={styles.reflectionSavedText}>
              Reflection saved! +5 XP
            </Text>
            <Text style={styles.reflectionSavedSubtext}>
              Tracking your emotional journey helps build self-awareness.
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    },
    reflectionContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
    },
    reflectionToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
      marginBottom: 10,
    },
    reflectionToggleText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    reflectionContent: {
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: 16,
    },
    reflectionTitle: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 12,
      textAlign: 'center',
    },
    emotionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'center',
      marginBottom: 12,
    },
    emotionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
      gap: 6,
    },
    emotionChipSelected: {
      backgroundColor: '#fff',
      borderColor: '#fff',
    },
    emotionLabel: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '500',
    },
    emotionLabelSelected: {
      color: '#000',
      fontWeight: '700',
    },
    reflectionInput: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 12,
      padding: 12,
      color: '#fff',
      fontSize: 14,
      marginBottom: 12,
      minHeight: 60,
      textAlignVertical: 'top',
    },
    saveReflectionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    saveReflectionBtnDisabled: {
      opacity: 0.5,
    },
    saveReflectionText: {
      color: '#000',
      fontSize: 15,
      fontWeight: '700',
    },
    reflectionSavedContainer: {
      alignItems: 'center',
      paddingVertical: 16,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: 16,
      gap: 8,
    },
    reflectionSavedText: {
      color: '#4CAF50',
      fontSize: 16,
      fontWeight: '700',
    },
    reflectionSavedSubtext: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 13,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
  });
