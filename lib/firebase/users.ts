import { db } from './config';
import { collection, getDocs, query, limit } from 'firebase/firestore';

export const checkIfFirstUser = async (): Promise<boolean> => {
  if (!db) throw new Error('Firestore não está inicializado');
  
  const usersRef = collection(db, 'users');
  const q = query(usersRef, limit(1));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.empty;
};

