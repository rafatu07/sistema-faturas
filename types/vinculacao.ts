export interface FaturaEmpenho {
  id: string;
  faturaId: string;
  empenhoId: string;
  valorUtilizado: number;
  userId: string;
  createdAt: Date;
}

import { Timestamp } from 'firebase/firestore';

export interface FaturaEmpenhoFirestore extends Omit<FaturaEmpenho, 'createdAt'> {
  createdAt: Timestamp;
}

