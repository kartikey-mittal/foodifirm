import {
  doc, setDoc, getDocs, updateDoc,
  serverTimestamp, collection, query, where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { SystemAlert, AppNotification } from '@/types';

export async function getSystemAlerts(businessId: string): Promise<SystemAlert[]> {
  const alertsRef = collection(db, 'systemAlerts');
  const q = query(alertsRef, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SystemAlert)).sort((a, b) => ((b.createdAt as any)?.toMillis?.() ?? 0) - ((a.createdAt as any)?.toMillis?.() ?? 0));
}

export async function getNotificationsByBusiness(businessId: string): Promise<AppNotification[]> {
  const notifsRef = collection(db, 'notifications');
  const q = query(notifsRef, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification)).sort((a, b) => ((b.createdAt as any)?.toMillis?.() ?? 0) - ((a.createdAt as any)?.toMillis?.() ?? 0));
}

export async function createNotification(businessId: string, data: Partial<AppNotification>) {
  const notifRef = doc(collection(db, 'notifications'));
  await setDoc(notifRef, {
    ...data,
    businessId,
    status: data.status || 'sent',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return notifRef;
}

export async function createSystemAlert(businessId: string, data: Partial<SystemAlert>) {
  const alertRef = doc(collection(db, 'systemAlerts'));
  await setDoc(alertRef, {
    ...data,
    businessId,
    isRead: false,
    createdAt: serverTimestamp(),
  });
  return alertRef;
}

export async function markAlertRead(alertId: string) {
  const alertRef = doc(db, 'systemAlerts', alertId);
  await updateDoc(alertRef, { isRead: true });
}

export async function getUnreadAlertCount(businessId: string): Promise<number> {
  const alertsRef = collection(db, 'systemAlerts');
  const q = query(alertsRef, where('businessId', '==', businessId), where('isRead', '==', false));
  const snap = await getDocs(q);
  return snap.size;
}
