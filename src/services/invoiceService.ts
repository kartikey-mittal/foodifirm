import {
  doc, setDoc, getDoc, getDocs, updateDoc,
  serverTimestamp, collection, query, where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Invoice, CreateInvoiceInput, Payment } from '@/types';

export async function getInvoicesByBusiness(businessId: string): Promise<Invoice[]> {
  const invoicesRef = collection(db, 'invoices');
  const q = query(invoicesRef, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invoice)).sort((a, b) => ((b.createdAt as any)?.toMillis?.() ?? 0) - ((a.createdAt as any)?.toMillis?.() ?? 0));
}

export async function getInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
  const invoicesRef = collection(db, 'invoices');
  const q = query(invoicesRef, where('customerId', '==', customerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invoice)).sort((a, b) => ((b.createdAt as any)?.toMillis?.() ?? 0) - ((a.createdAt as any)?.toMillis?.() ?? 0));
}

export async function createInvoice(businessId: string, data: CreateInvoiceInput) {
  const invoiceRef = doc(collection(db, 'invoices'));
  const invoiceNumber = `INV-${Date.now()}`;
  await setDoc(invoiceRef, {
    ...data,
    businessId,
    invoiceNumber,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: invoiceRef.id, invoiceNumber };
}

export async function updateInvoice(invoiceId: string, data: Partial<Invoice>) {
  const invoiceRef = doc(db, 'invoices', invoiceId);
  await updateDoc(invoiceRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
  const invoiceRef = doc(db, 'invoices', invoiceId);
  const snap = await getDoc(invoiceRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Invoice;
}

// Payments
export async function createPayment(businessId: string, data: Partial<Payment>) {
  const paymentRef = doc(collection(db, 'payments'));
  await setDoc(paymentRef, {
    ...data,
    businessId,
    paymentDate: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return paymentRef;
}
