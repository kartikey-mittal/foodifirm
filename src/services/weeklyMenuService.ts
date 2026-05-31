import {
  doc, setDoc, getDoc, getDocs, updateDoc,
  serverTimestamp, collection, query, where, limit,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { WeeklyMenu } from '@/types';

const emptyDay = { breakfast: [], lunch: [], dinner: [] };

export const emptyWeeklyMenu = {
  monday: { ...emptyDay },
  tuesday: { ...emptyDay },
  wednesday: { ...emptyDay },
  thursday: { ...emptyDay },
  friday: { ...emptyDay },
  saturday: { ...emptyDay },
  sunday: { ...emptyDay },
};

function getWeekEndDate(startDate: string): string {
  const d = new Date(startDate);
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}

export async function getWeeklyMenuByBusinessAndDate(
  businessId: string,
  weekStartDate: string,
): Promise<WeeklyMenu | null> {
  const menusRef = collection(db, 'weeklyMenus');
  const q = query(menusRef, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WeeklyMenu));
  return all.find((m) => m.weekStartDate === weekStartDate) || null;
}

export async function getLatestWeeklyMenu(businessId: string): Promise<WeeklyMenu | null> {
  const menusRef = collection(db, 'weeklyMenus');
  const q = query(menusRef, where('businessId', '==', businessId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const all = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as WeeklyMenu))
    .filter((m) => m.isPublished);
  all.sort((a, b) => (b.weekStartDate || '').localeCompare(a.weekStartDate || ''));
  return all[0] || null;
}

export async function createWeeklyMenu(
  businessId: string,
  weekStartDate: string,
  days?: WeeklyMenu['days'],
) {
  const menuRef = doc(collection(db, 'weeklyMenus'));
  await setDoc(menuRef, {
    businessId,
    weekStartDate,
    weekEndDate: getWeekEndDate(weekStartDate),
    days: days || emptyWeeklyMenu,
    isPublished: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return menuRef;
}

export async function updateWeeklyMenu(menuId: string, data: Partial<WeeklyMenu>) {
  const menuRef = doc(db, 'weeklyMenus', menuId);
  await updateDoc(menuRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}
