import {
  doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  serverTimestamp, collection, query, where, Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { DailyMealOrder, MealSkip, ServicePause, Customer, Subscription, MealPlan } from '@/types';
import { getCustomersByBusiness } from './customerService';
import { getSubscriptionsByBusiness } from './subscriptionService';
import { getDeliveryAreas } from './deliveryService';

function mealPlanToMeals(plan: MealPlan): ('breakfast' | 'lunch' | 'dinner')[] {
  switch (plan) {
    case 'breakfast': return ['breakfast'];
    case 'lunch': return ['lunch'];
    case 'dinner': return ['dinner'];
    case 'breakfast_lunch': return ['breakfast', 'lunch'];
    case 'lunch_dinner': return ['lunch', 'dinner'];
    case 'all_meals': return ['breakfast', 'lunch', 'dinner'];
    default: return ['lunch', 'dinner'];
  }
}

function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr);
  const day = d.getDay();
  return day === 0 || day === 6;
}

function dateInRange(dateStr: string, start: any, end: any): boolean {
  const d = new Date(dateStr).getTime();
  const s = start?.toDate ? start.toDate().getTime() : new Date(start).getTime();
  const e = end?.toDate ? end.toDate().getTime() : new Date(end).getTime();
  return d >= s && d <= e;
}

export async function generateDailyMealOrders(businessId: string, date: string): Promise<{ created: number; skipped: number; paused: number }> {
  const [customers, subscriptions, areas, mealSkipsSnap, pausesSnap] = await Promise.all([
    getCustomersByBusiness(businessId),
    getSubscriptionsByBusiness(businessId),
    getDeliveryAreas(businessId),
    getDocs(query(collection(db, 'mealSkips'), where('businessId', '==', businessId), where('skipDate', '==', date))),
    getDocs(query(collection(db, 'servicePauses'), where('businessId', '==', businessId), where('status', '==', 'active'))),
  ]);

  const mealSkips: MealSkip[] = mealSkipsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as MealSkip));
  const pauses: ServicePause[] = pausesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ServicePause));
  const areaMap: Record<string, { id: string; areaName: string }> = {};
  areas.forEach((a) => { areaMap[a.id] = { id: a.id, areaName: a.areaName }; });

  let created = 0, skipped = 0, paused = 0;

  for (const sub of subscriptions) {
    const customer = customers.find((c) => c.id === sub.customerId);
    if (!customer || customer.status !== 'active') continue;
    if (sub.status !== 'active') continue;
    if (!dateInRange(date, sub.startDate, sub.endDate)) continue;
    const activePause = pauses.find((p) =>
      p.customerId === sub.customerId &&
      dateInRange(date, p.fromDate, p.toDate)
    );
    if (activePause) { paused++; continue; }

    const meals = mealPlanToMeals(sub.mealPlan);

    for (const mealType of meals) {
      const skipMatch = mealSkips.find((s) =>
        s.customerId === sub.customerId &&
        s.mealType === mealType &&
        s.status === 'approved'
      );

      const areaInfo = areaMap[customer.area] || { id: '', areaName: customer.area };
      const orderRef = doc(collection(db, 'dailyMealOrders'));

      if (skipMatch) {
        await setDoc(orderRef, {
          businessId,
          businessSlug: '',
          customerId: customer.id,
          customerName: customer.fullName,
          customerPhone: customer.phone,
          customerCode: customer.customerCode,
          subscriptionId: sub.id,
          deliveryAreaId: areaInfo.id,
          deliveryAreaName: areaInfo.areaName,
          deliveryDate: date,
          mealType,
          mealItems: [],
          mealPlan: sub.mealPlan,
          addressSnapshot: customer.address,
          status: 'skipped',
          paymentStatusSnapshot: customer.paymentStatus,
          specialNotes: customer.specialNotes || '',
          createdFrom: 'subscription',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        skipped++;
        continue;
      }

      await setDoc(orderRef, {
        businessId,
        businessSlug: '',
        customerId: customer.id,
        customerName: customer.fullName,
        customerPhone: customer.phone,
        customerCode: customer.customerCode,
        subscriptionId: sub.id,
        deliveryAreaId: areaInfo.id,
        deliveryAreaName: areaInfo.areaName,
        deliveryDate: date,
        mealType,
        mealItems: [],
        mealPlan: sub.mealPlan,
        addressSnapshot: customer.address,
        status: 'scheduled',
        paymentStatusSnapshot: customer.paymentStatus,
        specialNotes: customer.specialNotes || '',
        createdFrom: 'subscription',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      created++;
    }
  }

  return { created, skipped, paused };
}

export async function getDailyMealOrders(businessId: string, date: string): Promise<DailyMealOrder[]> {
  const ref = collection(db, 'dailyMealOrders');
  const q = query(ref, where('businessId', '==', businessId), where('deliveryDate', '==', date));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DailyMealOrder)).sort((a, b) => a.mealType.localeCompare(b.mealType));
}

export async function getDailyMealOrdersByMealType(businessId: string, date: string, mealType: string): Promise<DailyMealOrder[]> {
  const ref = collection(db, 'dailyMealOrders');
  const q = mealType === 'all'
    ? query(ref, where('businessId', '==', businessId), where('deliveryDate', '==', date))
    : query(ref, where('businessId', '==', businessId), where('deliveryDate', '==', date), where('mealType', '==', mealType));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DailyMealOrder)).sort((a, b) => a.mealType.localeCompare(b.mealType));
}

export async function getDailyMealOrdersByDriver(businessId: string, driverId: string, date: string): Promise<DailyMealOrder[]> {
  const ref = collection(db, 'dailyMealOrders');
  const q = query(ref, where('businessId', '==', businessId), where('driverId', '==', driverId), where('deliveryDate', '==', date));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DailyMealOrder));
}

export async function updateDailyMealOrderStatus(orderId: string, status: DailyMealOrder['status']) {
  const ref = doc(db, 'dailyMealOrders', orderId);
  const updates: any = { status, updatedAt: serverTimestamp() };
  if (status === 'delivered') updates.deliveredAt = serverTimestamp();
  await updateDoc(ref, updates);
}

export async function markMealDelivered(orderId: string) {
  await updateDailyMealOrderStatus(orderId, 'delivered');
}

export async function markMealSkipped(orderId: string) {
  await updateDailyMealOrderStatus(orderId, 'skipped');
}

export async function assignDriverToOrder(orderId: string, driverId: string) {
  const ref = doc(db, 'dailyMealOrders', orderId);
  await updateDoc(ref, { driverId, updatedAt: serverTimestamp() });
}

export async function bulkAssignDriver(orderIds: string[], driverId: string) {
  const promises = orderIds.map((id) => assignDriverToOrder(id, driverId));
  await Promise.all(promises);
}

export async function bulkUpdateStatus(orderIds: string[], status: DailyMealOrder['status']) {
  const promises = orderIds.map((id) => updateDailyMealOrderStatus(id, status));
  await Promise.all(promises);
}

export async function createManualDailyMealOrder(data: Partial<DailyMealOrder>) {
  const ref = doc(collection(db, 'dailyMealOrders'));
  await setDoc(ref, {
    ...data,
    createdFrom: 'manual',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref;
}

// Summary helpers
export function calculateDailyMealSummary(orders: DailyMealOrder[]): {
  total: number; breakfast: number; lunch: number; dinner: number;
  skipped: number; paused: number; outForDelivery: number;
  delivered: number; failed: number; pending: number;
} {
  return {
    total: orders.length,
    breakfast: orders.filter((o) => o.mealType === 'breakfast').length,
    lunch: orders.filter((o) => o.mealType === 'lunch').length,
    dinner: orders.filter((o) => o.mealType === 'dinner').length,
    skipped: orders.filter((o) => o.status === 'skipped').length,
    paused: orders.filter((o) => o.status === 'paused').length,
    outForDelivery: orders.filter((o) => o.status === 'out_for_delivery').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    failed: orders.filter((o) => o.status === 'failed').length,
    pending: orders.filter((o) => o.status === 'scheduled' || o.status === 'preparing').length,
  };
}

export function calculateMealTypeBreakdown(orders: DailyMealOrder[]): { breakfast: number; lunch: number; dinner: number } {
  return {
    breakfast: orders.filter((o) => o.mealType === 'breakfast').length,
    lunch: orders.filter((o) => o.mealType === 'lunch').length,
    dinner: orders.filter((o) => o.mealType === 'dinner').length,
  };
}

export function calculateAreaWiseBreakdown(orders: DailyMealOrder[]): { areaName: string; count: number; delivered: number; pending: number }[] {
  const map: Record<string, { areaName: string; count: number; delivered: number; pending: number }> = {};
  orders.forEach((o) => {
    const area = o.deliveryAreaName || 'Unknown';
    if (!map[area]) map[area] = { areaName: area, count: 0, delivered: 0, pending: 0 };
    map[area].count++;
    if (o.status === 'delivered') map[area].delivered++;
    else map[area].pending++;
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
}

export function calculateDriverWiseBreakdown(orders: DailyMealOrder[], drivers: { id: string; driverName: string }[]): { driverName: string; driverId: string; assigned: number; delivered: number }[] {
  const driverMap: Record<string, { driverName: string; driverId: string; assigned: number; delivered: number }> = {};
  drivers.forEach((d) => { driverMap[d.id] = { driverName: d.driverName, driverId: d.id, assigned: 0, delivered: 0 }; });
  orders.forEach((o) => {
    if (!o.driverId) return;
    if (!driverMap[o.driverId]) driverMap[o.driverId] = { driverName: 'Unknown', driverId: o.driverId, assigned: 0, delivered: 0 };
    driverMap[o.driverId].assigned++;
    if (o.status === 'delivered') driverMap[o.driverId].delivered++;
  });
  return Object.values(driverMap).filter((d) => d.assigned > 0).sort((a, b) => b.assigned - a.assigned);
}
