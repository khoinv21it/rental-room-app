import React, { useEffect, useState, useCallback, useRef } from "react";
import { URL_IMAGE } from "../Services/Constants";
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
  Linking,
} from "react-native";
import {
  fetchMessages,
  sendTextMessage,
  sendImageMessage,
  markConversationRead,
} from "../Services/ChatService";
import useAuthStore from "../Stores/useAuthStore";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

interface ChatViewProps {
  conversationId: string;
  partnerId: string;
  partnerName?: string;
  partnerAvatar?: string;
  onClose?: () => void;
  showHeader?: boolean; // Show header with partner info and back button
  initialMessage?: string; // Optional initial message to send when opening chat
}

// Helper component to render text with clickable links
const MessageText = ({ text, style }: { text: string; style: any }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Lỗi", "Không thể mở URL này");
      }
    } catch (error) {
      console.error("Lỗi khi mở URL:", error);
      Alert.alert("Lỗi", "Không thể mở liên kết");
    }
  };

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <Text
              key={index}
              style={[
                style,
                { textDecorationLine: "underline", fontWeight: "700" },
              ]}
              onPress={() => handleLinkPress(part)}
            >
              {part}
            </Text>
          );
        }
        return <Text key={index}>{part}</Text>;
      })}
    </Text>
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

  const avatarUri = partnerAvatar
    ? typeof partnerAvatar === "string" && partnerAvatar.startsWith("http")
      ? partnerAvatar
      : partnerAvatar
    : null;

  if (!me) {
    const imageUri =
      m.messageType === "image" && m.imageUrl
        ? m.imageUrl.startsWith("http")
          ? m.imageUrl
          : `${URL_IMAGE}${m.imageUrl}`
        : null;

    return (
      <View style={[styles.row, { alignItems: "flex-end", marginVertical: 6 }]}>
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
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            ) : (
              <MessageText text={m.text} style={styles.bubbleTextThem} />
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

  const imageUri =
    m.messageType === "image" && m.imageUrl
      ? m.imageUrl.startsWith("http")
        ? m.imageUrl
        : `${URL_IMAGE}${m.imageUrl}`
      : null;

  return (
    <Pressable
      onPress={onToggle}
      style={[styles.bubbleContainer, { alignItems: "flex-end" }]}
    >
      <View style={[styles.bubble, styles.bubbleMe]}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        ) : (
          <MessageText text={m.text} style={styles.bubbleTextMe} />
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

export const ChatView: React.FC<ChatViewProps> = ({
  conversationId,
  partnerId,
  partnerName = "User",
  partnerAvatar,
  onClose,
  showHeader = true,
  initialMessage,
}) => {
  const currentUser = useAuthStore((s: any) => s.loggedInUser);
  const userId = currentUser?.id;
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [initialMessageSent, setInitialMessageSent] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const loadMessages = useCallback(
    async (convId: string) => {
      if (!userId) return;
      setLoadingMsgs(true);
      try {
        const res: any = await fetchMessages(userId, convId, 0, 200);
        const msgs = res?.content || [];
        setMessages(msgs);
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
    if (partnerId && userId) {
      loadMessages(partnerId);
      // Mark conversation as read
      markConversationRead(userId, partnerId).catch((err) =>
        console.warn("markConversationRead failed", err)
      );
    }
  }, [partnerId, userId, loadMessages]);

  // Send initial message if provided (only once)
  useEffect(() => {
    const sendInitialMessage = async () => {
      if (
        initialMessage &&
        userId &&
        partnerId &&
        !initialMessageSent &&
        messages.length === 0
      ) {
        try {
          setInitialMessageSent(true);
          await sendTextMessage(userId, partnerId, initialMessage);
        } catch (error) {
          console.error("Error sending initial message:", error);
        }
      }
    };

    // Wait a bit for messages to load first
    const timer = setTimeout(() => {
      sendInitialMessage();
    }, 500);

    return () => clearTimeout(timer);
  }, [initialMessage, userId, partnerId, initialMessageSent, messages.length]);

  // Realtime listener for messages
  useEffect(() => {
    if (!userId || !partnerId) return;

    const { db } = require("../lib/firebase");
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allMsgs: any[] = [];
        snapshot.forEach((doc) => {
          const data: any = doc.data();
          if (
            (data.senderId === userId && data.recipientId === partnerId) ||
            (data.senderId === partnerId && data.recipientId === userId)
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
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
      },
      (error) => {
        console.error("ChatView realtime listener error:", error);
      }
    );

    return () => unsubscribe();
  }, [userId, partnerId]);

  const doSend = async () => {
    if (!text.trim() || !userId || !partnerId) return;
    setSending(true);
    try {
      await sendTextMessage(userId, partnerId, text);
      setText("");
    } catch (e) {
      console.warn(e);
    } finally {
      setSending(false);
    }
  };

  const pickImageAndSend = async () => {
    if (!userId || !partnerId) return;
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

      const uri = (result as any)?.assets?.[0]?.uri ?? (result as any)?.uri;
      if (!uri || result.canceled) return;

      setUploadingImage(true);
      await sendImageMessage(userId, partnerId, uri);
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

  const formatFullDate = (d: any) => {
    if (!d) return "";
    const date = d instanceof Date ? d : new Date(d);
    try {
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

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.chatHeader}>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Text style={styles.backText}>{"<"}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.chatHeaderInfo}>
            <View style={styles.chatAvatar}>
              {partnerAvatar ? (
                <Image
                  source={{
                    uri: partnerAvatar.startsWith("http")
                      ? partnerAvatar
                      : partnerAvatar,
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
              {partnerName}
            </Text>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {loadingMsgs ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item, index }) => {
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
                    partnerAvatar={partnerAvatar}
                    expanded={expandedIds.has(item.id)}
                    onToggle={() => toggleExpanded(item.id)}
                    showAvatar={isLastInGroup}
                  />
                </>
              );
            }}
            contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="message-text-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
                <Text style={styles.emptySubText}>
                  Bắt đầu cuộc trò chuyện với {partnerName}
                </Text>
              </View>
            }
          />
        )}

        <View style={styles.composer}>
          <TouchableOpacity
            style={[styles.imageBtn, uploadingImage ? { opacity: 0.6 } : null]}
            onPress={pickImageAndSend}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator color="#7c3aed" size="small" />
            ) : (
              <Icon name="image" size={20} color="#3b82f6" />
            )}
          </TouchableOpacity>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Viết tin nhắn..."
            placeholderTextColor="#9ca3af"
            style={styles.input}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!text.trim() || sending) && styles.sendBtnDisabled,
            ]}
            onPress={doSend}
            disabled={sending || !text.trim()}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Icon name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 17,
    color: "#6B7280",
    fontWeight: "700",
  },
  emptySubText: {
    marginTop: 6,
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
  },
  bubbleContainer: {
    marginVertical: 6,
    paddingHorizontal: 8,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: "100%",
  },
  bubbleThem: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bubbleMe: {
    backgroundColor: "#3B82F6",
    borderBottomRightRadius: 4,
    shadowColor: "#3B82F6",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bubbleTextThem: {
    fontSize: 15,
    lineHeight: 20,
    color: "#1F2937",
    fontWeight: "500",
  },
  bubbleTextMe: {
    fontSize: 15,
    lineHeight: 20,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  avatarSmallPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  avatarSmallSpacer: {
    width: 40,
  },
  timeText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
    fontWeight: "600",
  },
  dateSeparator: {
    alignItems: "center",
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: "#9CA3AF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    fontWeight: "700",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 4,
  },
  imageBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "500",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    shadowColor: "#3B82F6",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0.1,
  },
});
