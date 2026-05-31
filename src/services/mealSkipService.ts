import { doc, setDoc, getDocs, updateDoc, serverTimestamp, collection, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { MealSkip } from '@/types';

export async function getMealSkipsByBusiness(businessId: string): Promise<MealSkip[]> {
  const ref = collection(db, 'mealSkips');
  const q = query(ref, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MealSkip));
}

export async function getMealSkipsByCustomer(customerId: string): Promise<MealSkip[]> {
  const ref = collection(db, 'mealSkips');
  const q = query(ref, where('customerId', '==', customerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MealSkip));
}

export async function getMealSkipsByDate(businessId: string, date: string): Promise<MealSkip[]> {
  const ref = collection(db, 'mealSkips');
  const q = query(ref, where('businessId', '==', businessId), where('skipDate', '==', date));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MealSkip));
}

export async function createMealSkip(data: {
  businessId: string; customerId: string; subscriptionId: string;
  skipDate: string; mealType: 'breakfast' | 'lunch' | 'dinner';
  reason: string; createdFromRequestId: string;
}) {
  const ref = doc(collection(db, 'mealSkips'));
  await setDoc(ref, {
    ...data,
    status: 'approved',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref;
}
