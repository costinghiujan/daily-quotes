import React, { useState, useEffect, useContext, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

import { sessionService, Session } from '../api/sessionService';
import { notificationService, NotificationSettings } from '../api/notificationService';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { AlertContext } from '../context/AlertContext';
import { ThemeColors } from '../theme/colors';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const { logout } = useContext(AuthContext);
  const { showAlert } = useContext(AlertContext);
  const { colors, theme, setTheme } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const [isSecurityModalVisible, setSecurityModalVisible] = useState(false);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);

  const [isNotificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | any>(
    null,
  );
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);

  const [isThemeModalVisible, setThemeModalVisible] = useState(false);
  const [isLanguageModalVisible, setLanguageModalVisible] = useState(false);

  const handleChangeLanguage = async (lang: string) => {
    i18n.changeLanguage(lang);
    await AsyncStorage.setItem('app_language', lang);
    setLanguageModalVisible(false);
  };

  const handleLogout = () => {
    showAlert({
      title: t('settings.logoutConfirmTitle'),
      message: t('settings.logoutConfirmDesc'),
      confirmText: t('settings.logout'),
      cancelText: t('common.cancel'),
      isDestructive: true,
      onConfirm: async () => {
        await logout();
      },
    });
  };

  const openSecurityModal = async () => {
    setSecurityModalVisible(true);
    setIsSessionsLoading(true);
    try {
      const data = await sessionService.getActiveSessions();
      setActiveSessions(data.sessions);
      setCurrentSessionId(data.currentSessionId);
    } catch (error) {
      console.error(error);
      showAlert({ title: t('settings.error'), message: t('settings.sessionsLoadFailed'), hideCancel: true, confirmText: 'OK' });
      setSecurityModalVisible(false);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  const handleRevokeSession = (sessionId: number) => {
    showAlert({
      title: t('settings.revokeConfirmTitle'),
      message: t('settings.revokeConfirmDesc'),
      confirmText: t('settings.revoke'),
      cancelText: t('common.cancel'),
      isDestructive: true,
      onConfirm: async () => {
        try {
          await sessionService.revokeSession(sessionId);
          setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
          showAlert({
            title: t('settings.success'),
            message: t('settings.deviceRevoked'),
            hideCancel: true,
            confirmText: t('common.ok'),
          });
        } catch (error) {
          console.error(error);
          showAlert({
            title: t('settings.error'),
            message: t('settings.deviceRevokeFailed'),
            hideCancel: true,
            confirmText: t('common.ok'),
          });
        }
      },
    });
  };

  const openNotificationsModal = async () => {
    setNotificationsModalVisible(true);
    setIsSettingsLoading(true);
    try {
      const settings = await notificationService.getSettings();
      setNotificationSettings(settings);
    } catch (error) {
      console.error(error);
      showAlert({ title: t('common.error'), message: t('settings.sessionsLoadFailed'), hideCancel: true, confirmText: 'OK' });
      setNotificationsModalVisible(false);
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const handleToggleSetting = async (key: string, value: boolean) => {
    if (!notificationSettings) return;

    const previousSettings = { ...notificationSettings };
    const updatedSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(updatedSettings);

    try {
      await notificationService.updateSettings(updatedSettings);
    } catch (error) {
      console.error(error);
      setNotificationSettings(previousSettings);
      showAlert({ title: t('settings.error'), message: t('settings.settingSaveFailed'), hideCancel: true, confirmText: t('common.ok') });
    }
  };

  const SettingItem = ({ icon, title, subtitle, onPress, isDestructive = false }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingItemLeft}>
        <View style={[styles.iconContainer, isDestructive && { backgroundColor: colors.errorBg }]}>
          <Ionicons name={icon} size={20} color={isDestructive ? colors.error : colors.primary} />
        </View>
        <View>
          <Text style={[styles.settingItemTitle, isDestructive && { color: colors.error }]}>
            {title}
          </Text>
          {subtitle && <Text style={styles.settingItemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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

      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>{t('settings.preferences')}</Text>
      <View style={styles.sectionBlock}>
        <SettingItem
          icon="notifications-outline"
          title={t('settings.notifications')}
          subtitle={t('settings.notificationsDesc')}
          onPress={openNotificationsModal}
        />
        <SettingItem
          icon="alarm-outline"
          title={t('scheduledNotifications.title')}
          subtitle={t('scheduledNotifications.emptySub')}
          onPress={() => navigation.navigate('ScheduledNotificationsScreen')}
        />
        <SettingItem
          icon={theme === 'light' ? 'sunny-outline' : 'moon-outline'}
          title={t('settings.theme')}
          subtitle={theme === 'light' ? t('settings.themeLight') : t('settings.themeDark')}
          onPress={() => setThemeModalVisible(true)}
        />
        <SettingItem
          icon="language-outline"
          title={t('settings.language')}
          subtitle={t('settings.languageDesc')}
          onPress={() => setLanguageModalVisible(true)}
        />
      </View>

      <Text style={styles.sectionHeader}>{t('settings.privacy')}</Text>
      <View style={styles.sectionBlock}>
        <SettingItem
          icon="shield-half-outline"
          title={t('settings.blocked')}
          subtitle={t('settings.blockedDesc')}
          onPress={() => navigation.navigate('BlockedUsersScreen')}
        />
      </View>

      <Text style={styles.sectionHeader}>{t('settings.security')}</Text>
      <View style={styles.sectionBlock}>
        <SettingItem
          icon="laptop-outline"
          title={t('settings.devices')}
          subtitle={t('settings.devicesDesc')}
          onPress={openSecurityModal}
        />
        <SettingItem
          icon="log-out-outline"
          title={t('settings.logout')}
          onPress={handleLogout}
          isDestructive={true}
        />
      </View>

      <Modal
        visible={isSecurityModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSecurityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.connectedDevices')}</Text>
              <TouchableOpacity onPress={() => setSecurityModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>
            {isSessionsLoading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <ScrollView style={styles.sessionsList}>
                {activeSessions.map((session) => {
                  const isCurrent = session.id === currentSessionId;
                  const date = new Date(session.created_at).toLocaleDateString(i18n.language === 'ro' ? 'ro-RO' : 'en-US');
                  return (
                    <View key={session.id} style={styles.sessionCard}>
                      <View style={styles.sessionInfo}>
                        <Ionicons
                          name={
                            session.device_name.includes('ios') ||
                            session.device_name.includes('android')
                              ? 'phone-portrait-outline'
                              : 'laptop-outline'
                          }
                          size={24}
                          color={colors.textLight}
                        />
                        <View style={styles.sessionDetails}>
                          <Text style={styles.deviceName} numberOfLines={1}>
                            {session.device_name.substring(0, 30)}
                          </Text>
                          <Text style={styles.sessionDate}>{t('settings.loggedOn')}: {date}</Text>
                          {isCurrent && (
                            <Text style={styles.currentBadge}>{t('settings.currentDevice')}</Text>
                          )}
                        </View>
                      </View>
                      {!isCurrent && (
                        <TouchableOpacity
                          style={styles.revokeBtn}
                          onPress={() => handleRevokeSession(session.id)}
                        >
                          <Text style={styles.revokeBtnText}>{t('settings.revoke')}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={isNotificationsModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.notificationSettings')}</Text>
              <TouchableOpacity onPress={() => setNotificationsModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            {isSettingsLoading || !notificationSettings ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <View style={styles.settingsContainer}>
                <View style={styles.settingRow}>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>{t('settings.reactions')}</Text>
                    <Text style={styles.settingDescription}>
                      {t('settings.reactionsDesc')}
                    </Text>
                  </View>
                  <Switch
                    trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                    thumbColor={
                      notificationSettings.notify_reactions ? colors.primary : colors.gray
                    }
                    onValueChange={(val) => handleToggleSetting('notify_reactions', val)}
                    value={notificationSettings.notify_reactions}
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>{t('settings.newComments')}</Text>
                    <Text style={styles.settingDescription}>
                      {t('settings.newCommentsDesc')}
                    </Text>
                  </View>
                  <Switch
                    trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                    thumbColor={notificationSettings.notify_comments ? colors.primary : colors.gray}
                    onValueChange={(val) => handleToggleSetting('notify_comments', val)}
                    value={notificationSettings.notify_comments}
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>{t('settings.friendRequests')}</Text>
                    <Text style={styles.settingDescription}>
                      {t('settings.friendRequestsDesc')}
                    </Text>
                  </View>
                  <Switch
                    trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                    thumbColor={
                      notificationSettings.notify_friend_requests ? colors.primary : colors.gray
                    }
                    onValueChange={(val) => handleToggleSetting('notify_friend_requests', val)}
                    value={notificationSettings.notify_friend_requests}
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>{t('settings.acceptedRequests')}</Text>
                    <Text style={styles.settingDescription}>
                      {t('settings.acceptedRequestsDesc')}
                    </Text>
                  </View>
                  <Switch
                    trackColor={{ false: colors.border, true: `${colors.primary}80` }}
                    thumbColor={
                      notificationSettings.notify_friend_accepted ? colors.primary : colors.gray
                    }
                    onValueChange={(val) => handleToggleSetting('notify_friend_accepted', val)}
                    value={notificationSettings.notify_friend_accepted}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* --- MODAL: TEMĂ --- */}
      <Modal
        visible={isThemeModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.chooseTheme')}</Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.settingsContainer} showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.themeOption} onPress={() => setTheme('light')}>
                <View style={styles.themeOptionLeft}>
                  <Ionicons
                    name="sunny"
                    size={24}
                    color={theme === 'light' ? colors.primary : colors.textLight}
                  />
                  <Text style={styles.settingItemTitle}>{t('settings.themeLight')}</Text>
                </View>
                <Ionicons
                  name={theme === 'light' ? 'radio-button-on' : 'radio-button-off'}
                  size={24}
                  color={theme === 'light' ? colors.primary : colors.textLight}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.themeOption} onPress={() => setTheme('dark')}>
                <View style={styles.themeOptionLeft}>
                  <Ionicons
                    name="moon"
                    size={24}
                    color={theme === 'dark' ? colors.primary : colors.textLight}
                  />
                  <Text style={styles.settingItemTitle}>{t('settings.themeDark')}</Text>
                </View>
                <Ionicons
                  name={theme === 'dark' ? 'radio-button-on' : 'radio-button-off'}
                  size={24}
                  color={theme === 'dark' ? colors.primary : colors.textLight}
                />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- MODAL: LIMBĂ --- */}
      <Modal
        visible={isLanguageModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.chooseLanguage')}</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.settingsContainer} showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.themeOption} onPress={() => handleChangeLanguage('ro')}>
                <View style={styles.themeOptionLeft}>
                  <Text style={styles.settingItemTitle}>🇷🇴 {t('settings.romanian')}</Text>
                </View>
                <Ionicons
                  name={i18n.language === 'ro' ? 'radio-button-on' : 'radio-button-off'}
                  size={24}
                  color={i18n.language === 'ro' ? colors.primary : colors.textLight}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.themeOption} onPress={() => handleChangeLanguage('en')}>
                <View style={styles.themeOptionLeft}>
                  <Text style={styles.settingItemTitle}>🇬🇧 {t('settings.english')}</Text>
                </View>
                <Ionicons
                  name={i18n.language === 'en' ? 'radio-button-on' : 'radio-button-off'}
                  size={24}
                  color={i18n.language === 'en' ? colors.primary : colors.textLight}
                />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    contentContainer: { padding: 15, paddingBottom: 40 },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 15,
      marginBottom: 5,
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


    sectionHeader: {
      fontSize: 13,
      fontWeight: 'bold',
      color: colors.textLight,
      textTransform: 'uppercase',
      marginBottom: 8,
      marginTop: 15,
      paddingHorizontal: 5,
    },
    sectionBlock: {
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },

    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingItemLeft: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    settingItemTitle: { fontSize: 16, color: colors.textDark, fontWeight: '500' },
    settingItemSubtitle: { fontSize: 13, color: colors.textLight, marginTop: 2 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 10,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textDark },

    sessionsList: { paddingBottom: 20 },
    sessionCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sessionInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    sessionDetails: { marginLeft: 15, flex: 1 },
    deviceName: { fontSize: 15, fontWeight: 'bold', color: colors.textDark },
    sessionDate: { fontSize: 13, color: colors.textLight, marginTop: 2 },
    currentBadge: { color: colors.primary, fontSize: 12, fontWeight: 'bold', marginTop: 2 },
    revokeBtn: {
      backgroundColor: colors.errorBg,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    revokeBtnText: { color: colors.error, fontWeight: 'bold', fontSize: 13 },

    settingsContainer: { paddingBottom: 20 },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingTextContainer: { flex: 1, paddingRight: 15 },
    settingTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textDark, marginBottom: 4 },
    settingDescription: { fontSize: 13, color: colors.textLight, lineHeight: 18 },

    themeOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    themeOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  });
