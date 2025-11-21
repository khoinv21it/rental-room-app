import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fetchConversations,
  markConversationRead,
} from "../../../Services/ChatService";
import useAuthStore from "../../../Stores/useAuthStore";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { ChatView } from "../../../components/ChatView";

const ConversationItem = ({ item, onPress }: any) => {
  const last = item.lastMessage;
  const avatar =
    item.partner?.avatar || item.partner?.userProfile?.avatar || null;
  const avatarUri = avatar
    ? avatar.startsWith("http")
      ? avatar
      : avatar
    : null;

  const formatTimestamp = (d: Date | undefined | null) => {
    if (!d) return "";
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    return d.toLocaleDateString();
  };

  const unread = item.unreadCount || 0;
  return (
    <TouchableOpacity style={styles.convItem} onPress={() => onPress(item)}>
      <View style={styles.convAvatar}>
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.convAvatarImg}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.convAvatarPlaceholder}>
            <Icon name="account" size={30} color="#9ca3af" />
          </View>
        )}
        {unread > 0 && (
          <View style={styles.unreadBadge} pointerEvents="none">
            <Text style={styles.unreadText} numberOfLines={1}>
              {unread > 99 ? "99+" : String(unread)}
            </Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={styles.convTitle} numberOfLines={1}>
          {item.partner?.name || item.partner?.fullName || "Unknown"}
        </Text>
        <Text
          style={[styles.convLast, unread > 0 ? styles.convLastUnread : null]}
          numberOfLines={1}
        >
          {last?.messageType === "image" ? "Đã gửi 1 ảnh" : last?.text || ""}
        </Text>
      </View>
      <Text style={styles.convTime}>{formatTimestamp(last?.createdAt)}</Text>
    </TouchableOpacity>
  );
};

// Removed MessageBubble component - now using ChatView component instead

const MessageScreen = () => {
  const currentUser = useAuthStore((s: any) => s.loggedInUser);
  const userId = currentUser?.id;
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const recentlyMarkedAsRead = useRef<Set<string>>(new Set());
  const loadConversationsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadConversations = useCallback(async () => {
    if (!userId) return;
    setLoadingConvs(true);
    try {
      const res: any = await fetchConversations(userId, 0, 50);
      const list = res?.content || [];
      // sort by lastMessage.createdAt desc
      list.sort((a: any, b: any) => {
        const ta = a.lastMessage?.createdAt?.getTime?.() || 0;
        const tb = b.lastMessage?.createdAt?.getTime?.() || 0;
        return tb - ta;
      });
      // Apply optimistic protection: if conversation was recently marked as read, keep unreadCount=0
      const protectedList = list.map((conv: any) => {
        if (recentlyMarkedAsRead.current.has(conv.id)) {
          return { ...conv, unreadCount: 0 };
        }
        return conv;
      });
      setConversations(protectedList);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoadingConvs(false);
    }
  }, [userId]);

  // Removed unused functions - now using ChatView component for chat interface

  useEffect(() => {
    loadConversations();
  }, [loadConversations, userId]);

  // Realtime listener to update conversations list when messages change
  useEffect(() => {
    if (!userId) return;

    const { db } = require("../../../lib/firebase");

    // Debounced refresh to avoid too many updates
    const debouncedRefresh = () => {
      if (loadConversationsTimeoutRef.current) {
        clearTimeout(loadConversationsTimeoutRef.current);
      }
      loadConversationsTimeoutRef.current = setTimeout(() => {
        loadConversations();
      }, 500); // Wait 500ms before refreshing
    };

    // Listen to messages where user is recipient to update unread counts
    const messagesQ = query(
      collection(db, "messages"),
      where("recipientId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubMessages = onSnapshot(
      messagesQ,
      () => {
        // When new messages arrive, refresh conversations to update unread counts
        debouncedRefresh();
      },
      (error) => {
        console.error("Conversations messages listener error:", error);
      }
    );

    // Listen to readStatuses to update when other devices mark as read
    const readStatusQ = query(
      collection(db, "readStatuses"),
      where("userId", "==", userId)
    );

    const unsubReadStatus = onSnapshot(
      readStatusQ,
      () => {
        // Refresh conversations when read status changes
        debouncedRefresh();
      },
      (error) => {
        console.error("Conversations readStatus listener error:", error);
      }
    );

    return () => {
      if (loadConversationsTimeoutRef.current) {
        clearTimeout(loadConversationsTimeoutRef.current);
      }
      unsubMessages();
      unsubReadStatus();
    };
  }, [userId, loadConversations]);

  const handleBackToList = () => {
    setSelected(null);
    setSearchQuery(""); // Clear search when going back
    // refresh conversations to reflect read states
    loadConversations();
  };

  const handleSelect = async (c: any) => {
    setSelected(c);
    // optimistic: set unreadCount to 0 locally and protect from server refresh
    const conversationId = c.id;
    recentlyMarkedAsRead.current.add(conversationId);
    setConversations((prev) =>
      prev.map((p: any) =>
        p.id === conversationId ? { ...p, unreadCount: 0 } : p
      )
    );

    // mark as read in backend
    if (userId) {
      try {
        await markConversationRead(userId, conversationId);
        // After marking read, refresh conversations to sync with Firebase
        await loadConversations();
      } catch (err) {
        console.warn("markConversationRead failed", err);
      } finally {
        // Remove protection after a short delay
        setTimeout(() => {
          recentlyMarkedAsRead.current.delete(conversationId);
        }, 2000);
      }
    }
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const partnerName = (
      conv.partner?.name ||
      conv.partner?.fullName ||
      ""
    ).toLowerCase();
    return partnerName.includes(searchQuery.toLowerCase());
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Conversation list - always visible */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.searchContainer}>
          <Icon
            name="magnify"
            size={20}
            color="#9ca3af"
            style={styles.searchIcon}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search conversations..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearBtn}
            >
              <Icon name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.listContainer}>
        {loadingConvs ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : filteredConversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="message-text-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? "No conversations found"
                : "No messages yet"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <ConversationItem item={item} onPress={handleSelect} />
            )}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>

      {/* ChatView Modal - overlays on top */}
      {selected && (
        <Modal
          visible={!!selected}
          animationType="slide"
          onRequestClose={handleBackToList}
          presentationStyle="fullScreen"
        >
          <ChatView
            conversationId={selected.id}
            partnerId={selected.id}
            partnerName={
              selected.partner?.name || selected.partner?.fullName || "Unknown"
            }
            partnerAvatar={selected.partner?.avatar}
            onClose={handleBackToList}
            showHeader={true}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  // HEADER - Modern Design
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#3B82F6",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A2E",
    padding: 0,
    fontWeight: "500",
  },
  clearBtn: {
    padding: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  chatHeaderMobile: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
    backgroundColor: "#3B82F6",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: "#3B82F6",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  backText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "700",
  },
  chatHeaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  chatAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: "#EFF6FF",
    borderWidth: 2,
    borderColor: "#fff",
  },
  chatAvatarImg: {
    width: "100%",
    height: "100%",
  },
  chatAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  chatHeaderTitle: {
    fontWeight: "700",
    fontSize: 18,
    color: "#fff",
    flexShrink: 1,
    letterSpacing: 0.2,
  },

  // CONVERSATION LIST - Modern Cards
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  convItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  convAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: "visible",
    marginRight: 14,
  },
  convAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 27,
  },
  convAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#EFF6FF",
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#DBEAFE",
  },
  convTitle: {
    fontWeight: "700",
    color: "#1A1A2E",
    fontSize: 16,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  convLast: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 18,
  },
  convLastUnread: {
    color: "#1A1A2E",
    fontWeight: "600",
  },
  convTime: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
  },
  unreadBadge: {
    position: "absolute",
    right: -6,
    top: -6,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#EF4444",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  unreadText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});

export default MessageScreen;
