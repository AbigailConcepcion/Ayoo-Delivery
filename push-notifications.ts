import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { ayooCloud, notificationHub } from './api';
import { db } from './db';

/**
 * Registers the current device for push notifications and syncs the token to the backend.
 * This should be called after a user logs in or when the app resumes with an active session.
 */
export async function initPushNotifications() {
  // Push Notifications plugin is only available on native Android and iOS
  if (!Capacitor.isNativePlatform()) {
    console.info('Push notifications skipped: Not a native platform.');
    return;
  }

  const user = await db.getSession();
  if (!user) return;

  try {
    // 1. Check/Request permissions
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('Push notification permission denied by user.');
      return;
    }

    // 2. Register with Apple (APNS) or Google (FCM)
    await PushNotifications.register();

    // 3. Listen for the registration event to get the unique token
    PushNotifications.addListener('registration', (token) => {
      console.log('Push device token registered:', token.value);
      // Save the token to our backend database for this user via the AyooCloud API
      ayooCloud.registerPushToken(user.email, token.value);
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on push registration:', error);
    });

    // 4. Handle notification reception (optional: show in-app toast if foregrounded)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Incoming push notification:', notification);
      notificationHub.notify({
        title: notification.title,
        body: notification.body,
        data: notification.data
      });
    });

    // 5. Handle tapping on a notification (Deep Linking)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification tap detected:', notification.notification.data);
      notificationHub.tap(notification.notification.data);
    });
  } catch (err) {
    console.error('Failed to initialize push notifications:', err);
  }
}