import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { Notification } from "../../../types/types";
import useAuthStore from "../../../Stores/useAuthStore";
import Toast from "react-native-toast-message";

type Props = {
  navigation: any;
};

const NotificationScreen = ({ navigation }: Props) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [displayedNotifications, setDisplayedNotifications] = useState<
    Notification[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const notificationsPerPage = 10;
  const authStore = useAuthStore();
  const userId = authStore.loggedInUser?.id;

  const showToast = (
    type: "success" | "error",
    title: string,
    message: string
  ) => {
    Toast.show({
      type: type,
      position: "top",
      text1: title,
      text2: message,
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 50,
    });
  };

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "notifications"),
      where("receiverId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(
        (docSnap) =>
          ({
            id: docSnap.id,
            ...docSnap.data(),
          } as Notification)
      );

      // Chỉ hiển thị popup cho notification thực sự mới (không phải lần đầu load)
      if (!isInitialLoad) {
        // Chỉ hiển thị popup nếu có document mới được thêm VÀ không phải từ cache
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" && !change.doc.metadata.fromCache) {
            showToast(
              "success",
              "New Notification",
              change.doc.data().message as string
            );
          }
        });
      } else {
        console.log("Initial load, skipping notification popup");
        setIsInitialLoad(false);
      }

      setNotifications(data);
      // Reset pagination when new notifications come
      setCurrentPage(1);
      setDisplayedNotifications(data.slice(0, notificationsPerPage));
      setHasMore(data.length > notificationsPerPage);
      setIsLoading(false);
      setRefreshing(false);
    });

    return () => unsub();
  }, [userId, isInitialLoad]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.isRead);

      if (unread.length === 0) {
        showToast("success", "Info", "No unread notifications");
        return;
      }

      for (const n of unread) {
        await updateDoc(doc(db, "notifications", n.id), { isRead: true });
      }
      showToast("success", "Success", "Marked all notifications as read");
    } catch (err) {
      console.error("Error mark all as read:", err);
      showToast("error", "Error", "Failed to mark all as read");
    }
  };

  const markAsRead = async (notification: Notification) => {
    if (notification.isRead) return;

    try {
      await updateDoc(doc(db, "notifications", notification.id), {
        isRead: true,
      });
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const loadMore = () => {
    if (!hasMore || isLoading) return;

    const nextPage = currentPage + 1;
    const startIndex = 0;
    const endIndex = nextPage * notificationsPerPage;
    const newDisplayed = notifications.slice(startIndex, endIndex);

    setDisplayedNotifications(newDisplayed);
    setCurrentPage(nextPage);
    setHasMore(endIndex < notifications.length);
  };

  const onRefresh = () => {
    setRefreshing(true);
    // The onSnapshot listener will automatically update the data
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";

    try {
      let date: Date;
      if (timestamp?.toDate) {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        date = new Date(timestamp);
      }

      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 60) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;

      return date.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification,
      ]}
      onPress={() => markAsRead(item)}
    >
      <View style={styles.notificationIcon}>
        <Icon
          name="bell"
          size={20}
          color={!item.isRead ? "#3b82f6" : "#94a3b8"}
        />
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.notificationContent}>
        <Text
          style={[
            styles.notificationMessage,
            !item.isRead && styles.unreadText,
          ]}
          numberOfLines={2}
        >
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="bell-off" size={64} color="#cbd5e1" />
      <Text style={styles.emptyText}>No notifications yet</Text>
      <Text style={styles.emptySubtext}>
        You'll see your notifications here
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;

    return (
      <View style={styles.footerLoader}>
        <TouchableOpacity onPress={loadMore} style={styles.loadMoreButton}>
          <Text style={styles.loadMoreText}>Load More</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Icon name="check-circle" size={20} color="#3b82f6" />
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={displayedNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          displayedNotifications.length === 0
            ? styles.emptyListContainer
            : styles.listContainer
        }
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3b82f6"]}
            tintColor="#3b82f6"
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0f172a",
    marginRight: 8,
  },
  badge: {
    backgroundColor: "#ef4444",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  markAllButton: {
    padding: 8,
    marginLeft: 8,
  },
  listContainer: {
    paddingBottom: 16,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#ffffff",
  },
  unreadNotification: {
    backgroundColor: "#eff6ff",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3b82f6",
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 4,
    lineHeight: 20,
  },
  unreadText: {
    color: "#0f172a",
    fontWeight: "500",
  },
  notificationTime: {
    fontSize: 12,
    color: "#94a3b8",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
  loadMoreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
  },
});

export default NotificationScreen;
