import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit,
  Timestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';

export interface NotificationData {
  id?: string;
  userId: string;
  role: 'user' | 'officer';
  title: string;
  message: string;
  type: 'new_complaint' | 'status_update';
  complaintId: string;
  isRead: boolean;
  createdAt: string;
}

class NotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    
    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  showBrowserNotification(title: string, body: string, icon?: string) {
    if (this.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/logo.png',
      });
    }
  }

  async createNotification(data: Omit<NotificationData, 'id' | 'isRead' | 'createdAt'>) {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...data,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  listenToNotifications(userId: string, role: 'user' | 'officer', onNewNotification: (notification: NotificationData) => void) {
    // Listen for notifications for this specific user OR for all officers if user is an officer
    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [userId, 'all_officers']),
      where('role', '==', role),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    let isInitialLoad = true;

    return onSnapshot(q, (snapshot) => {
      if (isInitialLoad) {
        isInitialLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = { id: change.doc.id, ...change.doc.data() } as NotificationData;
          onNewNotification(data);
        }
      });
    });
  }

  async markAsRead(notificationId: string) {
    try {
      const docRef = doc(db, 'notifications', notificationId);
      await updateDoc(docRef, { isRead: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
}

export const notificationService = new NotificationService();
