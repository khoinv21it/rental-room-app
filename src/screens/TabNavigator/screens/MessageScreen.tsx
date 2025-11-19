import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Pressable,
} from "react-native";
import {
  fetchConversations,
  fetchMessages,
  sendTextMessage,
  markConversationRead,
  sendImageMessage,
} from "../../../Services/ChatService";
import useAuthStore from "../../../Stores/useAuthStore";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";

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
          {last?.text || ""}
        </Text>
      </View>
      <Text style={styles.convTime}>{formatTimestamp(last?.createdAt)}</Text>
    </TouchableOpacity>
  );
};

const MessageBubble = ({
  m,
  me,
  partnerAvatar,
  expanded,
  onToggle,
  showAvatar = true,
}: any) => {
  const formatTime = (d: Date | string | number | undefined | null) => {
    if (!d) return "";
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Normalize avatar uri
  const avatarUri = partnerAvatar
    ? typeof partnerAvatar === "string" && partnerAvatar.startsWith("http")
      ? partnerAvatar
      : partnerAvatar
    : null;

  // Debug log to check image url presence when rendering
  if (m?.messageType === "image") {
    try {
      console.log(
        "[MessageBubble] rendering image message id=",
        m.id,
        "imageUrl=",
        m.imageUrl
      );
    } catch (err) {
      console.log("[MessageBubble] log error", err);
    }
  }

  // For messages from others we show a small avatar on the left
  if (!me) {
    return (
      <View style={[styles.row, { alignItems: "flex-end", marginVertical: 6 }]}>
        {/* Show avatar or placeholder space */}
        {showAvatar ? (
          avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarSmall} />
          ) : (
            <View style={styles.avatarSmallPlaceholder}>
              <Icon name="account" size={20} color="#9ca3af" />
            </View>
          )
        ) : (
          <View style={styles.avatarSmallSpacer} />
        )}
        <Pressable onPress={onToggle} style={{ flex: 1, maxWidth: "75%" }}>
          <View style={[styles.bubble, styles.bubbleThem]}>
            {m.messageType === "image" && m.imageUrl ? (
              <Image
                source={{ uri: m.imageUrl }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.bubbleTextThem}>{m.text}</Text>
            )}
          </View>
          {expanded && (
            <Text
              style={[styles.timeText, { textAlign: "left", marginLeft: 8 }]}
            >
              {formatTime(m.createdAt)}
            </Text>
          )}
        </Pressable>
      </View>
    );
  }

  // For my messages (right side)
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.bubbleContainer, { alignItems: "flex-end" }]}
    >
      <View style={[styles.bubble, styles.bubbleMe]}>
        {m.messageType === "image" && m.imageUrl ? (
          <Image
            source={{ uri: m.imageUrl }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.bubbleTextMe}>{m.text}</Text>
        )}
      </View>
      {expanded && (
        <Text style={[styles.timeText, { textAlign: "right" }]}>
          {formatTime(m.createdAt)}
        </Text>
      )}
    </Pressable>
  );
};

const MessageScreen = () => {
  const currentUser = useAuthStore((s: any) => s.loggedInUser);
  const userId = currentUser?.id;
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const flatRef = useRef<FlatList>(null);
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

  const loadMessages = useCallback(
    async (convId: string) => {
      if (!userId) return;
      setLoadingMsgs(true);
      try {
        const res: any = await fetchMessages(userId, convId, 0, 200);
        const msgs = res?.content || [];
        setMessages(msgs);
        // Debug: log messages count and any image URLs
        try {
          const imageMsgs = msgs
            .filter((m: any) => m?.messageType === "image")
            .map((m: any) => ({ id: m.id, imageUrl: m.imageUrl }));
          console.log(
            "[MessageScreen] Loaded messages:",
            msgs.length,
            "imageMsgs:",
            imageMsgs
          );
        } catch (logErr) {
          console.log(
            "[MessageScreen] Loaded messages (logging failed):",
            logErr
          );
        }
        // scroll to bottom
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 200);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoadingMsgs(false);
      }
    },
    [userId]
  );

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

  useEffect(() => {
    if (selected?.id) loadMessages(selected.id);
  }, [selected, loadMessages]);

  // Realtime listener for messages in selected conversation
  useEffect(() => {
    if (!userId || !selected?.id) return;

    const { db } = require("../../../lib/firebase");
    // Listen to all messages ordered by createdAt, then filter client-side
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allMsgs: any[] = [];
        snapshot.forEach((doc) => {
          const data: any = doc.data();
          // Filter for messages between userId and selected.id
          if (
            (data.senderId === userId && data.recipientId === selected.id) ||
            (data.senderId === selected.id && data.recipientId === userId)
          ) {
            allMsgs.push({
              id: doc.id,
              text: data.text,
              imageUrl: data.imageUrl,
              imageFileName: data.imageFileName || null,
              messageType: data.messageType || "text",
              fromMe: data.senderId === userId,
              senderId: data.senderId,
              recipientId: data.recipientId,
              createdAt: data.createdAt?.toDate?.() ?? new Date(0),
            });
          }
        });
        setMessages(allMsgs);
        // Auto-scroll to bottom when new messages arrive
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
      },
      (error) => {
        console.error("Messages realtime listener error:", error);
      }
    );

    return () => unsubscribe();
  }, [userId, selected?.id]);

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

  const doSend = async () => {
    if (!text.trim() || !selected || !userId) return;
    setSending(true);
    try {
      await sendTextMessage(userId, selected.id, text);
      setText("");
      // Messages will update via realtime listener
      // Refresh conversations to update unread counts
      await loadConversations();
    } catch (e) {
      console.warn(e);
    } finally {
      setSending(false);
    }
  };

  // Pick image from device and send
  const pickImageAndSend = async () => {
    if (!userId || !selected) return;
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please allow access to your photos to send images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      // Newer Expo returns result.assets array
      const uri = (result as any)?.assets?.[0]?.uri ?? (result as any)?.uri;
      if (!uri || result.canceled) return;

      setUploadingImage(true);
      await sendImageMessage(userId, selected.id, uri);
      // Messages will update via realtime listener
      // Refresh conversations to update unread counts
      await loadConversations();
    } catch (err) {
      console.error("pickImageAndSend error", err);
      Alert.alert("Upload failed", "Could not send image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Helper to format full date/time for separators
  const formatFullDate = (d: any) => {
    if (!d) return "";
    const date = d instanceof Date ? d : new Date(d);
    try {
      // Example: Nov 01, 2025 — 13:17
      const opts: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      };
      return date.toLocaleString(undefined, opts).replace(",", " —");
    } catch (e) {
      return date.toLocaleString();
    }
  };

  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

  // Debug: log image messages whenever messages array updates
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    try {
      const imageMsgs = messages.filter((m: any) => m?.messageType == "image");
      if (imageMsgs.length > 0) {
        console.warn(
          "[MessageScreen][useEffect] image messages found count=",
          imageMsgs.length
        );
        imageMsgs.forEach((m: any, idx: number) => {
          console.warn(
            `[MessageScreen][image ${idx}] id=${m.id} senderId=${m.senderId} imageUrl=${m.imageUrl}`
          );
        });
      } else {
        console.log(
          "[MessageScreen][useEffect] no image messages in current list, total=",
          messages.length
        );
      }
    } catch (err) {
      console.error("[MessageScreen][useEffect] logging failed", err);
    }
  }, [messages]);

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
    <View style={styles.container}>
      {/* Header for list or chat */}
      {!selected ? (
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
      ) : (
        <View style={styles.chatHeaderMobile}>
          <TouchableOpacity onPress={handleBackToList} style={styles.backBtn}>
            <Text style={styles.backText}>{"<"}</Text>
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <View style={styles.chatAvatar}>
              {selected.partner?.avatar ? (
                <Image
                  source={{
                    uri: selected.partner.avatar.startsWith("http")
                      ? selected.partner.avatar
                      : selected.partner.avatar,
                  }}
                  style={styles.chatAvatarImg}
                />
              ) : (
                <View style={styles.chatAvatarPlaceholder}>
                  <Icon name="account" size={24} color="#9ca3af" />
                </View>
              )}
            </View>
            <Text style={styles.chatHeaderTitle} numberOfLines={1}>
              {selected.partner?.name ||
                selected.partner?.fullName ||
                "Unknown"}
            </Text>
          </View>
        </View>
      )}

      {/* Content */}
      {!selected ? (
        // Conversation list fullscreen
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
      ) : (
        // Chat view fullscreen
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item, index }) => {
              // show separator when first message or gap > 6 hours from previous message
              const prev = index > 0 ? messages[index - 1] : null;
              const prevTime = prev
                ? prev.createdAt instanceof Date
                  ? prev.createdAt.getTime()
                  : new Date(prev.createdAt).getTime()
                : 0;
              const currTime =
                item.createdAt instanceof Date
                  ? item.createdAt.getTime()
                  : new Date(item.createdAt).getTime();
              const showSeparator = !prev || currTime - prevTime > SIX_HOURS_MS;

              // Check if next message is from same sender
              const next =
                index < messages.length - 1 ? messages[index + 1] : null;
              const isLastInGroup = !next || next.fromMe !== item.fromMe;

              return (
                <>
                  {showSeparator && (
                    <View style={styles.dateSeparator}>
                      <Text style={styles.dateSeparatorText}>
                        {formatFullDate(item.createdAt)}
                      </Text>
                    </View>
                  )}
                  <MessageBubble
                    m={item}
                    me={item.fromMe}
                    partnerAvatar={selected?.partner?.avatar}
                    expanded={expandedIds.has(item.id)}
                    onToggle={() => toggleExpanded(item.id)}
                    showAvatar={isLastInGroup}
                  />
                </>
              );
            }}
            contentContainerStyle={{ padding: 12 }}
          />

          <View style={styles.composer}>
            <TouchableOpacity
              style={[
                styles.imageBtn,
                uploadingImage ? { opacity: 0.6 } : null,
              ]}
              onPress={pickImageAndSend}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <ActivityIndicator color="#7c3aed" />
              ) : (
                <Icon name="image" size={20} color="#3b82f6" />
              )}
            </TouchableOpacity>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Write a message..."
              style={styles.input}
              multiline
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={doSend}
              disabled={sending || !text.trim()}
            >
              <Icon name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
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
    paddingTop: 20,
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

  // CHAT BUBBLES - Modern Design
  bubbleContainer: {
    marginVertical: 4,
    maxWidth: "100%",
  },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginVertical: 0,
    maxWidth: "75%",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  bubbleMe: {
    backgroundColor: "#3B82F6",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: "#ffffff",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bubbleTextMe: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
  },
  bubbleTextThem: {
    color: "#1A1A2E",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
  },
  timeText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
    marginHorizontal: 8,
    fontWeight: "500",
  },

  // COMPOSER - Modern Design
  composer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderTopColor: "#E5E7EB",
    borderTopWidth: 1,
    marginBottom: Platform.OS === "ios" ? 90 : 100,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
    elevation: 3,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 120,
    backgroundColor: "#F9FAFB",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontWeight: "500",
    color: "#1A1A2E",
  },
  sendBtn: {
    marginLeft: 10,
    backgroundColor: "#3B82F6",
    padding: 12,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  imageBtn: {
    marginRight: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    shadowColor: "#3B82F6",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  avatarSmallPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  avatarSmallSpacer: {
    width: 32,
    marginRight: 8,
  },
  dateSeparator: {
    alignSelf: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  dateSeparatorText: {
    color: "#3B82F6",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});

export default MessageScreen;
