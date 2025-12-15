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
} from '@/lib/firebase/firestore';
import { Fatura, FaturaFirestore } from '@/types';
import { serverTimestamp } from 'firebase/firestore';

const COLLECTION = 'faturas';

// Converter Firestore para modelo
const firestoreToModel = (data: FaturaFirestore): Fatura => {
  const result: Fatura = {
    ...data,
    vencimento: timestampToDate(data.vencimento),
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  };
  
  if (data.dadosExtraidos?.vencimento) {
    result.dadosExtraidos = {
      ...data.dadosExtraidos,
      vencimento: timestampToDate(data.dadosExtraidos.vencimento),
    };
  } else if (data.dadosExtraidos) {
    result.dadosExtraidos = data.dadosExtraidos;
  }
  
  return result;
};

// Converter modelo para Firestore
const modelToFirestore = (data: Partial<Fatura>): Partial<FaturaFirestore> => {
  console.log('=== modelToFirestore ===');
  console.log('Data recebida:', data);
  console.log('Tipo de vencimento:', typeof data.vencimento, data.vencimento instanceof Date);
  console.log('createdAt:', data.createdAt, 'Tipo:', typeof data.createdAt);
  console.log('updatedAt:', data.updatedAt, 'Tipo:', typeof data.updatedAt);
  
  // Criar cópia limpa, removendo campos inválidos
  const result: any = {};
  
  // Copiar apenas campos válidos
  if (data.tipo) result.tipo = data.tipo;
  if (data.valorTotal !== undefined) result.valorTotal = data.valorTotal;
  if (data.arquivoUrl) result.arquivoUrl = data.arquivoUrl;
  if (data.userId) result.userId = data.userId;
  
  // Não copiar createdAt/updatedAt aqui - serão adicionados pelo serverTimestamp
  
  if (data.vencimento) {
    console.log('Convertendo vencimento principal:', data.vencimento, 'Tipo:', typeof data.vencimento);
    try {
      // Validar que é Date antes de converter
      if (!(data.vencimento instanceof Date)) {
        throw new Error(`Vencimento deve ser Date, recebido: ${typeof data.vencimento}`);
      }
      result.vencimento = dateToTimestamp(data.vencimento);
      console.log('Vencimento convertido com sucesso');
    } catch (error) {
      console.error('ERRO ao converter vencimento principal:', error);
      throw error;
    }
  }
  // Processar dadosExtraidos se existir
  if (data.dadosExtraidos) {
    console.log('Processando dadosExtraidos:', data.dadosExtraidos);
    result.dadosExtraidos = {
      tipo: data.dadosExtraidos.tipo,
      valorTotal: data.dadosExtraidos.valorTotal,
      confiabilidade: data.dadosExtraidos.confiabilidade,
    };
    
    // Processar vencimento dos dados extraídos apenas se for válido
    if (data.dadosExtraidos.vencimento) {
      console.log('Convertendo vencimento dos dados extraídos:', data.dadosExtraidos.vencimento, 'Tipo:', typeof data.dadosExtraidos.vencimento);
      const vencimentoExtraido = data.dadosExtraidos.vencimento;
      let vencimentoDate: Date | null = null;
      
      if (vencimentoExtraido instanceof Date) {
        vencimentoDate = vencimentoExtraido;
      } else if (typeof vencimentoExtraido === 'string' && vencimentoExtraido.trim()) {
        // Tentar converter string para Date (formato dd/MM/yyyy ou dd/MM/yy)
        const parts = vencimentoExtraido.split(/[\/\-]/);
        if (parts.length === 3) {
          let day = parseInt(parts[0]);
          let month = parseInt(parts[1]) - 1;
          let year = parseInt(parts[2]);
          if (year < 100) year += 2000;
          vencimentoDate = new Date(year, month, day);
        } else {
          vencimentoDate = new Date(vencimentoExtraido);
        }
      } else if (typeof vencimentoExtraido === 'number') {
        vencimentoDate = new Date(vencimentoExtraido);
      }
      
      // Só adicionar vencimento se for uma data válida
      if (vencimentoDate && !isNaN(vencimentoDate.getTime())) {
        try {
          result.dadosExtraidos.vencimento = dateToTimestamp(vencimentoDate);
          console.log('Vencimento dos dados extraídos convertido com sucesso');
        } catch (error) {
          console.warn('Erro ao converter vencimento dos dados extraídos, ignorando:', error);
          // Não adicionar vencimento se a conversão falhar
        }
      } else {
        console.warn('Vencimento dos dados extraídos inválido, ignorando:', vencimentoExtraido);
      }
    }
  }
  
  return result;
};

export const createFatura = async (
  fatura: Omit<Fatura, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  console.log('=== createFatura ===');
  console.log('Fatura recebida:', fatura);
  console.log('Tipo de vencimento:', typeof fatura.vencimento, fatura.vencimento instanceof Date);
  
  // Validar que vencimento é Date
  if (!(fatura.vencimento instanceof Date)) {
    console.error('ERRO: vencimento não é Date:', fatura.vencimento, typeof fatura.vencimento);
    throw new Error('Data de vencimento deve ser um objeto Date');
  }
  
  if (isNaN(fatura.vencimento.getTime())) {
    console.error('ERRO: vencimento é inválido:', fatura.vencimento);
    throw new Error('Data de vencimento inválida');
  }
  
  console.log('Dados antes de modelToFirestore:', fatura);
  const firestoreData = modelToFirestore(fatura);
  console.log('Dados após modelToFirestore:', firestoreData);
  
  // Adicionar timestamps do servidor
  const finalData = {
    ...firestoreData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  const docId = await createDocument(COLLECTION, finalData as any);
  console.log('Fatura criada com ID:', docId);
  return docId;
};

export const updateFatura = async (
  id: string,
  updates: Partial<Omit<Fatura, 'id' | 'createdAt' | 'userId'>>
): Promise<void> => {
  const data = {
    ...modelToFirestore(updates),
    updatedAt: serverTimestamp(),
  };
  
  await updateDocument(COLLECTION, id, data);
};

export const deleteFatura = async (id: string): Promise<void> => {
  await deleteDocument(COLLECTION, id);
};

export const getFatura = async (id: string): Promise<Fatura | null> => {
  const data = await getDocument<FaturaFirestore>(COLLECTION, id);
  return data ? firestoreToModel(data) : null;
};

export const getFaturasByUser = async (userId: string): Promise<Fatura[]> => {
  const data = await getDocuments<FaturaFirestore>(COLLECTION, [
    where('userId', '==', userId),
    orderBy('vencimento', 'asc'),
  ]);
  
  return data.map(firestoreToModel);
};

export const getFaturasByTipo = async (
  userId: string,
  tipo: Fatura['tipo']
): Promise<Fatura[]> => {
  const data = await getDocuments<FaturaFirestore>(COLLECTION, [
    where('userId', '==', userId),
    where('tipo', '==', tipo),
    orderBy('vencimento', 'asc'),
  ]);
  
  return data.map(firestoreToModel);
};

export const getFaturasProximasVencimento = async (
  userId: string,
  dias: number = 30
): Promise<Fatura[]> => {
  const hoje = new Date();
  const dataLimite = new Date();
  dataLimite.setDate(hoje.getDate() + dias);
  
  const todasFaturas = await getFaturasByUser(userId);
  
  return todasFaturas.filter(
    (fatura) => fatura.vencimento >= hoje && fatura.vencimento <= dataLimite
  );
};

