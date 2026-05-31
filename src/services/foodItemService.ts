import {
  doc, setDoc, getDoc, getDocs, updateDoc,
  serverTimestamp, collection, query, where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { FoodItem, CreateFoodItemInput } from '@/types';

export async function getFoodItemsByBusiness(businessId: string): Promise<FoodItem[]> {
  const itemsRef = collection(db, 'foodItems');
  const q = query(itemsRef, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FoodItem));
}

export async function getFoodItemById(itemId: string): Promise<FoodItem | null> {
  const itemRef = doc(db, 'foodItems', itemId);
  const snap = await getDoc(itemRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as FoodItem;
}

export async function createFoodItem(businessId: string, data: CreateFoodItemInput) {
  const itemRef = doc(collection(db, 'foodItems'));
  await setDoc(itemRef, {
    ...data,
    businessId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return itemRef;
}

export async function updateFoodItem(itemId: string, data: Partial<FoodItem>) {
  const itemRef = doc(db, 'foodItems', itemId);
  await updateDoc(itemRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function toggleFoodItemAvailability(itemId: string, isAvailable: boolean) {
  const itemRef = doc(db, 'foodItems', itemId);
  await updateDoc(itemRef, { isAvailable, updatedAt: serverTimestamp() });
}

