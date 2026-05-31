import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { AppUser } from '@/types';

export async function createUserProfile(uid: string, data: Partial<AppUser>) {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    ...data,
    uid,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return userRef;
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as AppUser;
}

export async function updateUserProfile(uid: string, data: Partial<AppUser>) {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as AppUser;
}
