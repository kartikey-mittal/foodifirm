import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from '@/config/firebase';

export function loginUser(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function registerUser(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function logoutUser() {
  return signOut(auth);
}

export function sendPasswordReset(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
