import React, { useState, useContext, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { sessionService, Session } from '../api/sessionService';
import { notificationService, NotificationSettings } from '../api/notificationService';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { ThemeColors } from '../theme/colors';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { logout } = useContext(AuthContext);
  const { colors, theme, setTheme } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);

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

  const handleLogout = () => {
    Alert.alert('Delogare', 'Ești sigur că vrei să ieși din cont de pe acest dispozitiv?', [
      { text: 'Anulează', style: 'cancel' },
      { text: 'Ieși', style: 'destructive', onPress: () => logout() },
    ]);
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
      Alert.alert('Eroare', 'Nu s-au putut încărca dispozitivele conectate.');
      setSecurityModalVisible(false);
    } finally {
      setIsSessionsLoading(false);
    }
  };

  const handleRevokeSession = (sessionId: number) => {
    Alert.alert(
      'Deconectare Dispozitiv',
      'Ești sigur că vrei să deconectezi acest dispozitiv de la distanță?',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Deconectează',
          style: 'destructive',
          onPress: async () => {
            try {
              await sessionService.revokeSession(sessionId);
              setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
              Alert.alert('Succes', 'Dispozitivul a fost deconectat.');
            } catch (error) {
              console.error(error);
              Alert.alert('Eroare', 'Nu s-a putut deconecta dispozitivul.');
            }
          },
        },
      ],
    );
  };

  const openNotificationsModal = async () => {
    setNotificationsModalVisible(true);
    setIsSettingsLoading(true);
    try {
      const settings = await notificationService.getSettings();
      setNotificationSettings(settings);
    } catch (error) {
      console.error(error);
      Alert.alert('Eroare', 'Nu s-au putut încărca setările de notificări.');
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
      Alert.alert('Eroare conexiune', 'Setarea nu a putut fi salvată.');
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.sectionHeader}>Preferințe Aplicație</Text>
      <View style={styles.sectionBlock}>
        <SettingItem
          icon="notifications-outline"
          title="Notificări"
          subtitle="Reacții, comentarii, cereri"
          onPress={openNotificationsModal}
        />
        <SettingItem
          icon={theme === 'light' ? 'sunny-outline' : 'moon-outline'}
          title="Temă de culoare"
          subtitle={theme === 'light' ? 'Deschisă' : 'Întunecată'}
          onPress={() => setThemeModalVisible(true)}
        />
      </View>

      <Text style={styles.sectionHeader}>Confidențialitate și Siguranță</Text>
      <View style={styles.sectionBlock}>
        <SettingItem
          icon="people-outline"
          title="Lista de Prieteni"
          subtitle="Gestionează prietenii tăi"
          onPress={() => navigation.navigate('FriendsScreen')}
        />
        <SettingItem
          icon="shield-half-outline"
          title="Persoane Blocate"
          subtitle="Vezi și deblochează utilizatori"
          onPress={() => navigation.navigate('BlockedUsersScreen')}
        />
      </View>

      <Text style={styles.sectionHeader}>Securitate Cont</Text>
      <View style={styles.sectionBlock}>
        <SettingItem
          icon="laptop-outline"
          title="Dispozitive conectate"
          subtitle="Gestionează sesiunile active"
          onPress={openSecurityModal}
        />
        <SettingItem
          icon="log-out-outline"
          title="Deconectare"
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
              <Text style={styles.modalTitle}>Dispozitive Conectate</Text>
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
                  const date = new Date(session.created_at).toLocaleDateString('ro-RO');
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
                          <Text style={styles.sessionDate}>Logat pe: {date}</Text>
                          {isCurrent && (
                            <Text style={styles.currentBadge}>Dispozitivul curent</Text>
                          )}
                        </View>
                      </View>
                      {!isCurrent && (
                        <TouchableOpacity
                          style={styles.revokeBtn}
                          onPress={() => handleRevokeSession(session.id)}
                        >
                          <Text style={styles.revokeBtnText}>Ieși</Text>
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
              <Text style={styles.modalTitle}>Setări Notificări</Text>
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
                    <Text style={styles.settingTitle}>Reacții la citate</Text>
                    <Text style={styles.settingDescription}>
                      Când cineva reacționează la postările tale.
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
                    <Text style={styles.settingTitle}>Comentarii noi</Text>
                    <Text style={styles.settingDescription}>
                      Când cineva lasă un comentariu la citatul tău.
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
                    <Text style={styles.settingTitle}>Cereri de prietenie</Text>
                    <Text style={styles.settingDescription}>
                      Când cineva dorește să se conecteze cu tine.
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
                    <Text style={styles.settingTitle}>Cereri acceptate</Text>
                    <Text style={styles.settingDescription}>
                      Când cineva îți acceptă cererea trimisă.
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
              <Text style={styles.modalTitle}>Alege Tema Aplicației</Text>
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
                  <Text style={styles.settingItemTitle}>Deschisă</Text>
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
                  <Text style={styles.settingItemTitle}>Întunecată</Text>
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
    </ScrollView>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    contentContainer: { padding: 15, paddingBottom: 40 },

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
