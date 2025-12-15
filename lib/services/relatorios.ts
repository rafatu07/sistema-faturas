import { Fatura } from '@/types';
import { getFaturasByUser } from './faturas';
import { getVinculacoesByFatura } from './vinculacoes';
import { getEmpenhosByUser } from './empenhos';

export interface RelatorioPorVencimento {
  vencimento: Date;
  faturas: Fatura[];
  valorTotal: number;
}

export interface RelatorioPorConta {
  contaBancaria: string;
  empenhos: Array<{
    numero: string;
    saldoAtual: number;
    valorTotal: number;
  }>;
  saldoTotal: number;
  valorTotalEmpenhado: number;
}

export interface RelatorioCompleto {
  porVencimento: RelatorioPorVencimento[];
  porConta: RelatorioPorConta[];
  totalGeral: number;
  totalVinculado: number;
  totalPendente: number;
}

export const gerarRelatorioPorVencimento = async (
  userId: string
): Promise<RelatorioPorVencimento[]> => {
  const faturas = await getFaturasByUser(userId);
  
  // Agrupar por data de vencimento
  const agrupado = new Map<string, Fatura[]>();
  
  faturas.forEach((fatura) => {
    const key = fatura.vencimento.toISOString().split('T')[0];
    if (!agrupado.has(key)) {
      agrupado.set(key, []);
    }
    agrupado.get(key)!.push(fatura);
  });
  
  // Converter para array e calcular totais
  const relatorio: RelatorioPorVencimento[] = Array.from(agrupado.entries()).map(
    ([dateStr, faturas]) => {
      const vencimento = new Date(dateStr);
      const valorTotal = faturas.reduce((sum, f) => sum + f.valorTotal, 0);
      
      return {
        vencimento,
        faturas,
        valorTotal,
      };
    }
  );
  
  // Ordenar por data de vencimento
  relatorio.sort((a, b) => a.vencimento.getTime() - b.vencimento.getTime());
  
  return relatorio;
};

export const gerarRelatorioPorConta = async (
  userId: string
): Promise<RelatorioPorConta[]> => {
  const empenhos = await getEmpenhosByUser(userId);
  
  // Agrupar por conta bancária
  const agrupado = new Map<string, typeof empenhos>();
  
  empenhos.forEach((empenho) => {
    if (!agrupado.has(empenho.contaBancaria)) {
      agrupado.set(empenho.contaBancaria, []);
    }
    agrupado.get(empenho.contaBancaria)!.push(empenho);
  });
  
  // Converter para array e calcular totais
  const relatorio: RelatorioPorConta[] = Array.from(agrupado.entries()).map(
    ([contaBancaria, empenhosList]) => {
      const saldoTotal = empenhosList.reduce((sum, e) => sum + e.saldoAtual, 0);
      const valorTotalEmpenhado = empenhosList.reduce((sum, e) => sum + e.valorTotal, 0);
      
      return {
        contaBancaria,
        empenhos: empenhosList.map((e) => ({
          numero: e.numero,
          saldoAtual: e.saldoAtual,
          valorTotal: e.valorTotal,
        })),
        saldoTotal,
        valorTotalEmpenhado,
      };
    }
  );
  
  return relatorio;
};

export const gerarRelatorioCompleto = async (
  userId: string
): Promise<RelatorioCompleto> => {
  const [porVencimento, porConta, faturas] = await Promise.all([
    gerarRelatorioPorVencimento(userId),
    gerarRelatorioPorConta(userId),
    getFaturasByUser(userId),
  ]);
  
  const totalGeral = faturas.reduce((sum, f) => sum + f.valorTotal, 0);
  
  // Calcular total vinculado
  let totalVinculado = 0;
  for (const fatura of faturas) {
    const vinculacoes = await getVinculacoesByFatura(fatura.id);
    totalVinculado += vinculacoes.reduce((sum, v) => sum + v.valorUtilizado, 0);
  }
  
  const totalPendente = totalGeral - totalVinculado;
  
  return {
    porVencimento,
    porConta,
    totalGeral,
    totalVinculado,
    totalPendente,
  };
};

