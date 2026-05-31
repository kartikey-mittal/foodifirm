import { doc, setDoc, getDocs, updateDoc, serverTimestamp, collection, query, where, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { SystemAlert } from '@/types';

export async function getSystemAlerts(businessId: string): Promise<SystemAlert[]> {
  const ref = collection(db, 'systemAlerts');
  const q = query(ref, where('businessId', '==', businessId), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SystemAlert)).sort((a, b) => ((b.createdAt as any)?.toMillis?.() ?? 0) - ((a.createdAt as any)?.toMillis?.() ?? 0));
}

export async function getUnreadSystemAlerts(businessId: string): Promise<SystemAlert[]> {
  const ref = collection(db, 'systemAlerts');
  const q = query(ref, where('businessId', '==', businessId), where('isRead', '==', false), limit(20));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SystemAlert)).sort((a, b) => ((b.createdAt as any)?.toMillis?.() ?? 0) - ((a.createdAt as any)?.toMillis?.() ?? 0));
}

export async function markAlertRead(alertId: string) {
  const ref = doc(db, 'systemAlerts', alertId);
  await updateDoc(ref, { isRead: true });
}

export async function createSystemAlert(businessId: string, data: {
  title: string; message: string; category: SystemAlert['category']; priority: SystemAlert['priority'];
}) {
  const ref = doc(collection(db, 'systemAlerts'));
  await setDoc(ref, {
    businessId,
    title: data.title,
    message: data.message,
    category: data.category,
    isRead: false,
    priority: data.priority,
    createdAt: serverTimestamp(),
  });
  return ref;
}

export async function generateSubscriptionExpiryAlerts(businessId: string, subscriptions: { customerName?: string; endDate: any }[]) {
  const now = Date.now();
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  let count = 0;
  for (const sub of subscriptions) {
    const end = sub.endDate?.toDate ? sub.endDate.toDate().getTime() : new Date(sub.endDate).getTime();
    if (end > now && end - now <= threeDays) {
      await createSystemAlert(businessId, {
        title: 'Subscription Expiring Soon',
        message: `${sub.customerName || 'A customer'}'s subscription is expiring in ${Math.ceil((end - now) / (24 * 60 * 60 * 1000))} days.`,
        category: 'subscription',
        priority: 'high',
      });
      count++;
    }
  }
  return count;
}

export async function generatePaymentDueAlerts(businessId: string, invoices: { customerName?: string; dueDate: any; pendingAmount: number }[]) {
  const now = Date.now();
  let count = 0;
  for (const inv of invoices) {
    if (inv.pendingAmount <= 0) continue;
    const due = inv.dueDate?.toDate ? inv.dueDate.toDate().getTime() : new Date(inv.dueDate).getTime();
    if (due <= now) {
      await createSystemAlert(businessId, {
        title: 'Payment Overdue',
        message: `${inv.customerName || 'A customer'} has an overdue payment of ₹${inv.pendingAmount}.`,
        category: 'payment',
        priority: 'high',
      });
      count++;
    }
  }
  return count;
}
