import {
  doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  serverTimestamp, collection, query, where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Subscription, CreateSubscriptionInput } from '@/types';

export async function getSubscriptionsByBusiness(businessId: string): Promise<Subscription[]> {
  const subsRef = collection(db, 'subscriptions');
  const q = query(subsRef, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Subscription)).sort((a, b) => ((b.createdAt as any)?.toMillis?.() ?? 0) - ((a.createdAt as any)?.toMillis?.() ?? 0));
}

export async function getSubscriptionsByCustomer(customerId: string): Promise<Subscription[]> {
  const subsRef = collection(db, 'subscriptions');
  const q = query(subsRef, where('customerId', '==', customerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Subscription)).sort((a, b) => ((b.createdAt as any)?.toMillis?.() ?? 0) - ((a.createdAt as any)?.toMillis?.() ?? 0));
}

export async function createSubscription(businessId: string, data: CreateSubscriptionInput) {
  const subRef = doc(collection(db, 'subscriptions'));
  await setDoc(subRef, {
    ...data,
    businessId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return subRef;
}

export async function updateSubscription(subscriptionId: string, data: Partial<Subscription>) {
  const subRef = doc(db, 'subscriptions', subscriptionId);
  await updateDoc(subRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getActiveSubscriptionByCustomer(customerId: string): Promise<Subscription | null> {
  const subsRef = collection(db, 'subscriptions');
  const q = query(
    subsRef,
    where('customerId', '==', customerId),
    where('status', '==', 'active'),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const sorted = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Subscription)).sort((a, b) => ((b.createdAt as any)?.toMillis?.() ?? 0) - ((a.createdAt as any)?.toMillis?.() ?? 0));
  return sorted[0];
}

export async function deleteSubscription(subscriptionId: string) {
  await deleteDoc(doc(db, 'subscriptions', subscriptionId));
}
