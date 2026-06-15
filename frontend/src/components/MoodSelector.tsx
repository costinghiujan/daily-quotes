import React, { useContext, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

export interface MoodOption {
  emoji: string;
  label: string;
  query: string;
}

export const MOODS: MoodOption[] = [
  { emoji: '\u{1F614}', label: 'Sad', query: 'sadness grief loss' },
  { emoji: '\u{1F92F}', label: 'Stressed', query: 'stress anxiety peace calm' },
  { emoji: '\u{1F3AF}', label: 'Motivated', query: 'motivation ambition success' },
  { emoji: '\u{1F60A}', label: 'Happy', query: 'happiness joy gratitude' },
  { emoji: '\u{1F4AA}', label: 'Strong', query: 'strength resilience courage' },
];

interface MoodSelectorProps {
  selectedMood: string | null;
  onMoodSelect: (mood: MoodOption) => void;
}

export default function MoodSelector({
  selectedMood,
  onMoodSelect,
}: MoodSelectorProps) {
  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textDark }]}>How are you feeling?</Text>
      <View style={styles.grid}>
        {MOODS.map((mood) => {
          const isSelected = selectedMood === mood.query;
          return (
            <TouchableOpacity
              key={mood.query}
              style={[
                styles.moodItem,
                {
                  backgroundColor: isSelected ? colors.primaryLight : colors.card,
                  borderColor: isSelected ? colors.primary : colors.cardBorder,
                },
              ]}
              onPress={() => onMoodSelect(mood)}
              activeOpacity={0.7}
              accessibilityLabel={`Mood: ${mood.label}`}
              accessibilityRole="button"
            >
              <Text style={styles.moodEmoji}>{mood.emoji}</Text>
              <Text
                style={[
                  styles.moodLabel,
                  { color: isSelected ? colors.primary : colors.textLight },
                ]}
              >
                {mood.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 12,
      paddingHorizontal: 16,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
      gap: 8,
    },
    moodItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 10,
      borderWidth: 1,
      width: '31%',
      flexGrow: 1,
    },
    moodEmoji: {
      fontSize: 16,
      marginRight: 4,
    },
    moodLabel: {
      fontSize: 12,
      fontWeight: '600',
    },

  });
