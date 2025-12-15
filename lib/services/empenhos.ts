import {
  createDocument,
  updateDocument,
  deleteDocument,
  getDocument,
  getDocuments,
  where,
  orderBy,
  timestampToDate,
  dateToTimestamp,
  executeTransaction,
} from '@/lib/firebase/firestore';
import { Empenho, EmpenhoFirestore, EmpenhoStatus } from '@/types';
import { serverTimestamp } from 'firebase/firestore';

const COLLECTION = 'empenhos';

// Converter Firestore para modelo
const firestoreToModel = (data: EmpenhoFirestore): Empenho => ({
  ...data,
  createdAt: timestampToDate(data.createdAt),
  updatedAt: timestampToDate(data.updatedAt),
});

// Converter modelo para Firestore
const modelToFirestore = (data: Partial<Empenho>): Partial<EmpenhoFirestore> => {
  const result: any = { ...data };
  
  if (data.createdAt) {
    result.createdAt = dateToTimestamp(data.createdAt);
  }
  if (data.updatedAt) {
    result.updatedAt = dateToTimestamp(data.updatedAt);
  }
  
  return result;
};

export const createEmpenho = async (
  empenho: Omit<Empenho, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): Promise<string> => {
  const status: EmpenhoStatus = empenho.saldoAtual > 0 ? 'ativo' : 'esgotado';
  
  const data = {
    ...empenho,
    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  return await createDocument(COLLECTION, data);
};

export const updateEmpenho = async (
  id: string,
  updates: Partial<Omit<Empenho, 'id' | 'createdAt' | 'userId'>>
): Promise<void> => {
  // Recalcular status baseado no saldo
  if (updates.saldoAtual !== undefined) {
    updates.status = updates.saldoAtual > 0 ? 'ativo' : 'esgotado';
  }
  
  const data = {
    ...updates,
    updatedAt: serverTimestamp(),
  };
  
  await updateDocument(COLLECTION, id, data);
};

export const deleteEmpenho = async (id: string): Promise<void> => {
  await deleteDocument(COLLECTION, id);
};

export const getEmpenho = async (id: string): Promise<Empenho | null> => {
  const data = await getDocument<EmpenhoFirestore>(COLLECTION, id);
  return data ? firestoreToModel(data) : null;
};

export const getEmpenhosByUser = async (userId: string): Promise<Empenho[]> => {
  const data = await getDocuments<EmpenhoFirestore>(COLLECTION, [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  ]);
  
  return data.map(firestoreToModel);
};

export const getEmpenhosAtivos = async (userId: string): Promise<Empenho[]> => {
  const data = await getDocuments<EmpenhoFirestore>(COLLECTION, [
    where('userId', '==', userId),
    where('status', '==', 'ativo'),
    orderBy('createdAt', 'desc'),
  ]);
  
  return data.map(firestoreToModel);
};

export const getEmpenhosByConta = async (
  userId: string,
  contaBancaria: string
): Promise<Empenho[]> => {
  const data = await getDocuments<EmpenhoFirestore>(COLLECTION, [
    where('userId', '==', userId),
    where('contaBancaria', '==', contaBancaria),
    orderBy('createdAt', 'desc'),
  ]);
  
  return data.map(firestoreToModel);
};

export const atualizarSaldoEmpenho = async (
  empenhoId: string,
  valorUtilizado: number
): Promise<void> => {
  await executeTransaction(async (transaction) => {
    const empenhoRef = await getDocument<EmpenhoFirestore>(COLLECTION, empenhoId);
    
    if (!empenhoRef) {
      throw new Error('Empenho não encontrado');
    }
    
    const novoSaldo = empenhoRef.saldoAtual - valorUtilizado;
    
    // Se valorUtilizado é positivo (uso), validar saldo suficiente
    // Se valorUtilizado é negativo (reversão), validar que não ultrapassa valor total
    if (valorUtilizado > 0 && novoSaldo < 0) {
      throw new Error('Saldo insuficiente no empenho');
    }
    
    if (valorUtilizado < 0 && novoSaldo > empenhoRef.valorTotal) {
      throw new Error('Saldo não pode ultrapassar o valor total do empenho');
    }
    
    const status: EmpenhoStatus = novoSaldo > 0 ? 'ativo' : 'esgotado';
    
    await updateEmpenho(empenhoId, {
      saldoAtual: novoSaldo,
      status,
    });
  });
};

