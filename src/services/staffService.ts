import { doc, setDoc, getDocs, updateDoc, serverTimestamp, collection, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { StaffMember } from '@/types';

export async function getStaffByBusiness(businessId: string): Promise<StaffMember[]> {
  const ref = collection(db, 'staffMembers');
  const q = query(ref, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StaffMember)).sort((a, b) => ((b.createdAt as any)?.toMillis?.() ?? 0) - ((a.createdAt as any)?.toMillis?.() ?? 0));
}

export async function createStaffMember(businessId: string, data: {
  fullName: string; email: string; phone: string; staffType: StaffMember['staffType']; notes?: string;
}) {
  const ref = doc(collection(db, 'staffMembers'));
  await setDoc(ref, {
    businessId,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    staffType: data.staffType,
    isActive: true,
    joinedAt: serverTimestamp(),
    notes: data.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref;
}

export async function updateStaffMember(staffId: string, data: Partial<StaffMember>) {
  const ref = doc(db, 'staffMembers', staffId);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}
