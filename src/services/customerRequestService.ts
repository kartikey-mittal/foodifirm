import {
  doc, setDoc, getDoc, getDocs, updateDoc, serverTimestamp, collection, query, where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { CustomerRequest, CreateCustomerRequestInput } from '@/types';

export async function getRequestsByBusiness(businessId: string): Promise<CustomerRequest[]> {
  const reqsRef = collection(db, 'customerRequests');
  const q = query(reqsRef, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CustomerRequest)).sort((a, b) => ((b.createdAt as any)?.toMillis?.() ?? 0) - ((a.createdAt as any)?.toMillis?.() ?? 0));
}

export async function getRequestsByCustomer(customerId: string): Promise<CustomerRequest[]> {
  const reqsRef = collection(db, 'customerRequests');
  const q = query(reqsRef, where('customerId', '==', customerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CustomerRequest)).sort((a, b) => ((b.createdAt as any)?.toMillis?.() ?? 0) - ((a.createdAt as any)?.toMillis?.() ?? 0));
}

export async function createCustomerRequest(
  businessId: string,
  businessSlug: string,
  customerId: string,
  userId: string,
  data: CreateCustomerRequestInput,
) {
  const reqRef = doc(collection(db, 'customerRequests'));
  await setDoc(reqRef, {
    ...data,
    businessId,
    businessSlug,
    customerId,
    userId,
    status: 'pending',
    requestedDate: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return reqRef;
}

export async function updateRequestStatus(requestId: string, status: CustomerRequest['status']) {
  const reqRef = doc(db, 'customerRequests', requestId);
  await updateDoc(reqRef, { status, updatedAt: serverTimestamp() });
}

export async function deleteCustomerRequest(requestId: string) {
  const reqRef = doc(db, 'customerRequests', requestId);
  await updateDoc(reqRef, { deleted: true, updatedAt: serverTimestamp() });
}
