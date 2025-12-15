export type EmpenhoStatus = 'ativo' | 'esgotado';

export interface Empenho {
  id: string;
  numero: string;
  dotacao: string;
  contaBancaria: string;
  valorTotal: number;
  saldoAtual: number;
  status: EmpenhoStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

import { Timestamp } from 'firebase/firestore';

export interface EmpenhoFirestore extends Omit<Empenho, 'createdAt' | 'updatedAt'> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

