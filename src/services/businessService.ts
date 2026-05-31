import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Business } from '@/types';
import { generateUniqueBusinessSlug } from '@/utils/slug';

export async function createBusiness(ownerId: string, data: Partial<Business>) {
  const slug = await generateUniqueBusinessSlug(data.businessName || 'Store');
  const businessRef = doc(collection(db, 'businesses'));
  await setDoc(businessRef, {
    ...data,
    storeId: businessRef.id,
    slug,
    ownerId,
    isActive: true,
    currency: data.currency || 'INR',
    timezone: data.timezone || 'Asia/Kolkata',
    subscriptionPlan: 'premium',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { ref: businessRef, slug };
}

export async function getBusinessByOwnerId(ownerId: string): Promise<Business | null> {
  const businessesRef = collection(db, 'businesses');
  const q = query(businessesRef, where('ownerId', '==', ownerId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Business;
}

export async function getBusinessById(businessId: string): Promise<Business | null> {
  const businessRef = doc(db, 'businesses', businessId);
  const snap = await getDoc(businessRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Business;
}

export async function getBusinessBySlug(slug: string): Promise<Business | null> {
  const businessesRef = collection(db, 'businesses');

  // Try slug lookup first
  const q = query(businessesRef, where('slug', '==', slug), where('isActive', '==', true), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as Business;
  }

  // Fallback: try as document ID (for existing businesses without slug)
  try {
    const docRef = doc(db, 'businesses', slug);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Auto-set storeId and slug if missing (backward compat)
      const updates: Record<string, any> = {};
      if (!data.storeId) updates.storeId = docSnap.id;
      if (!data.slug) updates.slug = slug;
      if (Object.keys(updates).length) {
        await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
      }
      return { id: docSnap.id, ...data, ...updates } as Business;
    }
  } catch { /* ignore */ }

  return null;
}

export async function updateBusiness(businessId: string, data: Partial<Business>) {
  const businessRef = doc(db, 'businesses', businessId);
  await updateDoc(businessRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function updateBusinessSlug(businessId: string, slug: string) {
  const businessRef = doc(db, 'businesses', businessId);
  await updateDoc(businessRef, { storeId: businessId, slug, updatedAt: serverTimestamp() });
}
