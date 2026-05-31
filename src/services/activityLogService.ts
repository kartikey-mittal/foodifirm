import {
  doc, setDoc, serverTimestamp, collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { ActivityLog } from '@/types';

export async function createActivityLog(data: Partial<ActivityLog>) {
  const logRef = doc(collection(db, 'activityLogs'));
  await setDoc(logRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return logRef;
}

export async function getActivityLogsByBusiness(businessId: string): Promise<ActivityLog[]> {
  const logsRef = collection(db, 'activityLogs');
  const q = query(logsRef, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityLog)).sort((a, b) => ((b.createdAt as any)?.toMillis?.() ?? 0) - ((a.createdAt as any)?.toMillis?.() ?? 0));
}
