// Helper functions to send push notifications via Expo Push Notification Service
// This can be called from backend or from React Native app

export interface PushNotificationData {
  to: string; // Expo push token
  title: string;
  body: string;
  data?: {
    type?: string;
    contractId?: string;
    partnerId?: string;
    partnerName?: string;
    [key: string]: any;
  };
  sound?: string;
  badge?: number;
  priority?: "default" | "normal" | "high";
}

export async function sendPushNotification(notification: PushNotificationData) {
  const message = {
    to: notification.to,
    sound: notification.sound || "default",
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
    badge: notification.badge,
    priority: notification.priority || "high",
  };

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();
    console.log("✅ [PushNotification] Sent successfully:", data);
    return data;
  } catch (error) {
    console.error("❌ [PushNotification] Error sending:", error);
    throw error;
  }
}

export async function sendPushNotificationToMultiple(
  tokens: string[],
  title: string,
  body: string,
  data?: any
) {
  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data: data || {},
    priority: "high",
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const responseData = await response.json();
    console.log("✅ [PushNotification] Sent to multiple:", responseData);
    return responseData;
  } catch (error) {
    console.error("❌ [PushNotification] Error sending to multiple:", error);
    throw error;
  }
}
