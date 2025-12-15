import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
  QueryConstraint,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';

// Helper para converter Timestamp do Firestore para Date
export const timestampToDate = (timestamp: Timestamp | Date | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  return timestamp.toDate();
};

// Helper para converter Date para Timestamp do Firestore
export const dateToTimestamp = (date: Date | string | number | null | undefined): Timestamp => {
  // Validar entrada
  if (date === null || date === undefined) {
    throw new Error('Data não pode ser null ou undefined');
  }
  
  // Se for objeto vazio ou inválido
  if (typeof date === 'object' && !(date instanceof Date)) {
    if (Object.keys(date).length === 0) {
      throw new Error('Data não pode ser um objeto vazio');
    }
    // Tentar converter objeto para Date (pode ser Timestamp do Firestore)
    if ('toDate' in date && typeof (date as any).toDate === 'function') {
      return date as Timestamp;
    }
    throw new Error(`Tipo de data não suportado: objeto inválido`);
  }
  
  let dateObj: Date;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    // Validar string não vazia
    if (!date.trim()) {
      throw new Error('Data não pode ser string vazia');
    }
    // Tentar converter string para Date
    // Formato brasileiro dd/MM/yyyy
    if (date.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/)) {
      const parts = date.split(/[\/\-]/);
      if (parts.length === 3) {
        let day = parseInt(parts[0]);
        let month = parseInt(parts[1]) - 1;
        let year = parseInt(parts[2]);
        if (year < 100) year += 2000;
        dateObj = new Date(year, month, day);
      } else {
        dateObj = new Date(date);
      }
    } else {
      // Formato ISO ou outro
      dateObj = new Date(date);
    }
  } else if (typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    throw new Error(`Tipo de data não suportado: ${typeof date}`);
  }
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    throw new Error(`Data inválida para conversão: ${date}`);
  }
  
  return Timestamp.fromDate(dateObj);
};

// Helper genérico para buscar um documento
export const getDocument = async <T>(collectionName: string, docId: string): Promise<T | null> => {
  if (!db) throw new Error('Firestore não está inicializado');
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return { id: docSnap.id, ...docSnap.data() } as T;
};

// Helper genérico para buscar múltiplos documentos
export const getDocuments = async <T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> => {
  if (!db) throw new Error('Firestore não está inicializado');
  const q = query(collection(db, collectionName), ...constraints);
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as T[];
};

// Helper genérico para criar um documento
export const createDocument = async <T extends Record<string, any>>(
  collectionName: string,
  data: Omit<T, 'id'>
): Promise<string> => {
  if (!db) throw new Error('Firestore não está inicializado');
  const docRef = await addDoc(collection(db, collectionName), data);
  return docRef.id;
};

// Helper genérico para atualizar um documento
export const updateDocument = async <T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  if (!db) throw new Error('Firestore não está inicializado');
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, data as any);
};

// Helper genérico para deletar um documento
export const deleteDocument = async (collectionName: string, docId: string): Promise<void> => {
  if (!db) throw new Error('Firestore não está inicializado');
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
};

// Helper para executar transações
export const executeTransaction = async <T>(
  updateFunction: (transaction: any) => Promise<T>
): Promise<T> => {
  if (!db) throw new Error('Firestore não está inicializado');
  return runTransaction(db, updateFunction);
};

// Helper para batch writes
export const createBatch = () => {
  if (!db) throw new Error('Firestore não está inicializado');
  return writeBatch(db);
};

// Exportar helpers de query comuns
export { where, orderBy, limit, query };

