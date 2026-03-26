import React, { useContext, useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, Theme as NavigationTheme, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CommentsScreen from './src/screens/CommentsScreen';
import ConversationsScreen from './src/screens/ConversationsScreen';

import ChatScreen from './src/screens/ChatScreen';

import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ThemeProvider, ThemeContext } from './src/context/ThemeContext';
import { ThemeColors } from './src/theme/colors';
import { notificationService } from './src/api/notificationService';

import { messageService } from './src/api/messageService';
import SettingsScreen from './src/screens/SettingsScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import BlockedUsersScreen from './src/screens/BlockedUsersScreen';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  
  const { colors } = useContext(ThemeContext);

  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('[Push] Utilizatorul a refuzat permisiunea de notificări.');
        return;
      }

      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (!projectId) {
          console.warn('[Push] Project ID nu a fost găsit. Avertisment pentru build-ul final.');
        }
        
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('[Push] Token generat cu succes:', token);

        await notificationService.savePushToken(token);

      } catch (error) {
        console.error('[Push] Eroare la obținerea token-ului:', error);
      }
    } else {
      console.log('[Push] Rulezi pe un emulator. Push Notifications necesită un dispozitiv fizic.');
    }
  };

  useEffect(() => {
    registerForPushNotificationsAsync();

    const fetchCounts = async () => {
      try {
        const notifCount = await notificationService.getUnreadCount();
        setUnreadCount(Number(notifCount)); 

        const msgCount = await messageService.getUnreadCount();
        setUnreadMessagesCount(Number(msgCount)); 
      } catch (error) {
        console.log('[Polling] Eroare preluare badge-uri:', error);
      }
    };

    fetchCounts(); 
    const intervalId = setInterval(fetchCounts, 10000); 

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help';

          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Notifications') iconName = focused ? 'notifications' : 'notifications-outline';
          else if (route.name === 'Conversations') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.card,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.textDark,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Feed' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Caută' }} />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{ 
          title: 'Notificări',
          tabBarBadge: (unreadCount && !isNaN(unreadCount) && unreadCount > 0) ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.error, color: colors.white, fontSize: 10 }
        }} 
      />
      <Tab.Screen 
        name="Conversations" 
        component={ConversationsScreen} 
        options={{ 
          title: 'Mesaje',
          tabBarBadge: (unreadMessagesCount && !isNaN(unreadMessagesCount) && unreadMessagesCount > 0) ? unreadMessagesCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.error, color: colors.white, fontSize: 10 }
        }} 
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profilul Meu' }} />
    </Tab.Navigator>
  );
};

const RootNavigator = () => {
  const { userToken, isLoading } = useContext(AuthContext);
  
  const { colors, theme } = useContext(ThemeContext);
  const styles = useMemo(() => getStyles(colors), [colors]);

  const navigationTheme: NavigationTheme = useMemo(() => {
    const baseTheme = theme === 'dark' ? DarkTheme : DefaultTheme;
    
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.textDark,
        border: colors.border,
        notification: colors.error,
      },
    };
  }, [colors, theme]);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator>
        {userToken == null ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabNavigator} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Comments" 
              component={CommentsScreen} 
              options={{ 
                title: 'Comentarii',
                headerBackTitle: 'Înapoi' 
              }} 
            />
            <Stack.Screen 
              name="ChatScreen" 
              component={ChatScreen} 
              options={{ 
                headerBackTitle: 'Înapoi',
              }} 
            />
            <Stack.Screen 
              name="SettingsScreen" 
              component={SettingsScreen} 
              options={{ 
                title: 'Setări' 
              }} 
            />
            <Stack.Screen 
              name="FriendsScreen" 
              component={FriendsScreen} 
              options={{ title: 'Lista de Prieteni' }} 
            />
            <Stack.Screen 
              name="BlockedUsersScreen" 
              component={BlockedUsersScreen} 
              options={{ title: 'Persoane Blocate' }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  }
});