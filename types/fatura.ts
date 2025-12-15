export type FaturaTipo = 'EDP' | 'SABESP' | 'TELEFONIA';

export interface Fatura {
  id: string;
  tipo: FaturaTipo;
  vencimento: Date;
  valorTotal: number;
  arquivoUrl?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  dadosExtraidos?: {
    tipo?: FaturaTipo;
    valorTotal?: number;
    vencimento?: Date;
    confiabilidade?: number;
  };
}

import { Timestamp } from 'firebase/firestore';

export interface FaturaFirestore extends Omit<Fatura, 'vencimento' | 'createdAt' | 'updatedAt' | 'dadosExtraidos'> {
  vencimento: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  dadosExtraidos?: {
    tipo?: FaturaTipo;
    valorTotal?: number;
    vencimento?: Timestamp;
    confiabilidade?: number;
  };
}

