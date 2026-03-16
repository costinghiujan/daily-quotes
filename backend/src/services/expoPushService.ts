import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export const sendPushNotification = async (
  pushToken: string,
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<void> => {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`[Push Service] Token invalid detectat: ${pushToken}`);
    return;
  }

  const messages: ExpoPushMessage[] = [
    {
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data,
    },
  ];

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log('[Push Service] Notificare trimisă cu succes la Expo:', ticketChunk);
    } catch (error) {
      console.error('[Eroare Push Service] Trimitere eșuată:', error);
    }
  }
};