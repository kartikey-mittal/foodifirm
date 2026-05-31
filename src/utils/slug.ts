import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

export function createSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function checkSlugAvailability(slug: string): Promise<boolean> {
  const businessesRef = collection(db, 'businesses');
  const q = query(businessesRef, where('slug', '==', slug));
  const snap = await getDocs(q);
  return snap.empty;
}

export async function generateUniqueBusinessSlug(businessName: string): Promise<string> {
  const baseSlug = createSlugFromName(businessName);
  if (!baseSlug) return `store-${Date.now()}`;

  const available = await checkSlugAvailability(baseSlug);
  if (available) return baseSlug;

  let counter = 2;
  while (true) {
    const slug = `${baseSlug}-${counter}`;
    const available = await checkSlugAvailability(slug);
    if (available) return slug;
    counter++;
  }
}
