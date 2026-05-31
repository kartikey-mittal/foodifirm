import {
  doc, setDoc, getDoc, getDocs, updateDoc,
  serverTimestamp, collection, query, where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { BatchStatus, Delivery, DeliveryArea, DeliveryBatch, Driver } from '@/types';

// Delivery Areas
export async function getDeliveryAreas(businessId: string): Promise<DeliveryArea[]> {
  const areasRef = collection(db, 'deliveryAreas');
  const q = query(areasRef, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryArea));
}

export async function createDeliveryArea(businessId: string, areaName: string) {
  const areaRef = doc(collection(db, 'deliveryAreas'));
  await setDoc(areaRef, {
    businessId,
    areaName,
    customerCount: 0,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return areaRef;
}

export async function updateDeliveryArea(areaId: string, data: Partial<DeliveryArea>) {
  const areaRef = doc(db, 'deliveryAreas', areaId);
  await updateDoc(areaRef, { ...data, updatedAt: serverTimestamp() });
}

// Delivery Batches
export async function getDeliveryBatchesByBusiness(businessId: string): Promise<DeliveryBatch[]> {
  const batchesRef = collection(db, 'deliveryBatches');
  const q = query(batchesRef, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DeliveryBatch));
}

export async function createDeliveryBatch(businessId: string, data: { batchName: string; areaId?: string; deliveryTime?: string; routeNote?: string }) {
  const batchRef = doc(collection(db, 'deliveryBatches'));
  await setDoc(batchRef, {
    businessId,
    batchName: data.batchName,
    areaId: data.areaId || '',
    deliveryTime: data.deliveryTime || '',
    routeNote: data.routeNote || '',
    customerIds: [],
    status: 'planned' as BatchStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return batchRef;
}

export async function updateDeliveryBatch(batchId: string, data: Partial<DeliveryBatch>) {
  const batchRef = doc(db, 'deliveryBatches', batchId);
  await updateDoc(batchRef, { ...data, updatedAt: serverTimestamp() });
}

// Drivers
export async function getDriversByBusiness(businessId: string): Promise<Driver[]> {
  const driversRef = collection(db, 'drivers');
  const q = query(driversRef, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Driver));
}

export async function getDriverByUserId(userId: string): Promise<Driver | null> {
  const driversRef = collection(db, 'drivers');
  const q = query(driversRef, where('userId', '==', userId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Driver;
}

export async function createDriver(businessId: string, data: { driverName: string; phone: string; email?: string; accessCode?: string; vehicleType?: string; vehicleNumber?: string }) {
  const driverRef = doc(collection(db, 'drivers'));
  await setDoc(driverRef, {
    businessId,
    driverName: data.driverName,
    phone: data.phone,
    email: data.email || '',
    accessCode: data.accessCode || '',
    vehicleType: data.vehicleType || '',
    vehicleNumber: data.vehicleNumber || '',
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return driverRef;
}

export async function updateDriver(driverId: string, data: Partial<Driver>) {
  const driverRef = doc(db, 'drivers', driverId);
  await updateDoc(driverRef, { ...data, updatedAt: serverTimestamp() });
}

// Deliveries
export async function getDeliveriesByBusiness(businessId: string): Promise<Delivery[]> {
  const deliveriesRef = collection(db, 'deliveries');
  const q = query(
    deliveriesRef,
    where('businessId', '==', businessId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Delivery)).sort((a, b) => b.deliveryDate.localeCompare(a.deliveryDate));
}

export async function getDeliveriesByDriver(driverId: string): Promise<Delivery[]> {
  const deliveriesRef = collection(db, 'deliveries');
  const today = new Date().toISOString().split('T')[0];
  const q = query(
    deliveriesRef,
    where('driverId', '==', driverId),
    where('deliveryDate', '==', today),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Delivery));
}

export async function getDeliveriesByDate(businessId: string, date: string): Promise<Delivery[]> {
  const deliveriesRef = collection(db, 'deliveries');
  const q = query(
    deliveriesRef,
    where('businessId', '==', businessId),
    where('deliveryDate', '==', date),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Delivery));
}

export async function markDeliveryDelivered(deliveryId: string) {
  const deliveryRef = doc(db, 'deliveries', deliveryId);
  await updateDoc(deliveryRef, {
    status: 'delivered',
    deliveredAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function createDelivery(businessId: string, data: Partial<Delivery>) {
  const deliveryRef = doc(collection(db, 'deliveries'));
  await setDoc(deliveryRef, {
    ...data,
    businessId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return deliveryRef;
}
