import { db, storage } from "../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  setDoc,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import apiClient from "../lib/apiClient";
import { URL_IMAGE } from "./Constants";

async function getFullName(id: string) {
  try {
    const res: any = await apiClient.get(`/profile/getname/${id}`);
    // apiClient may return response.data or direct data depending on interceptor
    const data = res?.data ?? res;
    return data;
  } catch (error) {
    console.error("getFullName error (apiClient):", error);
    return { fullName: id, avatar: null };
  }
}

// Fetch list of conversations for a user by scanning messages and grouping by other user
export async function fetchConversations(userId: string, page = 0, size = 50) {
  try {
    if (!userId) return { content: [], page: 0, totalPages: 0 };
    console.debug("[ChatService] fetchConversations start", {
      userId,
      page,
      size,
    });

    // Fetch last-read timestamps for this user
    const lastReadMap = new Map<string, Date>();
    try {
      const rsQ = query(
        collection(db, "readStatuses"),
        where("userId", "==", userId)
      );
      const rsSnap = await getDocs(rsQ);
      rsSnap.docs.forEach((d) => {
        const data: any = d.data();
        if (data.conversationId && data.lastRead) {
          const ts = data.lastRead.toDate
            ? data.lastRead.toDate()
            : data.lastRead.seconds
            ? new Date(data.lastRead.seconds * 1000)
            : null;
          if (!ts) return;
          // Keep the latest timestamp per conversationId (in case of duplicates)
          const existing = lastReadMap.get(data.conversationId);
          if (!existing || existing.getTime() < ts.getTime()) {
            lastReadMap.set(data.conversationId, ts);
          }
        }
      });
      console.debug("[ChatService] fetchConversations readStatuses fetched", {
        count: lastReadMap.size,
      });
    } catch (err) {
      console.warn("[ChatService] failed to fetch readStatuses", err);
    }

    // Query messages where user is sender OR recipient by running two queries and merging
    const qSent = query(
      collection(db, "messages"),
      where("senderId", "==", userId)
    );
    const qReceived = query(
      collection(db, "messages"),
      where("recipientId", "==", userId)
    );

    const [snapSent, snapReceived] = await Promise.all([
      getDocs(qSent),
      getDocs(qReceived),
    ]);
    const allDocs = [...snapSent.docs, ...snapReceived.docs];
    console.debug("[ChatService] fetchConversations fetched docs", {
      sent: snapSent.docs.length,
      received: snapReceived.docs.length,
      total: allDocs.length,
    });

    const map = new Map<string, any>();
    const unreadCounts = new Map<string, number>();

    allDocs.forEach((d) => {
      const data: any = d.data();
      const other = data.senderId === userId ? data.recipientId : data.senderId;
      if (!other) return;
      const createdAt = data.createdAt?.toDate?.() ?? new Date(0);
      const existing = map.get(other);
      // keep the latest message for each conversation
      if (
        !existing ||
        (existing.lastMessage?.createdAt || new Date(0)) < createdAt
      ) {
        map.set(other, {
          id: other,
          lastMessage: {
            text: data.text ?? "",
            messageType: data.messageType ?? "text",
            createdAt,
          },
        });
      }

      // count unread messages directed to this user
      if (data.recipientId === userId && data.senderId !== userId) {
        const senderId = data.senderId;
        const lastRead = lastReadMap.get(senderId) || null;
        const msgTime = createdAt;
        if (!lastRead || msgTime > lastRead) {
          const cur = unreadCounts.get(senderId) || 0;
          unreadCounts.set(senderId, cur + 1);
        }
      }
    });

    const ids = Array.from(map.keys());
    console.debug("[ChatService] fetchConversations unique partners", {
      partners: ids,
    });
    const content: any[] = [];
    for (const id of ids) {
      const info = map.get(id);
      let profile = null;
      try {
        profile = await getFullName(id);
      } catch (err) {
        console.warn("[ChatService] getFullName failed for", id, err);
      }
      content.push({
        id,
        partner: {
          id,
          name: profile?.fullName || id,
          avatar: profile?.avatar
            ? profile.avatar.startsWith("http")
              ? profile.avatar
              : `${URL_IMAGE}${profile.avatar}`
            : null,
        },
        lastMessage: info.lastMessage,
        unreadCount: unreadCounts.get(id) || 0,
      });
    }

    console.debug("[ChatService] fetchConversations result count", {
      count: content.length,
    });
    return { content, page: 0, totalPages: 1 };
  } catch (error: any) {
    console.error(
      "fetchConversations firebase error:",
      error?.code ?? "no-code",
      error?.message ?? error
    );
    throw error;
  }
}

// Fetch messages between userId and otherId
export async function fetchMessages(
  userId: string,
  otherId: string,
  page = 0,
  size = 200
) {
  try {
    if (!userId || !otherId) return { content: [], page: 0, totalPages: 0 };
    console.debug("[ChatService] fetchMessages start", {
      userId,
      otherId,
      page,
      size,
    });

    // Query messages in both directions by running two queries
    const q1 = query(
      collection(db, "messages"),
      where("senderId", "==", userId),
      where("recipientId", "==", otherId)
    );
    const q2 = query(
      collection(db, "messages"),
      where("senderId", "==", otherId),
      where("recipientId", "==", userId)
    );

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const docs = [...snap1.docs, ...snap2.docs];
    console.debug("[ChatService] fetchMessages fetched docs", {
      dir1: snap1.docs.length,
      dir2: snap2.docs.length,
      total: docs.length,
    });

    const msgs: any[] = [];
    docs.forEach((d) => {
      const data: any = d.data();
      // ensure it's between these two users
      if (
        (data.senderId === userId && data.recipientId === otherId) ||
        (data.senderId === otherId && data.recipientId === userId)
      ) {
        msgs.push({
          id: d.id,
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

    // Debug: if there are any docs but no image messages detected, log raw doc samples
    try {
      const hasImage = msgs.some(
        (m) => m.messageType === "image" && m.imageUrl
      );
      if (!hasImage && docs.length > 0) {
        console.debug(
          "[ChatService] fetchMessages - no image messages after mapping; sample raw docs:",
          docs.slice(0, 3).map((d) => d.data())
        );
      }
    } catch (err) {
      console.warn("[ChatService] fetchMessages debug log failed", err);
    }

    // sort ascending by createdAt
    msgs.sort(
      (a, b) =>
        (a.createdAt?.getTime?.() || 0) - (b.createdAt?.getTime?.() || 0)
    );

    console.debug("[ChatService] fetchMessages result count", {
      count: msgs.length,
    });
    return { content: msgs, page: 0, totalPages: 1 };
  } catch (error) {
    console.error("fetchMessages firebase error:", error);
    throw error;
  }
}

// Send text message
export async function sendTextMessage(
  userId: string,
  otherId: string,
  text: string
) {
  try {
    const docRef = await addDoc(collection(db, "messages"), {
      text,
      senderId: userId,
      recipientId: otherId,
      createdAt: serverTimestamp(),
      messageType: "text",
    });
    return { id: docRef.id };
  } catch (error) {
    console.error("sendTextMessage error:", error);
    throw error;
  }
}

// Upload local file URI (react-native) to Firebase Storage and return download URL
async function uploadFileUriToStorage(localUri: string, path: string) {
  try {
    // fetch the file and convert to blob
    const response = await fetch(localUri);
    const blob = await response.blob();
    const ref = storageRef(storage, path);
    await uploadBytes(ref, blob);
    const url = await getDownloadURL(ref);
    return url;
  } catch (error) {
    console.error("uploadFileUriToStorage error:", error);
    throw error;
  }
}

// Send image message by uploading to Firebase Storage then adding message
export async function sendImageMessage(
  userId: string,
  otherId: string,
  localUri: string,
  fileName?: string
) {
  try {
    const path = `chat/${userId}_${Date.now()}_${fileName || "img"}`;
    const url = await uploadFileUriToStorage(localUri, path);
    const docRef = await addDoc(collection(db, "messages"), {
      imageUrl: url,
      imageFileName: fileName || path,
      senderId: userId,
      recipientId: otherId,
      createdAt: serverTimestamp(),
      messageType: "image",
    });
    return { id: docRef.id };
  } catch (error) {
    console.error("sendImageMessage error:", error);
    throw error;
  }
}

export async function markConversationRead(userId: string, otherId: string) {
  try {
    // Use deterministic document id so we update the same read status doc
    const id = `${userId}-${otherId}`;
    const ref = doc(db, "readStatuses", id);
    await setDoc(
      ref,
      {
        userId,
        conversationId: otherId,
        lastRead: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("markConversationRead error:", error);
  }
}

export async function deleteMessage(messageId: string) {
  try {
    await deleteDoc(doc(db, "messages", messageId));
  } catch (error) {
    console.error("deleteMessage error:", error);
    throw error;
  }
}
