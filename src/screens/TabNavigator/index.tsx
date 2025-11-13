import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import HomeScreen from "../StackNavigator/Screens/HomeScreen";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import ManageScreen from "./screens/ManageScreen";
import HomeScreen from "./screens/HomeScreen";
import FavoriteScreen from "./screens/FavoriteScreen";
import ProfileScreen from "./screens/ProfileScreen";
import MessageScreen from "./screens/MessageScreen";
import useAuthStore from "../../Stores/useAuthStore";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { useNotifications } from "../../hooks/useNotifications";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const currentUser = useAuthStore((s: any) => s.loggedInUser);
  const userId = currentUser?.id;
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const { unreadCount: notificationUnreadCount } = useNotifications();

  console.log("🔴 TabNavigator messageUnreadCount:", messageUnreadCount);
  console.log(
    "🔴 TabNavigator notificationUnreadCount:",
    notificationUnreadCount
  );

  useEffect(() => {
    if (!userId) {
      setMessageUnreadCount(0);
      return;
    }

    let currentReadTimestamps = new Map<string, Date>();
    // keep latest messages snapshot docs so we can recompute when readStatuses changes
    let lastMessagesDocs: any[] = [];

    const computeUnread = (messagesDocs: any[], readMap: Map<string, Date>) => {
      const unreadBySender = new Map<string, number>();
      messagesDocs.forEach((d: any) => {
        const data: any = d.data();
        const senderId = data.senderId;
        if (!senderId || senderId === userId) return;
        const createdAt =
          typeof data.createdAt?.toDate === "function"
            ? data.createdAt.toDate()
            : data.createdAt?.seconds
            ? new Date(data.createdAt.seconds * 1000)
            : new Date(0);
        const lastRead = readMap.get(senderId) || null;
        if (!lastRead || createdAt > lastRead) {
          const cur = unreadBySender.get(senderId) || 0;
          unreadBySender.set(senderId, cur + 1);
        }
      });
      const total = Array.from(unreadBySender.values()).reduce(
        (s, v) => s + v,
        0
      );
      setMessageUnreadCount(total);
    };

    const readStatusQ = query(
      collection(db, "readStatuses"),
      where("userId", "==", userId)
    );
    const unsubRead = onSnapshot(
      readStatusQ,
      (snap) => {
        const map = new Map<string, Date>();
        snap.forEach((d) => {
          const data: any = d.data();
          if (data.conversationId && data.lastRead) {
            const ts =
              typeof data.lastRead?.toDate === "function"
                ? data.lastRead.toDate()
: data.lastRead?.seconds
                ? new Date(data.lastRead.seconds * 1000)
                : null;
            if (!ts) return;
            const existing: Date | undefined = map.get(data.conversationId);
            // keep the latest timestamp per conversationId
            if (!existing || existing.getTime() < ts.getTime()) {
              map.set(data.conversationId, ts);
            }
          }
        });
        currentReadTimestamps = map;
        // recompute unread using the last messages snapshot so badge updates immediately
        try {
          computeUnread(lastMessagesDocs, currentReadTimestamps);
        } catch (err) {
          console.warn(
            "failed to recompute unread on readStatuses update",
            err
          );
        }
      },
      (err) => {
        console.warn("readStatuses listener error", err);
      }
    );

    const messagesQ = query(
      collection(db, "messages"),
      where("recipientId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const unsubMsg = onSnapshot(
      messagesQ,
      (snap) => {
        // store latest messages docs and compute unread using current read timestamps
        lastMessagesDocs = snap.docs;
        try {
          computeUnread(lastMessagesDocs, currentReadTimestamps);
        } catch (err) {
          console.warn("failed to compute unread on messages update", err);
        }
      },
      (err) => {
        console.warn("messages listener error", err);
      }
    );

    return () => {
      try {
        unsubRead();
      } catch (e) {}
      try {
        unsubMsg();
      } catch (e) {}
    };
  }, [userId]);

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: ({ color, size, focused }) => {
          let name: React.ComponentProps<typeof Icon>["name"] = "circle";
          switch (route.name) {
            case "Home":
              name = "home-outline";
              break;
            case "Favorites":
              name = "heart-outline";
              break;
            case "Profile":
              name = "account-outline";
              break;
            case "Message":
              name = "message-text-outline";
              break;
            case "Manage":
              name = "briefcase-outline";
              break;
            default:
              name = "circle";
          }

          return (
            <View style={styles.iconContainer}>
              <View
                style={[
                  styles.iconWrapper,
                  focused
                    ? styles.iconWrapperActive
                    : styles.iconWrapperInactive,
                ]}
              >
                <Icon name={name} size={20} color={focused ? "#fff" : color} />
                {/* Badge chấm đỏ khi có tin nhắn chưa đọc ở Message */}
{route.name === "Message" && messageUnreadCount > 0 && (
                  <View style={styles.tabBadgeInside} pointerEvents="none" />
                )}
                {/* Badge chấm đỏ khi có thông báo chưa đọc ở Profile */}
                {route.name === "Profile" && notificationUnreadCount > 0 && (
                  <View style={styles.tabBadgeInside} pointerEvents="none" />
                )}
              </View>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.tabLabel, focused && styles.tabLabelActive]}
              >
                {route.name}
              </Text>
            </View>
          );
        },
        tabBarActiveTintColor: "#4f8ef7",
        tabBarInactiveTintColor: "#8892a6",
        tabBarStyle: styles.tabBar,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Favorites" component={FavoriteScreen} />
      <Tab.Screen name="Manage" component={ManageScreen} />
      <Tab.Screen name="Message" component={MessageScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 10,
    height: 68,
    borderRadius: 18,
    backgroundColor: "rgba(11,17,32,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    paddingHorizontal: 8,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 72,
    height: "100%",
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    transform: [{ translateY: 0 }],
  },
  iconWrapperActive: {
    backgroundColor: "#60a5fa", // modern blue accent (shadcn-like)
    shadowColor: "#60a5fa",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
    transform: [{ translateY: -6 }],
  },
  iconWrapperInactive: {
    backgroundColor: "transparent",
    transform: [{ translateY: 16 }],
  },
  tabLabel: {
    fontSize: 11,
    color: "#94a3b8", // muted slate-like color
    letterSpacing: 0.2,
    maxWidth: 72,
    textAlign: "center",
    lineHeight: 14,
    transform: [{ translateY: 8 }],
  },
  tabLabelActive: {
    color: "#e6f6ff", // near-white with cool tint
    fontWeight: "600",
    transform: [{ translateY: -6 }],
  },
  tabBadgeInside: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ef4444",
    borderWidth: 1,
    borderColor: "#fff",
  },
});
