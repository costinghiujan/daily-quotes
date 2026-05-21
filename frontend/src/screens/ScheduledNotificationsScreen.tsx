import React, { useState, useCallback, useContext, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
  Switch,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { scheduledNotificationService, ScheduledNotification } from '../api/scheduledNotificationService';
import { ThemeContext } from '../context/ThemeContext';
import { AlertContext } from '../context/AlertContext';
import { ThemeColors } from '../theme/colors';

const EMOTIONS = [
  { key: 'motivational', icon: 'flame', color: '#FF6B35' },
  { key: 'inspirational', icon: 'bulb', color: '#FFD700' },
  { key: 'funny', icon: 'happy', color: '#FF69B4' },
  { key: 'philosophical', icon: 'school', color: '#9B59B6' },
  { key: 'romantic', icon: 'heart', color: '#E74C3C' },
  { key: 'sad', icon: 'sad', color: '#5DADE2' },
  { key: 'calm', icon: 'leaf', color: '#2ECC71' },
  { key: 'energetic', icon: 'flash', color: '#F39C12' },
];

export default function ScheduledNotificationsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { colors } = useContext(ThemeContext);
  const { showAlert } = useContext(AlertContext);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState<ScheduledNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalVisible, setAddModalVisible] = useState(false);

  // Add form state
  const [selectedHour, setSelectedHour] = useState(7);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedEmotion, setSelectedEmotion] = useState('motivational');
  const [isSaving, setIsSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await scheduledNotificationService.getAll();
      setNotifications(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications]),
  );

  const handleAdd = async () => {
    setIsSaving(true);
    try {
      const newItem = await scheduledNotificationService.create({
        hour: selectedHour,
        minute: selectedMinute,
        emotion: selectedEmotion,
      });
      setNotifications((prev) => [...prev, newItem].sort((a, b) => a.hour - b.hour || a.minute - b.minute));
      setAddModalVisible(false);
      resetForm();
    } catch (error) {
      showAlert({
        title: t('common.error'),
        message: t('scheduledNotifications.saveError'),
        hideCancel: true,
        confirmText: t('common.ok'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (item: ScheduledNotification) => {
    try {
      const updated = await scheduledNotificationService.update(item.id, {
        is_active: !item.is_active,
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_active: updated.is_active } : n)),
      );
    } catch (error) {
      showAlert({
        title: t('common.error'),
        message: t('scheduledNotifications.saveError'),
        hideCancel: true,
        confirmText: t('common.ok'),
      });
    }
  };

  const handleDelete = (item: ScheduledNotification) => {
    showAlert({
      title: t('scheduledNotifications.deleteTitle'),
      message: t('scheduledNotifications.deleteConfirm'),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      isDestructive: true,
      onConfirm: async () => {
        try {
          await scheduledNotificationService.delete(item.id);
          setNotifications((prev) => prev.filter((n) => n.id !== item.id));
        } catch (error) {
          showAlert({
            title: t('common.error'),
            message: t('scheduledNotifications.deleteError'),
            hideCancel: true,
            confirmText: t('common.ok'),
          });
        }
      },
    });
  };

  const resetForm = () => {
    setSelectedHour(7);
    setSelectedMinute(0);
    setSelectedEmotion('motivational');
  };

  const formatTime = (hour: number, minute: number) => {
    const h = hour.toString().padStart(2, '0');
    const m = minute.toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const getEmotionData = (emotion: string) => {
    return EMOTIONS.find((e) => e.key === emotion) || EMOTIONS[0];
  };

  const getEmotionLabel = (emotion: string) => {
    return t(`scheduledNotifications.emotions.${emotion}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.topBar, { borderBottomColor: colors.separatorColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LinearGradient
            colors={colors.primaryGradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoIcon}
          >
            <Ionicons name="alarm" size={18} color="#fff" />
          </LinearGradient>
          <Text style={[styles.logoText, { color: colors.textDark }]}>
            {t('scheduledNotifications.title')}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setAddModalVisible(true)} style={styles.addButton}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alarm-outline" size={64} color={colors.textLight} />
          <Text style={[styles.emptyTitle, { color: colors.textDark }]}>
            {t('scheduledNotifications.emptyTitle')}
          </Text>
          <Text style={[styles.emptySub, { color: colors.textLight }]}>
            {t('scheduledNotifications.emptySub')}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {notifications.map((item) => {
            const emotionData = getEmotionData(item.emotion);
            return (
              <View key={item.id} style={[styles.notificationCard, { borderColor: colors.border }]}>
                <View style={styles.cardLeft}>
                  <View
                    style={[styles.emotionIconContainer, { backgroundColor: emotionData.color + '20' }]}
                  >
                    <Ionicons
                      name={emotionData.icon as any}
                      size={22}
                      color={emotionData.color}
                    />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardTime, { color: colors.textDark }]}>
                      {formatTime(item.hour, item.minute)}
                    </Text>
                    <Text style={[styles.cardEmotion, { color: colors.textLight }]}>
                      {getEmotionLabel(item.emotion)}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Switch
                    trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                    thumbColor={item.is_active ? colors.primary : colors.gray}
                    onValueChange={() => handleToggle(item)}
                    value={item.is_active}
                  />
                  <TouchableOpacity
                    onPress={() => handleDelete(item)}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Add Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textDark }]}>
                {t('scheduledNotifications.addTitle')}
              </Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Hour Picker */}
              <Text style={[styles.pickerLabel, { color: colors.textDark }]}>
                {t('scheduledNotifications.hour')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.pickerItem,
                      selectedHour === h && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedHour(h)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        { color: selectedHour === h ? '#fff' : colors.textDark },
                      ]}
                    >
                      {h.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Minute Picker */}
              <Text style={[styles.pickerLabel, { color: colors.textDark }]}>
                {t('scheduledNotifications.minute')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.pickerItem,
                      selectedMinute === m && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedMinute(m)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        { color: selectedMinute === m ? '#fff' : colors.textDark },
                      ]}
                    >
                      {m.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Emotion Picker */}
              <Text style={[styles.pickerLabel, { color: colors.textDark }]}>
                {t('scheduledNotifications.emotion')}
              </Text>
              <View style={styles.emotionGrid}>
                {EMOTIONS.map((emotion) => (
                  <TouchableOpacity
                    key={emotion.key}
                    style={[
                      styles.emotionItem,
                      selectedEmotion === emotion.key && {
                        borderColor: emotion.color,
                        backgroundColor: emotion.color + '20',
                      },
                    ]}
                    onPress={() => setSelectedEmotion(emotion.key)}
                  >
                    <Ionicons name={emotion.icon as any} size={24} color={emotion.color} />
                    <Text style={[styles.emotionLabel, { color: colors.textDark }]}>
                      {getEmotionLabel(emotion.key)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleAdd}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 15,
      paddingTop: 10,
      paddingBottom: 15,
      borderBottomWidth: 1,
    },
    backButton: {
      padding: 5,
    },
    addButton: {
      padding: 5,
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
      fontSize: 20,
      fontWeight: '800',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 16,
    },
    emptySub: {
      fontSize: 14,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
    },
    listContainer: {
      padding: 15,
      paddingBottom: 40,
    },
    notificationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 15,
      marginBottom: 10,
      borderWidth: 1,
    },
    cardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    emotionIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    cardInfo: {
      flex: 1,
    },
    cardTime: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    cardEmotion: {
      fontSize: 13,
      marginTop: 2,
    },
    cardRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    deleteBtn: {
      padding: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '85%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 15,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    pickerLabel: {
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 10,
      marginTop: 5,
    },
    pickerScroll: {
      marginBottom: 15,
    },
    pickerItem: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
    },
    pickerItemText: {
      fontSize: 16,
      fontWeight: '600',
    },
    emotionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    emotionItem: {
      width: '23%',
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emotionLabel: {
      fontSize: 11,
      marginTop: 4,
      textAlign: 'center',
    },
    saveButton: {
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 20,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
