import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatDate = (date: Date | string, formatStr: string = 'dd/MM/yyyy'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: ptBR });
};

export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

export const formatCurrency = (value: number): string => {
  // Formato brasileiro: 1.000,00 (sem símbolo R$)
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatCurrencyWithSymbol = (value: number): string => {
  // Formato brasileiro com símbolo: R$ 1.000,00
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  // Remover espaços e caracteres não numéricos exceto vírgula e ponto
  let cleaned = value.replace(/\s/g, '').replace(/[^\d,.]/g, '');
  
  // Se tem vírgula, assumir formato brasileiro (1.000,00)
  if (cleaned.includes(',')) {
    // Remover pontos (milhares) e substituir vírgula por ponto (decimal)
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }
  // Se só tem ponto, verificar se é formato brasileiro ou americano
  else if (cleaned.includes('.')) {
    // Se tem mais de 3 dígitos antes do ponto, provavelmente é formato brasileiro
    const parts = cleaned.split('.');
    if (parts[0].length > 3) {
      // Formato brasileiro: remover pontos
      cleaned = cleaned.replace(/\./g, '');
    }
    // Caso contrário, manter como está (formato americano)
  }
  
  const numValue = parseFloat(cleaned);
  return isNaN(numValue) ? 0 : numValue;
};

export const formatDocumentNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};

