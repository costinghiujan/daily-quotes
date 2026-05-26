import React, { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ZenQuoteCard from '../components/ZenQuoteCard';
import { AudioService } from '../services/AudioService';
import { quoteService } from '../api/quoteService';
import { moodService } from '../api/moodService';
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

export default function ZenQuoteScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ZenQuoteParams, 'ZenQuote'>>();
  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [quote, setQuote] = useState<{ text: string; author: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

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
            setQuote({ text: found.text, author: found.author });
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
            setQuote({ text: moodQuote.text, author: moodQuote.author });
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
    <ZenQuoteCard
      text={quote.text}
      author={quote.author}
      onClose={handleClose}
      isMuted={isMuted}
      onToggleMute={handleToggleMute}
    />
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    },
  });
