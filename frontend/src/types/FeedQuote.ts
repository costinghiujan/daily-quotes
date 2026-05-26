export interface FeedQuote {
  id: number;
  text: string;
  author: string;
  created_at: string;
  user_id: number;
  post_user_id: number;
  username: string;
  full_name: string | null;
  profile_picture_url: string | null;
  blue_heart_count: number;
  applause_count: number;
  sad_count: number;
  touching_count: number;
  hug_count: number;
  mind_blown_count: number;
  user_reactions: string[];
  total_reactions?: number;
  recommendation_score?: number;
}

export interface ReactionConfig {
  key: string;
  emoji: string;
  prop: keyof Pick<FeedQuote, 'blue_heart_count' | 'applause_count' | 'sad_count' | 'touching_count' | 'hug_count' | 'mind_blown_count'>;
}

export const REACTIONS_CONFIG: ReactionConfig[] = [
  { key: 'BLUE_HEART', emoji: '\u{1F499}', prop: 'blue_heart_count' },
  { key: 'APPLAUSE', emoji: '\u{1F44F}', prop: 'applause_count' },
  { key: 'SAD', emoji: '\u{1F622}', prop: 'sad_count' },
  { key: 'TOUCHING', emoji: '\u{1F97A}', prop: 'touching_count' },
  { key: 'HUG', emoji: '\u{1FAC2}', prop: 'hug_count' },
  { key: 'MIND_BLOWN', emoji: '\u{1F92F}', prop: 'mind_blown_count' },
];
