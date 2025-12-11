import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { sendPushNotification } from "./PushNotificationService";
import apiClient from "../lib/apiClient";

/**
 * Listen to Firestore notifications collection and send push notifications
 * Call this when app starts (in App.tsx or main component)
 */
export function setupNotificationListener(userId: string) {
  if (!userId) return () => {};

  console.log(
    "🔔 [NotificationListener] Setting up listener for userId:",
    userId
  );

  // Listen to notifications where receiverId matches (unread only)
  const q = query(
    collection(db, "notifications"),
    where("receiverId", "==", userId),
    where("isRead", "==", false)
  );

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const notification = change.doc.data();
          console.log(
            "📬 [NotificationListener] New notification:",
            notification
          );

          try {
            // Get user's push token from Firestore
            const tokenDoc = await getDoc(doc(db, "pushTokens", userId));
            if (!tokenDoc.exists()) {
              console.log(
                "⚠️ [NotificationListener] No push token found for user:",
                userId
              );
              return;
            }

            const pushToken = tokenDoc.data()?.token;
            if (!pushToken) {
              console.log("⚠️ [NotificationListener] Push token is empty");
              return;
            }

            // Send push notification
            await sendPushNotification({
              to: pushToken,
              title: notification.title || "New Notification",
              body: notification.body || notification.message || "",
              data: {
                type: notification.type,
                contractId: notification.contractId,
                notificationId: change.doc.id,
              },
              sound: "default",
              badge: 1,
            });

            console.log(
              "✅ [NotificationListener] Push notification sent successfully"
            );
          } catch (error) {
            console.error(
              "❌ [NotificationListener] Error sending push notification:",
              error
            );
          }
        }
      });
    },
    (error) => {
      console.error(
        "❌ [NotificationListener] Error listening to notifications:",
        error
      );
    }
  );

  return unsubscribe;
}

/**
 * Listen to messages and send push notifications for new messages
 */
export function setupMessageListener(userId: string) {
  if (!userId) return () => {};

  console.log("💬 [MessageListener] Setting up listener for userId:", userId);

  // Listen to messages where recipientId = userId
  const q = query(
    collection(db, "messages"),
    where("recipientId", "==", userId)
  );

  let isFirstLoad = true;

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      if (isFirstLoad) {
        // Skip initial load to avoid sending notifications for old messages
        isFirstLoad = false;
        console.log(
          "📚 [MessageListener] Initial load, skipping notifications"
        );
        return;
      }

      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const message = change.doc.data();
          const senderId = message.senderId;

          console.log("💬 [MessageListener] New message from:", senderId);

          try {
            // Get user's push token
            const tokenDoc = await getDoc(doc(db, "pushTokens", userId));
            if (!tokenDoc.exists()) {
              console.log("⚠️ [MessageListener] No push token found");
              return;
            }

            const pushToken = tokenDoc.data()?.token;
            if (!pushToken) {
              console.log("⚠️ [MessageListener] Push token is empty");
              return;
            }

            // Get sender name from backend
            let senderName = "Someone";
            try {
              const profileResponse: any = await apiClient.get(
                `/profile/getname/${senderId}`
              );
              const profileData = profileResponse?.data ?? profileResponse;
              senderName = profileData?.fullName || senderId;
              console.log("👤 [MessageListener] Sender name:", senderName);
            } catch (error) {
              console.warn(
                "⚠️ [MessageListener] Could not fetch sender name:",
                error
              );
              senderName = senderId;
            }

            // Determine notification body based on message type
            let body = message.text || "Sent you a message";
            if (message.messageType === "image") {
              body = "📷 Sent you an image";
            } else if (message.messageType === "file") {
              body = "📎 Sent you a file";
            }

            // Send push notification
            await sendPushNotification({
              to: pushToken,
              title: `💬 ${senderName}`,
              body: body,
              data: {
                type: "new_message",
                partnerId: senderId,
                partnerName: senderName,
              },
              sound: "default",
              badge: 1,
            });

            console.log(
              "✅ [MessageListener] Push notification sent for new message"
            );
          } catch (error) {
            console.error(
              "❌ [MessageListener] Error sending push notification:",
              error
            );
          }
        }
      });
    },
    (error) => {
      console.error("❌ [MessageListener] Error listening to messages:", error);
    }
  );

  return unsubscribe;
}
