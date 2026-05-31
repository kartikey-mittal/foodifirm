import {
  doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  serverTimestamp, collection, query, where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from '@/types';

export async function getCustomersByBusiness(businessId: string): Promise<Customer[]> {
  const customersRef = collection(db, 'customers');
  const q = query(customersRef, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer)).sort((a, b) => ((b.createdAt as any)?.toMillis?.() ?? 0) - ((a.createdAt as any)?.toMillis?.() ?? 0));
}

export async function getCustomerById(customerId: string): Promise<Customer | null> {
  const customerRef = doc(db, 'customers', customerId);
  const snap = await getDoc(customerRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Customer;
}

export async function getCustomerByUserId(userId: string): Promise<Customer | null> {
  const customersRef = collection(db, 'customers');
  const q = query(customersRef, where('userId', '==', userId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Customer;
}

export async function getCustomerCount(businessId: string): Promise<number> {
  const customersRef = collection(db, 'customers');
  const q = query(customersRef, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  return snap.size;
}

export async function createCustomer(businessId: string, data: CreateCustomerInput) {
  const customerRef = doc(collection(db, 'customers'));
  const count = await getCustomerCount(businessId);
  const customerCode = `CUST-${String(count + 1001).padStart(4, '0')}`;
  await setDoc(customerRef, {
    ...data,
    businessId,
    customerCode,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: customerRef.id, customerCode };
}

export async function updateCustomer(customerId: string, data: UpdateCustomerInput) {
  const customerRef = doc(db, 'customers', customerId);
  await updateDoc(customerRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCustomer(customerId: string) {
  await updateDoc(doc(db, 'customers', customerId), {
    status: 'inactive',
    updatedAt: serverTimestamp(),
  });
}

export async function getCustomersByStatus(businessId: string, status: string): Promise<Customer[]> {
  const customersRef = collection(db, 'customers');
  const q = query(customersRef, where('businessId', '==', businessId), where('status', '==', status));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer));
}
