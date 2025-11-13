import { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../Stores/useAuthStore';
import Toast from 'react-native-toast-message';

export const useNotifications = () => {
  const { loggedInUser } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const hasShownInitialRef = useRef(false);

  useEffect(() => {
    if (!loggedInUser?.id) {
      console.log('❌ No logged in user');
      setUnreadCount(0);
      return;
    }

    console.log('✅ Setting up notification listener for user:', loggedInUser.id);

    // Lắng nghe notifications của user
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('receiverId', '==', loggedInUser.id),
      where('isRead', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Đếm số thông báo chưa đọc
      const unread = snapshot.docs.length;
      console.log('📊 Unread notifications count:', unread);
      setUnreadCount(unread);

      // Hiển thị toast cho notifications mới (sau khi app đã khởi động)
      if (!hasShownInitialRef.current) {
        hasShownInitialRef.current = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          console.log('🔔 New notification:', data);
          
          Toast.show({
            type: 'info',
            text1: data.title || 'The new notification',
            text2: data.message || '',
            position: 'top',
            visibilityTime: 4000,
            autoHide: true,
            topOffset: 50,
          });
        }
      });
    });

    return () => unsubscribe();
  }, [loggedInUser?.id]);

  return { unreadCount };
};
