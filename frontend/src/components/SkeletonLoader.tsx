import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Shimmer Effect ───────────────────────────────────────────────────────────

const Shimmer = ({ colors }: { colors: { skeleton: string; shimmer: string } }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { opacity, backgroundColor: colors.shimmer },
      ]}
    />
  );
};

// ─── Skeleton Block ───────────────────────────────────────────────────────────

interface SkeletonBlockProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
  colors: { skeleton: string; shimmer: string };
}

const SkeletonBlock = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
  colors,
}: SkeletonBlockProps) => (
  <View
    style={[
      {
        width: width as any,
        height,
        borderRadius,
        backgroundColor: colors.skeleton,
        overflow: 'hidden',
        position: 'relative',
      },
      style,
    ]}
  >
    <Shimmer colors={colors} />
  </View>
);

// ─── Circle Skeleton ──────────────────────────────────────────────────────────

interface SkeletonCircleProps {
  size?: number;
  style?: object;
  colors: { skeleton: string; shimmer: string };
}

const SkeletonCircle = ({ size = 40, style, colors }: SkeletonCircleProps) => (
  <SkeletonBlock
    width={size}
    height={size}
    borderRadius={size / 2}
    style={style}
    colors={colors}
  />
);

// ─── Feed Quote Skeleton ──────────────────────────────────────────────────────

interface FeedQuoteSkeletonProps {
  colors: { skeleton: string; shimmer: string };
}

export const FeedQuoteSkeleton = ({ colors }: FeedQuoteSkeletonProps) => (
  <View style={styles.feedCard}>
    {/* Header */}
    <View style={styles.feedHeader}>
      <SkeletonCircle size={40} colors={colors} />
      <View style={styles.feedHeaderText}>
        <SkeletonBlock width={140} height={14} colors={colors} />
        <SkeletonBlock width={80} height={10} colors={colors} style={{ marginTop: 6 }} />
      </View>
    </View>
    {/* Quote Content */}
    <View style={styles.quoteContent}>
      <SkeletonBlock width={SCREEN_WIDTH - 80} height={16} colors={colors} />
      <SkeletonBlock width={SCREEN_WIDTH - 120} height={16} colors={colors} style={{ marginTop: 8 }} />
      <SkeletonBlock width={100} height={14} colors={colors} style={{ marginTop: 12, alignSelf: 'flex-end' }} />
    </View>
    {/* Reactions Bar */}
    <View style={styles.reactionsBar}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <SkeletonBlock width={50} height={28} borderRadius={14} colors={colors} />
        <SkeletonBlock width={50} height={28} borderRadius={14} colors={colors} />
        <SkeletonBlock width={50} height={28} borderRadius={14} colors={colors} />
      </View>
      <SkeletonCircle size={32} colors={colors} />
    </View>
  </View>
);

// ─── Quote of the Day Skeleton ────────────────────────────────────────────────

interface QuoteOfTheDaySkeletonProps {
  colors: { skeleton: string; shimmer: string };
}

export const QuoteOfTheDaySkeleton = ({ colors }: QuoteOfTheDaySkeletonProps) => (
  <View style={styles.hofCard}>
    <View style={styles.hofHeader}>
      <SkeletonBlock width={20} height={20} borderRadius={10} colors={colors} />
      <SkeletonBlock width={160} height={16} colors={colors} />
      <SkeletonBlock width={20} height={20} borderRadius={10} colors={colors} />
    </View>
    <View style={styles.hofContent}>
      <SkeletonBlock width={SCREEN_WIDTH - 100} height={18} colors={colors} />
      <SkeletonBlock width={SCREEN_WIDTH - 140} height={18} colors={colors} style={{ marginTop: 10 }} />
      <SkeletonBlock width={120} height={14} colors={colors} style={{ marginTop: 16, alignSelf: 'flex-end' }} />
    </View>
    <View style={styles.hofFooter}>
      <SkeletonBlock width={120} height={12} colors={colors} />
      <SkeletonBlock width={80} height={22} borderRadius={11} colors={colors} />
    </View>
  </View>
);

// ─── Profile Skeleton ─────────────────────────────────────────────────────────

interface ProfileSkeletonProps {
  colors: { skeleton: string; shimmer: string };
}

export const ProfileSkeleton = ({ colors }: ProfileSkeletonProps) => (
  <View>
    {/* Cover Photo */}
    <SkeletonBlock width="100%" height={280} borderRadius={0} colors={colors} />
    {/* Profile Card */}
    <View style={styles.profileCard}>
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        <SkeletonCircle size={90} colors={colors} />
      </View>
      {/* Name */}
      <SkeletonBlock width={180} height={24} colors={colors} style={{ alignSelf: 'center', marginBottom: 8 }} />
      {/* Level Badge */}
      <SkeletonBlock width={80} height={22} borderRadius={11} colors={colors} style={{ alignSelf: 'center', marginBottom: 12 }} />
      {/* Bio */}
      <SkeletonBlock width={SCREEN_WIDTH - 80} height={14} colors={colors} style={{ alignSelf: 'center', marginBottom: 4 }} />
      <SkeletonBlock width={SCREEN_WIDTH - 120} height={14} colors={colors} style={{ alignSelf: 'center', marginBottom: 20 }} />
      {/* XP Bar */}
      <SkeletonBlock width="100%" height={60} borderRadius={12} colors={colors} style={{ marginBottom: 20 }} />
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <SkeletonBlock width={(SCREEN_WIDTH - 80) / 3} height={50} borderRadius={12} colors={colors} />
        <SkeletonBlock width={(SCREEN_WIDTH - 80) / 3} height={50} borderRadius={12} colors={colors} />
        <SkeletonBlock width={(SCREEN_WIDTH - 80) / 3} height={50} borderRadius={12} colors={colors} />
      </View>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        <SkeletonBlock width={(SCREEN_WIDTH - 80) / 3} height={32} borderRadius={8} colors={colors} />
        <SkeletonBlock width={(SCREEN_WIDTH - 80) / 3} height={32} borderRadius={8} colors={colors} />
        <SkeletonBlock width={(SCREEN_WIDTH - 80) / 3} height={32} borderRadius={8} colors={colors} />
      </View>
      {/* Post Skeleton */}
      <View style={{ marginTop: 20 }}>
        <FeedQuoteSkeleton colors={colors} />
      </View>
    </View>
  </View>
);

// ─── Home Feed Skeleton (multiple items) ──────────────────────────────────────

interface HomeFeedSkeletonProps {
  colors: { skeleton: string; shimmer: string };
  count?: number;
}

export const HomeFeedSkeleton = ({ colors, count = 3 }: HomeFeedSkeletonProps) => (
  <View style={styles.homeSkeletonContainer}>
    {/* Create Post Card Skeleton */}
    <View style={styles.createPostCard}>
      <View style={styles.createPostTop}>
        <SkeletonCircle size={42} colors={colors} />
        <SkeletonBlock width={SCREEN_WIDTH - 100} height={42} borderRadius={12} colors={colors} />
      </View>
      <SkeletonBlock width={SCREEN_WIDTH - 64} height={42} borderRadius={10} colors={colors} style={{ marginBottom: 12 }} />
      <SkeletonBlock width="100%" height={44} borderRadius={12} colors={colors} />
    </View>
    {/* Recent Title */}
    <SkeletonBlock width={100} height={20} colors={colors} style={{ marginBottom: 16, marginLeft: 16 }} />
    {/* Feed Items */}
    {Array.from({ length: count }).map((_, i) => (
      <FeedQuoteSkeleton key={i} colors={colors} />
    ))}
  </View>
);

// ─── Explore Feed Skeleton ────────────────────────────────────────────────────

interface ExploreFeedSkeletonProps {
  colors: { skeleton: string; shimmer: string };
  count?: number;
}

export const ExploreFeedSkeleton = ({ colors, count = 3 }: ExploreFeedSkeletonProps) => (
  <View style={styles.homeSkeletonContainer}>
    {/* Quote of the Day Skeleton */}
    <QuoteOfTheDaySkeleton colors={colors} />
    {/* Feed Items */}
    {Array.from({ length: count }).map((_, i) => (
      <FeedQuoteSkeleton key={i} colors={colors} />
    ))}
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  homeSkeletonContainer: {
    paddingTop: 10,
  },
  feedCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'transparent',
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  quoteContent: {
    marginBottom: 12,
    paddingLeft: 8,
  },
  reactionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 0,
  },
  hofCard: {
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    backgroundColor: 'transparent',
  },
  hofHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 10,
  },
  hofContent: {
    marginBottom: 16,
  },
  hofFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 0,
  },
  profileCard: {
    marginTop: -40,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: 'transparent',
  },
  avatarWrapper: {
    alignItems: 'center',
    marginTop: -45,
    marginBottom: 16,
    alignSelf: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  createPostCard: {
    marginHorizontal: 16,
    marginBottom: 25,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  createPostTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
});
