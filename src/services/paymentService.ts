import {
  doc, getDocs, collection, query, where, runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Invoice, Payment, PaymentMode } from '@/types';

export async function getPaymentsByBusiness(businessId: string): Promise<Payment[]> {
  const paymentsRef = collection(db, 'payments');
  const q = query(paymentsRef, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Payment)).sort((a, b) => ((b.createdAt as any)?.toMillis?.() ?? 0) - ((a.createdAt as any)?.toMillis?.() ?? 0));
}

export async function createPayment(
  businessId: string,
  data: {
    customerId: string;
    invoiceId: string;
    amount: number;
    paymentMode: PaymentMode;
    paymentDate: string;
    note?: string;
  }
) {
  const paymentRef = doc(collection(db, 'payments'));

  await runTransaction(db, async (transaction) => {
    const invoiceRef = doc(db, 'invoices', data.invoiceId);
    const invoiceSnap = await transaction.get(invoiceRef);
    if (!invoiceSnap.exists()) throw new Error('Invoice not found');

    const invoice = invoiceSnap.data() as Invoice;
    const newPaidAmount = (invoice.paidAmount || 0) + data.amount;
    const newPendingAmount = invoice.totalAmount - newPaidAmount;

    let status: Invoice['status'];
    if (newPendingAmount <= 0) {
      status = 'paid';
    } else if (newPaidAmount > 0) {
      status = 'partial';
    } else {
      const due = invoice.dueDate?.toDate ? invoice.dueDate.toDate() : new Date(invoice.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      status = due < today ? 'overdue' : 'pending';
    }

    transaction.set(paymentRef, {
      ...data,
      businessId,
      paymentStatus: 'success',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(invoiceRef, {
      paidAmount: newPaidAmount,
      pendingAmount: newPendingAmount,
      status,
      updatedAt: serverTimestamp(),
    });

    const customerRef = doc(db, 'customers', data.customerId);
    transaction.update(customerRef, {
      paymentStatus: status,
      updatedAt: serverTimestamp(),
    });
  });

  return { id: paymentRef.id };
}
