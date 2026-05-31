import { doc, setDoc, getDocs, updateDoc, serverTimestamp, collection, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { ServicePause } from '@/types';

export async function getServicePausesByBusiness(businessId: string): Promise<ServicePause[]> {
  const ref = collection(db, 'servicePauses');
  const q = query(ref, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServicePause));
}

export async function getServicePausesByCustomer(customerId: string): Promise<ServicePause[]> {
  const ref = collection(db, 'servicePauses');
  const q = query(ref, where('customerId', '==', customerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServicePause));
}

export async function getActivePausesByBusiness(businessId: string): Promise<ServicePause[]> {
  const ref = collection(db, 'servicePauses');
  const q = query(ref, where('businessId', '==', businessId), where('status', '==', 'active'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServicePause));
}

export async function createServicePause(data: {
  businessId: string; customerId: string; subscriptionId: string;
  fromDate: string; toDate: string; reason: string; createdFromRequestId: string;
}) {
  const ref = doc(collection(db, 'servicePauses'));
  await setDoc(ref, {
    ...data,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref;
}

export async function completeServicePause(pauseId: string) {
  const ref = doc(db, 'servicePauses', pauseId);
  await updateDoc(ref, { status: 'completed', updatedAt: serverTimestamp() });
}
