import React, { useState, useCallback, useContext, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { friendshipService, BlockedUser } from '../api/friendshipService';
import { ThemeContext } from '../context/ThemeContext';
import { AlertContext } from '../context/AlertContext';
import { ThemeColors } from '../theme/colors';


export default function BlockedUsersScreen() {
  const { colors } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { showAlert } = useContext(AlertContext);
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();


  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBlockedUsers = async () => {
    setIsLoading(true);
    try {
      const data = await friendshipService.getBlockedUsers();
      setBlockedUsers(data);
    } catch (error) {
      console.error('[Eroare UI] Nu am putut încărca lista de blocați:', error);
      showAlert({ title: t('common.error'), message: t('blocked.errorLoad'), confirmText: t('common.ok'), hideCancel: true });
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBlockedUsers();
    }, []),
  );

  const handleUnblock = (userId: number, userName: string) => {
    showAlert({
      title: t('blocked.unblockUser'),
      message: t('blocked.unblockConfirm', { name: userName }),
      confirmText: t('blocked.unblock'),
      cancelText: t('common.cancel'),
      isDestructive: false,
      onConfirm: async () => {
        try {
          setBlockedUsers((prev) => prev.filter((user) => user.id !== userId));
          await friendshipService.unblockUser(userId);
        } catch (error) {
          console.error('[Eroare UI] Deblocare utilizator:', error);
          fetchBlockedUsers();
          showAlert({ title: t('common.error'), message: t('blocked.errorUnblock'), confirmText: t('common.ok'), hideCancel: true });
        }
      },
    });
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => {
    const displayName = item.full_name || item.username;
    const blockedDate = new Date(item.blocked_at).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          {item.profile_picture_url ? (
            <Image source={{ uri: item.profile_picture_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-outline" size={20} color={colors.white} />
            </View>
          )}
          <View style={styles.textContainer}>
            <Text style={styles.nameText} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.dateText}>{t('blocked.blockedOn')}: {blockedDate}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.unblockBtn}
          onPress={() => handleUnblock(item.id, displayName)}
        >
          <Text style={styles.unblockBtnText}>{t('blocked.unblock')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading && blockedUsers.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={blockedUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBlockedUser}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-checkmark-outline" size={64} color={colors.success} />
            <Text style={styles.emptyText}>{t('blocked.emptyTitle')}</Text>
            <Text style={styles.emptySubText}>
              {t('blocked.emptySub')}
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


    userCard: {
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
    userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
    avatar: { width: 46, height: 46, borderRadius: 23, marginRight: 12, opacity: 0.8 },
    avatarPlaceholder: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.textLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    textContainer: { flex: 1, justifyContent: 'center' },
    nameText: { fontSize: 16, fontWeight: 'bold', color: colors.textDark, marginBottom: 2 },
    dateText: { fontSize: 12, color: colors.textLight },

    unblockBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.primary + '20',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    unblockBtnText: { color: colors.primary, fontSize: 13, fontWeight: 'bold' },

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
