import React, { useState, useCallback, useContext, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { friendshipService, Friend } from '../api/friendshipService';
import { ThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

export default function FriendsScreen() {
  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFriends = async () => {
    setIsLoading(true);
    try {
      const data = await friendshipService.getFriends();
      setFriends(data);
    } catch (error) {
      console.error('[Eroare UI] Nu am putut încărca prietenii:', error);
      Alert.alert('Eroare', 'Nu am putut încărca lista de prieteni.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFriends();
    }, []),
  );

  const handleUnfriend = (friendshipId: number, friendName: string) => {
    Alert.alert(
      'Șterge Prieten',
      `Ești sigur că vrei să îl ștergi pe ${friendName} din lista ta de prieteni?`,
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Șterge',
          style: 'destructive',
          onPress: async () => {
            try {
              setFriends((prev) => prev.filter((f) => f.friendship_id !== friendshipId));
              await friendshipService.removeFriendOrRequest(friendshipId);
            } catch (error) {
              console.error('[Eroare UI] Ștergere prieten:', error);
              fetchFriends();
              Alert.alert('Eroare', 'Nu s-a putut șterge prietenul.');
            }
          },
        },
      ],
    );
  };

  const handleBlock = (userId: number, friendName: string) => {
    Alert.alert(
      'Blochează Utilizator',
      `Ești sigur că vrei să îl blochezi pe ${friendName}? Nu îți va mai putea vedea profilul sau trimite mesaje.`,
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Blochează',
          style: 'destructive',
          onPress: async () => {
            try {
              setFriends((prev) => prev.filter((f) => f.id !== userId));
              await friendshipService.blockUser(userId);
            } catch (error) {
              console.error('[Eroare UI] Blocare utilizator:', error);
              fetchFriends();
              Alert.alert('Eroare', 'Nu s-a putut bloca utilizatorul.');
            }
          },
        },
      ],
    );
  };

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const displayName = item.full_name || item.username;

    return (
      <View style={styles.friendCard}>
        <View style={styles.friendInfo}>
          {item.profile_picture_url ? (
            <Image source={{ uri: item.profile_picture_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color={colors.white} />
            </View>
          )}
          <View style={styles.textContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText} numberOfLines={1}>
                {displayName}
              </Text>
              {/* NOU: AFISARE STREAK (FLACĂRĂ) */}
              {item.streak_count && item.streak_count > 0 ? (
                <View style={styles.streakBadge}>
                  <Text style={styles.streakText}>🔥 {item.streak_count}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.usernameText}>@{item.username}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.unfriendBtn}
            onPress={() => handleUnfriend(item.friendship_id, displayName)}
          >
            <Text style={styles.unfriendBtnText}>Șterge</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.blockBtn}
            onPress={() => handleBlock(item.id, displayName)}
          >
            <Ionicons name="ban" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading && friends.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 }}>
        <Ionicons name="book" size={28} color={colors.primary} style={{ marginRight: 10 }} />
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.textDark }}>DailyQuotes</Text>
      </View>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFriendItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.textLight} />
            <Text style={styles.emptyText}>Nu ai niciun prieten în listă.</Text>
            <Text style={styles.emptySubText}>
              Caută utilizatori noi în tab-ul de Căutare pentru a-ți mări comunitatea.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    listContent: { padding: 15, paddingBottom: 30 },

    friendCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      padding: 15,
      marginBottom: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    friendInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
    avatar: { width: 46, height: 46, borderRadius: 23, marginRight: 12 },
    avatarPlaceholder: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    textContainer: { flex: 1, justifyContent: 'center' },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    nameText: { fontSize: 16, fontWeight: 'bold', color: colors.textDark, flexShrink: 1 },

    streakBadge: {
      backgroundColor: 'rgba(255, 140, 0, 0.1)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: 6,
    },
    streakText: { fontSize: 12, fontWeight: 'bold', color: '#FF8C00' },

    usernameText: { fontSize: 13, color: colors.textLight },

    actionButtons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    unfriendBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    unfriendBtnText: { color: colors.textDark, fontSize: 13, fontWeight: 'bold' },

    blockBtn: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.error,
      justifyContent: 'center',
      alignItems: 'center',
    },

    emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 20 },
    emptyText: { marginTop: 15, fontSize: 18, fontWeight: 'bold', color: colors.textDark },
    emptySubText: {
      fontSize: 15,
      color: colors.textLight,
      textAlign: 'center',
      marginTop: 10,
      lineHeight: 22,
    },
  });
