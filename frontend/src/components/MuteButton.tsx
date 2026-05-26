import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MuteButtonProps {
  isMuted: boolean;
  onToggle: () => void;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export default function MuteButton({
  isMuted,
  onToggle,
  size = 24,
  color = '#8E8EA0',
  style,
}: MuteButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onToggle}
      activeOpacity={0.7}
      accessibilityLabel={isMuted ? 'Unmute audio' : 'Mute audio'}
      accessibilityRole="button"
    >
      <Ionicons
        name={isMuted ? 'volume-mute-outline' : 'volume-high-outline'}
        size={size}
        color={color}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
