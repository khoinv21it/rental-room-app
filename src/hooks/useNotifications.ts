import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { useNavigation } from "@react-navigation/native";
import useAuthStore from "../Stores/useAuthStore";
import { db } from "../lib/firebase";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import {
  setupNotificationListener,
  setupMessageListener,
} from "../Services/NotificationListenerService";

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>("");
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);
  const navigation = useNavigation<any>();
  const currentUser = useAuthStore((s) => s.loggedInUser);
  const userId = currentUser?.id;

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        // Save token to backend if user is logged in
        if (userId) {
          savePushTokenToBackend(userId, token);
        }
      }
    });

    // Listener for notifications received while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log(
          "📬 [useNotifications] Notification received:",
          notification
        );
        setNotification(notification);
      });

    // Listener for when user taps on notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          "👆 [useNotifications] Notification tapped:",
          response.notification.request.content.data
        );
        handleNotificationResponse(response);
      });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [userId]);

  // Save token to backend when user logs in
  useEffect(() => {
    if (userId && expoPushToken) {
      savePushTokenToBackend(userId, expoPushToken);
    }
  }, [userId, expoPushToken]);

  // Setup Firestore listeners for notifications and messages
  useEffect(() => {
    if (!userId) return;

    console.log(
      "🔔 [useNotifications] Setting up Firestore listeners for userId:",
      userId
    );

    // Setup notification listener
    const unsubscribeNotifications = setupNotificationListener(userId);

    // Setup message listener
    const unsubscribeMessages = setupMessageListener(userId);

    return () => {
      console.log("🔕 [useNotifications] Cleaning up Firestore listeners");
      unsubscribeNotifications();
      unsubscribeMessages();
    };
  }, [userId]);

  // Track unread notifications count
  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    console.log(
      "📊 [useNotifications] Setting up unread count listener for userId:",
      userId
    );

    // Listen to notifications where read = false
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const count = snapshot.size;
        console.log("📊 [useNotifications] Unread notifications count:", count);
        setUnreadCount(count);
      },
      (error) => {
        console.error(
          "❌ [useNotifications] Error listening to unread notifications:",
          error
        );
      }
    );

    return () => {
      console.log("🔕 [useNotifications] Cleaning up unread count listener");
      unsubscribe();
    };
  }, [userId]);

  const handleNotificationResponse = (
    response: Notifications.NotificationResponse
  ) => {
    const data = response.notification.request.content.data;
    const type = data?.type as string;
    const contractId = data?.contractId as string;
    const partnerId = data?.partnerId as string;
    const partnerName = data?.partnerName as string;

    console.log("🎯 [useNotifications] Handling notification type:", type);

    // Navigate based on notification type
    switch (type) {
      case "booking_success":
        navigation.navigate("RentalHistoryScreen");
        break;
      case "request_success":
        navigation.navigate("RequestStatusScreen");
        break;
      case "resident_success":
        navigation.navigate("ResidentsScreen");
        break;
      case "payment_success":
        if (contractId) {
          navigation.navigate("ContractOverviewScreen", {
            contractId,
            initialTab: "bills",
          });
        }
        break;
      case "new_message":
        if (partnerId) {
          // Navigate to MessageScreen with specific conversation
          navigation.navigate("MessageScreen", {
            partnerId,
            partnerName: partnerName || "User",
          });
        } else {
          // Just open MessageScreen
          navigation.navigate("MessageScreen");
        }
        break;
      default:
        // Open NotificationScreen for other types
        navigation.navigate("NotificationScreen");
        break;
    }
  };

  const savePushTokenToBackend = async (userId: string, token: string) => {
    try {
      console.log("💾 [useNotifications] Saving push token to Firestore:", {
        userId,
        token,
      });

      // Save to Firestore collection: pushTokens/{userId}
      await setDoc(
        doc(db, "pushTokens", userId),
        {
          token,
          platform: Platform.OS,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      console.log(
        "✅ [useNotifications] Push token saved to Firestore successfully"
      );
    } catch (error) {
      console.error("❌ [useNotifications] Error saving push token:", error);
    }
  };

  return {
    expoPushToken,
    notification,
    unreadCount, // Expose unreadCount to components
  };
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.warn("❌ [useNotifications] Failed to get push token!");
      return;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        throw new Error("Project ID not found");
      }

      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;

      console.log("✅ [useNotifications] Expo push token:", token);
    } catch (e: any) {
      console.error("❌ [useNotifications] Error getting push token:", e);
      token = undefined;
    }
  } else {
    console.warn(
      "⚠️ [useNotifications] Must use physical device for Push Notifications"
    );
  }

  return token;
}
