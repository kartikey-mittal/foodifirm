import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { BusinessStats } from '@/types';

export async function getBusinessStats(businessId: string): Promise<BusinessStats | null> {
  const statsRef = doc(db, 'businessStats', businessId);
  const snap = await getDoc(statsRef);
  if (!snap.exists()) return null;
  return { businessId: snap.id, ...snap.data() } as BusinessStats;
}

export async function createBusinessStats(businessId: string, data?: Partial<BusinessStats>) {
  const statsRef = doc(db, 'businessStats', businessId);
  await setDoc(statsRef, {
    businessId,
    totalRevenue: 0,
    activeCustomers: 0,
    newCustomersThisWeek: 0,
    activeSubscriptions: 0,
    pendingPayments: 0,
    deliveriesToday: 0,
    activeDrivers: 0,
    areasCovered: 0,
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function updateBusinessStats(businessId: string, data: Partial<BusinessStats>) {
  const statsRef = doc(db, 'businessStats', businessId);
  await updateDoc(statsRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function recalculateBusinessStats(businessId: string) {
  const { getCustomersByBusiness } = await import('./customerService');
  const { getSubscriptionsByBusiness } = await import('./subscriptionService');
  const { getInvoicesByBusiness } = await import('./invoiceService');
  const { getDriversByBusiness, getDeliveryAreas } = await import('./deliveryService');
  const { getDailyMealOrders } = await import('./dailyMealOrderService');
  const { getRequestsByBusiness } = await import('./customerRequestService');

  const [customers, subscriptions, invoices, drivers, areas, todayOrders, requests] = await Promise.all([
    getCustomersByBusiness(businessId),
    getSubscriptionsByBusiness(businessId),
    getInvoicesByBusiness(businessId),
    getDriversByBusiness(businessId),
    getDeliveryAreas(businessId),
    getDailyMealOrders(businessId, new Date().toISOString().split('T')[0]),
    getRequestsByBusiness(businessId),
  ]);

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const stats = {
    totalRevenue: invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0),
    activeCustomers: customers.filter((c) => c.status === 'active').length,
    newCustomersThisWeek: customers.filter((c) => {
      const created = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      return created >= weekStart;
    }).length,
    activeSubscriptions: subscriptions.filter((s) => s.status === 'active').length,
    pendingPayments: invoices.filter((i) => i.status === 'pending' || i.status === 'overdue').length,
    deliveriesToday: todayOrders.length,
    activeDrivers: drivers.filter((d) => d.isActive).length,
    areasCovered: areas.filter((a) => a.isActive).length,
    todaysMeals: todayOrders.length,
    pendingRequests: requests.filter((r) => r.status === 'pending').length,
    pendingApprovals: customers.filter((c) => c.status === 'pending_approval').length,
    failedDeliveries: todayOrders.filter((o) => o.status === 'failed').length,
    updatedAt: serverTimestamp(),
  };

  const statsRef = doc(db, 'businessStats', businessId);
  await setDoc(statsRef, { ...stats, businessId }, { merge: true });
  return stats;
}
