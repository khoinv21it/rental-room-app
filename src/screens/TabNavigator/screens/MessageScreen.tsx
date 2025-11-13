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

  return (
    <View style={styles.container}>
      {/* Header for list or chat */}
      {!selected ? (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
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
          ) : (
            <FlatList
              data={conversations}
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
    backgroundColor: "#f9fafb",
  },

  // HEADER
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  chatHeaderMobile: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#0f172a",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    elevation: 2,
  },
  backBtn: {
    padding: 8,
    marginRight: 6,
  },
  backText: {
    fontSize: 20,
    color: "#3b82f6",
    fontWeight: "600",
  },
  chatHeaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  chatAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
    marginRight: 10,
    backgroundColor: "#f3f4f6",
  },
  chatAvatarImg: {
    width: "100%",
    height: "100%",
  },
  chatAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  chatHeaderTitle: {
    fontWeight: "700",
    fontSize: 17,
    color: "#fff",
    flexShrink: 1,
  },

  // CONVERSATION LIST
  listContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  convItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginVertical: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  convAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "visible",
    marginRight: 12,
  },
  convAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
  },
  convAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e5e7eb",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  convTitle: {
    fontWeight: "700",
    color: "#111827",
    fontSize: 15,
  },
  convLast: {
    color: "#6b7280",
    marginTop: 3,
    fontSize: 13,
  },
  convLastUnread: {
    color: "#111827",
    fontWeight: "700",
  },
  convTime: {
    color: "#9ca3af",
    fontSize: 12,
  },
  unreadBadge: {
    position: "absolute",
    right: -4,
    top: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  // CHAT BUBBLES
  bubbleContainer: {
    marginVertical: 6,
    maxWidth: "100%",
  },
  bubble: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginVertical: 0,
    maxWidth: "75%",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  bubbleMe: {
    backgroundColor: "#3b82f6",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: "#e5e7eb",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  bubbleTextMe: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
  },
  bubbleTextThem: {
    color: "#111827",
    fontSize: 15,
    lineHeight: 20,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: "#d1d5db",
  },
  timeText: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
    marginHorizontal: 6,
  },

  // COMPOSER
  composer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    borderTopColor: "#e5e7eb",
    borderTopWidth: 1,
    marginBottom: Platform.OS === "ios" ? 90 : 100,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: "#f9fafb",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#1e293b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  imageBtn: {
    marginRight: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#eef2ff",
    elevation: 1,
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
  },
  avatarSmallPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSmallSpacer: {
    width: 32,
    marginRight: 8,
  },
  dateSeparator: {
    alignSelf: "center",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 15,
    marginVertical: 8,
  },
  dateSeparatorText: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default MessageScreen;
