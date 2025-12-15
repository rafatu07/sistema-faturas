import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, UserRole } from '@/types';
import { checkIfFirstUser } from './users';

export const login = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase Auth não está inicializado');
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const register = async (
  email: string,
  password: string,
  name: string,
  role?: UserRole
) => {
  if (!auth || !db) throw new Error('Firebase não está inicializado');
  
  // Verificar se é o primeiro usuário (será admin automaticamente)
  const isFirstUser = await checkIfFirstUser();
  const userRole: UserRole = role || (isFirstUser ? 'admin' : 'user');
  
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Criar documento do usuário no Firestore
  const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
    name,
    email,
    role: userRole,
  };
  
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  return userCredential.user;
};

export const logout = async () => {
  if (!auth) throw new Error('Firebase Auth não está inicializado');
  await signOut(auth);
};

export const getCurrentUser = (): FirebaseUser | null => {
  if (!auth) return null;
  return auth.currentUser;
};

export const getUserData = async (uid: string): Promise<User | null> => {
  if (!db) throw new Error('Firestore não está inicializado');
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;
  
  const data = userDoc.data();
  return {
    id: userDoc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as User;
};

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

