import {
  createDocument,
  deleteDocument,
  getDocuments,
  where,
  orderBy,
  timestampToDate,
  dateToTimestamp,
  executeTransaction,
} from '@/lib/firebase/firestore';
import { FaturaEmpenho, FaturaEmpenhoFirestore } from '@/types';
import { serverTimestamp } from 'firebase/firestore';
import { atualizarSaldoEmpenho } from './empenhos';
import { getFatura } from './faturas';
import { getEmpenho } from './empenhos';

const COLLECTION = 'faturaEmpenhos';

// Converter Firestore para modelo
const firestoreToModel = (data: FaturaEmpenhoFirestore): FaturaEmpenho => ({
  ...data,
  createdAt: timestampToDate(data.createdAt),
});

// Converter modelo para Firestore
const modelToFirestore = (data: Partial<FaturaEmpenho>): Partial<FaturaEmpenhoFirestore> => {
  const result: any = { ...data };
  
  if (data.createdAt) {
    result.createdAt = dateToTimestamp(data.createdAt);
  }
  
  return result;
};

export const vincularEmpenho = async (
  faturaId: string,
  empenhoId: string,
  valorUtilizado: number,
  userId: string
): Promise<string> => {
  // Validar antes de criar a vinculação
  const empenho = await getEmpenho(empenhoId);
  if (!empenho) {
    throw new Error('Empenho não encontrado');
  }
  
  if (empenho.saldoAtual < valorUtilizado) {
    throw new Error('Saldo insuficiente no empenho');
  }
  
  if (empenho.userId !== userId) {
    throw new Error('Empenho não pertence ao usuário');
  }
  
  // Usar transação para garantir consistência
  return await executeTransaction(async () => {
    // Atualizar saldo do empenho
    await atualizarSaldoEmpenho(empenhoId, valorUtilizado);
    
    // Criar vinculação
    const vinculacaoData = {
      faturaId,
      empenhoId,
      valorUtilizado,
      userId,
      createdAt: serverTimestamp(),
    };
    
    return await createDocument(COLLECTION, vinculacaoData);
  });
};

export const desvincularEmpenho = async (
  vinculacaoId: string,
  empenhoId: string,
  valorUtilizado: number
): Promise<void> => {
  // Usar transação para garantir consistência
  await executeTransaction(async () => {
    // Reverter saldo do empenho
    const empenho = await getEmpenho(empenhoId);
    if (!empenho) {
      throw new Error('Empenho não encontrado');
    }
    
    await atualizarSaldoEmpenho(empenhoId, -valorUtilizado);
    
    // Deletar vinculação
    await deleteDocument(COLLECTION, vinculacaoId);
  });
};

export const getVinculacoesByFatura = async (
  faturaId: string
): Promise<FaturaEmpenho[]> => {
  const data = await getDocuments<FaturaEmpenhoFirestore>(COLLECTION, [
    where('faturaId', '==', faturaId),
    orderBy('createdAt', 'desc'),
  ]);
  
  return data.map(firestoreToModel);
};

export const getVinculacoesByEmpenho = async (
  empenhoId: string
): Promise<FaturaEmpenho[]> => {
  const data = await getDocuments<FaturaEmpenhoFirestore>(COLLECTION, [
    where('empenhoId', '==', empenhoId),
    orderBy('createdAt', 'desc'),
  ]);
  
  return data.map(firestoreToModel);
};

export const getValorTotalVinculado = async (faturaId: string): Promise<number> => {
  const vinculacoes = await getVinculacoesByFatura(faturaId);
  return vinculacoes.reduce((total, v) => total + v.valorUtilizado, 0);
};

export const validarFaturaCompleta = async (faturaId: string): Promise<boolean> => {
  const fatura = await getFatura(faturaId);
  if (!fatura) return false;
  
  const valorVinculado = await getValorTotalVinculado(faturaId);
  return Math.abs(valorVinculado - fatura.valorTotal) < 0.01; // Tolerância para arredondamento
};

