import React, { useState, useEffect, useCallback, useContext, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
  Animated,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { quoteService } from '../api/quoteService';
import { userService } from '../api/userService';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { AlertContext } from '../context/AlertContext';
import { useTranslation } from 'react-i18next';
import { FeedQuote, REACTIONS_CONFIG, ReactionConfig } from '../types/FeedQuote';
import { ThemeColors } from '../theme/colors';
import { HomeFeedSkeleton } from '../components/SkeletonLoader';
import MoodSelector from '../components/MoodSelector';

interface AnimatedReactionButtonProps {
  reaction: ReactionConfig;
  count: number;
  isSelected: boolean;
  onPress: () => void;
  colors: ThemeColors;
  btnStyles: ReturnType<typeof getStyles>;
}

interface Particle {
  angle: number;
  color: string;
}

const PARTICLES: Particle[] = [
  { angle: 0, color: '#FFD700' },
  { angle: 72, color: '#FF6B6B' },
  { angle: 144, color: '#4ECDC4' },
  { angle: 216, color: '#FF9F1C' },
  { angle: 288, color: '#C7F464' },
];

const AnimatedReactionButton = ({ reaction, count, isSelected, onPress, colors, btnStyles }: AnimatedReactionButtonProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const burstAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.8,
      speed: 20,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      speed: 20,
      bounciness: 12,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!isSelected) {
      burstAnim.setValue(0);
      Animated.timing(burstAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
    onPress();
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {PARTICLES.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
        const translateX = burstAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(rad) * 35],
        });
        const translateY = burstAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(rad) * 35],
        });
        const opacity = burstAnim.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [1, 1, 0],
        });
        const scale = burstAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.1, 1, 0],
        });

        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateX }, { translateY }, { scale }],
            }}
          />
        );
      })}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            btnStyles.reactionBtn,
            { backgroundColor: colors.reactionBg, borderColor: colors.reactionButtonBorder },
            isSelected && {
              backgroundColor: colors.reactionActiveBg,
              borderColor: colors.primary,
            },
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          <Animated.Text style={[btnStyles.emojiText, isSelected && { transform: [{ scale: pulseAnim }] }]}>
            {reaction.emoji}
          </Animated.Text>
          {count > 0 && (
            <Text
              style={[
                btnStyles.reactionCount,
                { color: colors.textLight },
                isSelected && { color: colors.primary },
              ]}
            >
              {count}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

interface HomeScreenNavigationProp {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
  setOptions: (options: Record<string, unknown>) => void;
}

export default function HomeScreen({ navigation }: { navigation: HomeScreenNavigationProp }) {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();

  const [feedQuotes, setFeedQuotes] = useState<FeedQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [newText, setNewText] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  // Feature D: Daily Login Streak state
  const [dailyStreak, setDailyStreak] = useState<number>(0);
  const [streakLoaded, setStreakLoaded] = useState(false);

  const { colors } = useContext(ThemeContext);
  const { showAlert } = useContext(AlertContext);
  const { t } = useTranslation();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const data = await quoteService.getFeed();
      setFeedQuotes(data);
    } catch (error) {
      console.error('Eroare la incarcarea feed-ului:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  // Feature D: Track daily login on mount and fetch streak info
  useEffect(() => {
    const trackLogin = async () => {
      try {
        const streakData = await userService.trackDailyLogin();
        setDailyStreak(streakData.daily_streak);
      } catch {
        // If tracking fails (e.g. already tracked today), just fetch current streak
        try {
          const streakInfo = await userService.getStreakInfo();
          setDailyStreak(streakInfo.daily_streak);
        } catch {
          // Silently fail
        }
      } finally {
        setStreakLoaded(true);
      }
    };
    trackLogin();
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await quoteService.getFeed();
      setFeedQuotes(data);
    } catch (error) {
      console.error('Eroare la reinprospatare:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleAddQuote = async () => {
    if (!newText.trim() || !newAuthor.trim()) {
      showAlert({ title: t('common.error'), message: t('home.fillFields'), hideCancel: true, confirmText: t('common.ok') });
      return;
    }

    Keyboard.dismiss();

    setIsSubmitting(true);
    try {
      await quoteService.create({ text: newText, author: newAuthor, category: 'General' });
      setNewText('');
      setNewAuthor('');
      onRefresh();
    } catch (error) {
      console.error(error);
      showAlert({ title: t('common.error'), message: t('home.postError'), hideCancel: true, confirmText: t('common.ok') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleReaction = useCallback(async (quoteId: number, reactionKey: string) => {
    setFeedQuotes((prevQuotes) =>
      prevQuotes.map((quote) => {
        if (quote.id !== quoteId) return quote;
        const updatedQuote = { ...quote };
        const currentReactions = Array.isArray(updatedQuote.user_reactions) ? updatedQuote.user_reactions : [];
        const targetProp = (reactionKey.toLowerCase() + '_count') as keyof FeedQuote;
        const hasReacted = currentReactions.includes(reactionKey);

        if (hasReacted) {
          updatedQuote[targetProp] = Math.max(0, (updatedQuote[targetProp] as number || 0) - 1) as never;
          updatedQuote.user_reactions = currentReactions.filter((key: string) => key !== reactionKey);
        } else {
          updatedQuote[targetProp] = ((updatedQuote[targetProp] as number || 0) + 1) as never;
          updatedQuote.user_reactions = [...currentReactions, reactionKey];
        }
        return updatedQuote;
      }),
    );
    try {
      await quoteService.toggleReaction(quoteId, reactionKey);
    } catch (error) {
      console.error('A aparut o eroare de retea la salvarea reactiei.', error);
    }
  }, []);

  const renderFeedItem = useCallback(({ item }: { item: FeedQuote }) => {
    const hasAnyReaction = REACTIONS_CONFIG.some(r => (item[r.prop] || 0) > 0);
    const totalReactions = REACTIONS_CONFIG.reduce((acc, r) => acc + (item[r.prop] || 0), 0);

    return (
      <View style={[styles.feedItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ProfileScreen', { userId: item.user_id })}
          >
            {item.profile_picture_url ? (
              <Image source={{ uri: item.profile_picture_url }} style={styles.avatarSmall} />
            ) : (
              <Image source={require('../../assets/user-default.jpg')} style={styles.avatarSmall} />
            )}
          </TouchableOpacity>
          <View style={styles.postHeaderInfo}>
            <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen', { userId: item.user_id })}>
              <Text style={[styles.postUserName, { color: colors.textDark }]}>
                {item.full_name || item.username || 'User'}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.postSubText, { color: colors.timestampColor }]}>
              {item.created_at ? new Date(item.created_at).toLocaleDateString() : t('home.justNow')}
            </Text>
          </View>
          <TouchableOpacity style={[styles.moreBtn, { backgroundColor: colors.iconBg }]}>
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.iconColor} />
          </TouchableOpacity>
        </View>

        {/* Quote Text */}
        <View style={styles.quoteContent}>
          <Text style={[styles.quoteMark, { color: colors.primaryLight }]}>{'\u201C'}</Text>
          <Text style={[styles.postText, { color: colors.textPrimary }]}>
            {item.text}
          </Text>
          <Text style={[styles.authorText, { color: colors.textLight }]}>— {item.author}</Text>
        </View>

        {/* Reactions Summary */}
        <View style={[styles.likesRow, { borderTopColor: colors.separatorColor }]}>
          <View style={styles.reactionsStack}>
            {hasAnyReaction ? REACTIONS_CONFIG.map((r, i) => {
              if ((item[r.prop] || 0) > 0 && i < 3) {
                 return (
                   <View key={r.key} style={[styles.reactionCircle, { backgroundColor: colors.reactionEmojiBg, borderColor: colors.reactionEmojiBorder, zIndex: 3 - i, marginLeft: i > 0 ? -6 : 0 }]}>
                     <Text style={{ fontSize: 10 }}>{r.emoji}</Text>
                   </View>
                 );
              }
              return null;
            }) : (
              <View style={[styles.reactionCircle, { backgroundColor: colors.primary, borderColor: colors.card, zIndex: 3 }]}>
                <Ionicons name="heart" size={10} color="#fff" />
              </View>
            )}
          </View>
          <Text style={[styles.likesText, { color: colors.textLight }]}>
            {totalReactions > 0 ? `${totalReactions} ${t('home.reactions')}` : t('home.noReactions')}
          </Text>
        </View>

        {/* Reaction Buttons */}
        <View style={[styles.reactionsBar, { borderTopColor: colors.separatorColor }]}>
          <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
            {REACTIONS_CONFIG.map((reaction) => {
               const count = item[reaction.prop] || 0;
               const isSelected = Array.isArray(item.user_reactions) && item.user_reactions.includes(reaction.key);
               return (
                 <AnimatedReactionButton
                   key={reaction.key}
                   reaction={reaction}
                   count={count}
                   isSelected={isSelected}
                   onPress={() => handleToggleReaction(item.id, reaction.key)}
                   colors={colors}
                   btnStyles={styles}
                 />
               );
            })}
          </View>
          <TouchableOpacity
            style={[styles.commentIconBtn, { backgroundColor: colors.iconBg }]}
            onPress={() => navigation.navigate('Comments', { quoteId: item.id })}
          >
            <Ionicons name="chatbubble-outline" size={20} color={colors.iconColor} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [colors, styles, navigation, handleToggleReaction, t]);

  const renderHeader = useCallback(() => (
    <View style={styles.headerContainer}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.separatorColor }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LinearGradient
            colors={colors.primaryGradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoIcon}
          >
            <Ionicons name="book" size={18} color="#fff" />
          </LinearGradient>
          <Text style={[styles.logoText, { color: colors.textDark }]}>{t('home.title')}</Text>
        </View>
      </View>

      {/* Feature D: Daily Login Streak Banner */}
      {streakLoaded && (
        <LinearGradient
          colors={['#FF6B35', '#F7C59F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.streakBanner}
        >
          <Ionicons name="flame" size={22} color="#fff" />
          <Text style={styles.streakText}>
            {dailyStreak > 0
              ? `${dailyStreak} ${t('home.dayStreak')}`
              : t('home.startStreak')}
          </Text>
          <Ionicons name="trending-up" size={18} color="#fff" style={{ opacity: 0.8 }} />
        </LinearGradient>
      )}

      {/* Create Post Card */}
      <LinearGradient
        colors={colors.primaryGradientSubtle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.createPostCard, { borderColor: colors.cardBorder }]}
      >
        <View style={styles.createPostTop}>
          {user?.profile_picture_url ? (
            <Image source={{ uri: user.profile_picture_url }} style={styles.myAvatar} />
          ) : (
            <Image source={require('../../assets/user-default.jpg')} style={styles.myAvatar} />
          )}
          <View style={[styles.mindInputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
            <TextInput
              style={[styles.mindInput, { color: colors.textDark }]}
              placeholder={t('home.whatsOnYourMind')}
              placeholderTextColor={colors.textMuted}
              value={newText}
              onChangeText={setNewText}
              multiline
            />
          </View>
        </View>
        <View style={[styles.authorInputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
          <TextInput
            style={[styles.authorInput, { color: colors.textDark }]}
            placeholder={t('home.authorPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={newAuthor}
            onChangeText={setNewAuthor}
          />
        </View>

        {(newText.length > 0 || newAuthor.length > 0) && (
          <TouchableOpacity
            style={styles.postSubmitBtn}
            onPress={handleAddQuote}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={colors.buttonPrimaryBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.postSubmitGradient}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.buttonPrimaryText} size="small" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="paper-plane" size={16} color={colors.buttonPrimaryText} style={{ marginRight: 8 }} />
                  <Text style={[styles.postSubmitText, { color: colors.buttonPrimaryText }]}>{t('home.post')}</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>

      <MoodSelector
        selectedMood={selectedMood}
        onMoodSelect={(mood) => {
          setSelectedMood(mood.query);
          navigation.navigate('ZenQuote', { mood: mood.query });
        }}
      />

      <Text style={[styles.recentTitle, { color: colors.textDark }]}>{t('home.recent')}</Text>
    </View>
  ), [colors, styles, user, newText, newAuthor, isSubmitting, handleAddQuote, t, selectedMood, navigation]);

  if (isLoading && feedQuotes.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <HomeFeedSkeleton colors={{ skeleton: colors.skeleton, shimmer: colors.shimmer }} count={3} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <FlatList
        data={feedQuotes}
        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
        renderItem={renderFeedItem}
        ListHeaderComponent={renderHeader()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40, paddingHorizontal: 20 }}>
            <Ionicons name="people-outline" size={64} color={colors.textLight} />
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.textDark, marginTop: 15 }}>{t('home.emptyFeed')}</Text>
            <Text style={{ fontSize: 15, color: colors.textLight, textAlign: 'center', marginTop: 10 }}>{t('home.emptyFeedHint')}</Text>
          </View>
        }
      />
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 15,
    marginBottom: 20,
    borderBottomWidth: 1,
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileBtnAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  streakText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  createPostCard: {
    marginBottom: 25,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  createPostTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  myAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  myAvatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mindInputWrapper: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 42,
  },
  mindInput: {
    fontSize: 15,
    lineHeight: 20,
  },
  authorInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  authorInput: {
    flex: 1,
    fontSize: 14,
  },
  postSubmitBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  postSubmitGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  postSubmitText: {
    fontWeight: '700',
    fontSize: 15,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 15,
  },
  feedItem: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  postHeaderInfo: {
    flex: 1,
  },
  postUserName: {
    fontSize: 15,
    fontWeight: '700',
  },
  postSubText: {
    fontSize: 12,
    marginTop: 2,
  },
  moreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteContent: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  quoteMark: {
    fontSize: 32,
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: -4,
  },
  postText: {
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  authorText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'right',
  },
  likesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    marginBottom: 10,
    borderTopWidth: 1,
  },
  reactionsStack: {
    flexDirection: 'row',
    marginRight: 8,
  },
  reactionCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likesText: {
    fontSize: 13,
    fontWeight: '500',
  },
  reactionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  reactionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 4,
  },
  emojiText: { fontSize: 14 },
  reactionCount: { fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  commentIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
