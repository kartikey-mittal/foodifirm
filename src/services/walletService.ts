import {
  doc, setDoc, getDocs, updateDoc, increment,
  serverTimestamp, collection, query, where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { WalletTransaction } from '@/types';

export async function addMoneyToWallet(
  businessId: string,
  customerId: string,
  amount: number,
  source: string,
): Promise<void> {
  const txnRef = doc(collection(db, 'walletTransactions'));
  await setDoc(txnRef, {
    businessId,
    customerId,
    amount,
    type: 'credit',
    source,
    description: `Added ₹${amount} via ${source}`,
    createdAt: serverTimestamp(),
  });

  const customerRef = doc(db, 'customers', customerId);
  await updateDoc(customerRef, {
    walletBalance: increment(amount),
    updatedAt: serverTimestamp(),
  });
}

export async function getWalletTransactions(customerId: string): Promise<WalletTransaction[]> {
  const ref = collection(db, 'walletTransactions');
  const q = query(ref, where('customerId', '==', customerId));
  const snap = await getDocs(q);
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WalletTransaction));
  return data.sort((a, b) => {
    const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
    const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
    return bTime - aTime;
  });
}
