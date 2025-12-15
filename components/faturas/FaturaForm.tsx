'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Fatura, FaturaTipo } from '@/types';
import { formatCurrency, parseCurrency, formatDate } from '@/lib/utils/formatters';
import { ExtractedData } from '@/lib/ocr/extractors';

interface FaturaFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fatura: Omit<Fatura, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  fatura?: Fatura | null;
  extractedData?: ExtractedData | null;
  fileUrl?: string;
}

export default function FaturaForm({
  open,
  onClose,
  onSubmit,
  fatura,
  extractedData,
  fileUrl,
}: FaturaFormProps) {
  const [tipo, setTipo] = useState<FaturaTipo>(fatura?.tipo || extractedData?.tipo || 'EDP');
  const [vencimento, setVencimento] = useState(
    fatura
      ? formatDate(fatura.vencimento, 'yyyy-MM-dd')
      : extractedData?.vencimento
      ? formatDate(extractedData.vencimento, 'yyyy-MM-dd')
      : ''
  );
  const [valorTotal, setValorTotal] = useState(
    fatura?.valorTotal.toString() || extractedData?.valorTotal?.toString() || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (extractedData && !fatura) {
      if (extractedData.tipo) setTipo(extractedData.tipo);
      if (extractedData.vencimento) {
        // extractedData.vencimento já é Date
        const vencimentoDate = extractedData.vencimento instanceof Date 
          ? extractedData.vencimento 
          : new Date(extractedData.vencimento);
        
        if (!isNaN(vencimentoDate.getTime())) {
          setVencimento(formatDate(vencimentoDate, 'yyyy-MM-dd'));
        }
      }
      if (extractedData.valorTotal) {
        // Formatar valor no formato brasileiro
        setValorTotal(formatCurrency(extractedData.valorTotal));
      }
    }
  }, [extractedData, fatura]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log('=== INÍCIO DO SALVAMENTO ===');
      console.log('Dados do formulário:', { tipo, vencimento, valorTotal });
      console.log('extractedData:', extractedData);

      const valorTotalNum = parseCurrency(valorTotal);
      console.log('Valor total parseado:', valorTotalNum);

      if (valorTotalNum <= 0) {
        throw new Error('Valor total deve ser maior que zero');
      }

      if (!vencimento) {
        throw new Error('Data de vencimento é obrigatória');
      }

      // Converter string de data para Date object
      // vencimento sempre é string (vem do input type="date")
      let vencimentoDate: Date;
      console.log('Tipo de vencimento:', typeof vencimento, vencimento);
      
      if (!vencimento || typeof vencimento !== 'string') {
        throw new Error('Data de vencimento é obrigatória');
      }
      
      // Tentar formato yyyy-MM-dd primeiro (formato padrão do input type="date")
      if (vencimento.match(/^\d{4}-\d{2}-\d{2}$/)) {
        vencimentoDate = new Date(vencimento + 'T00:00:00');
        console.log('Tentando formato yyyy-MM-dd:', vencimento, '→', vencimentoDate);
      } else {
        // Tentar formato brasileiro dd/MM/yyyy
        const parts = vencimento.split(/[\/\-]/);
        if (parts.length === 3) {
          let day = parseInt(parts[0]);
          let month = parseInt(parts[1]) - 1;
          let year = parseInt(parts[2]);
          if (year < 100) year += 2000;
          vencimentoDate = new Date(year, month, day);
          console.log('Tentando formato dd/MM/yyyy:', vencimento, '→', vencimentoDate);
        } else {
          throw new Error('Formato de data inválido: ' + vencimento);
        }
      }
      
      if (isNaN(vencimentoDate.getTime())) {
        throw new Error('Data inválida: ' + vencimento);
      }

      console.log('Vencimento convertido:', vencimentoDate, 'Válido:', !isNaN(vencimentoDate.getTime()));

      // Converter vencimento dos dados extraídos se necessário
      let vencimentoExtraido: Date | undefined;
      if (extractedData?.vencimento) {
        console.log('Convertendo vencimento extraído:', extractedData.vencimento, 'Tipo:', typeof extractedData.vencimento);
        
        // extractedData.vencimento já é Date
        if (extractedData.vencimento instanceof Date) {
          vencimentoExtraido = extractedData.vencimento;
        } else {
          // Fallback: tentar converter se não for Date (não deveria acontecer, mas por segurança)
          vencimentoExtraido = new Date(extractedData.vencimento as any);
          if (isNaN(vencimentoExtraido.getTime())) {
            console.warn('Vencimento extraído inválido, removendo');
            vencimentoExtraido = undefined;
          }
        }
      }

      const faturaData = {
        tipo,
        vencimento: vencimentoDate,
        valorTotal: valorTotalNum,
        arquivoUrl: fileUrl || fatura?.arquivoUrl,
        userId: '', // Será preenchido no hook
        dadosExtraidos: extractedData
          ? {
              tipo: extractedData.tipo,
              valorTotal: extractedData.valorTotal,
              vencimento: vencimentoExtraido,
              confiabilidade: extractedData.confiabilidade,
            }
          : undefined,
      };

      console.log('Dados finais para salvar:', faturaData);
      console.log('Tipo de vencimento nos dados:', typeof faturaData.vencimento, faturaData.vencimento instanceof Date);

      await onSubmit(faturaData);
      
      console.log('=== SALVAMENTO CONCLUÍDO ===');

      // Reset form
      setTipo('EDP');
      setVencimento('');
      setValorTotal('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar fatura');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{fatura ? 'Editar Fatura' : 'Confirmar Dados da Fatura'}</DialogTitle>
          <DialogDescription>
            {fatura
              ? 'Atualize as informações da fatura'
              : 'Revise e confirme os dados extraídos da fatura'}
          </DialogDescription>
        </DialogHeader>

        {extractedData && extractedData.confiabilidade > 0 && (
          <div className="mt-2 p-2 bg-blue-50 rounded text-sm border border-blue-200">
            Dados extraídos automaticamente (confiabilidade:{' '}
            {Math.round(extractedData.confiabilidade * 100)}%). Revise e ajuste se necessário.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Fatura</Label>
            <Select value={tipo} onValueChange={(value) => setTipo(value as FaturaTipo)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EDP">EDP (Energia Elétrica)</SelectItem>
                <SelectItem value="SABESP">SABESP (Água)</SelectItem>
                <SelectItem value="TELEFONIA">Telefonia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vencimento">Data de Vencimento</Label>
            <Input
              id="vencimento"
              type="date"
              value={vencimento}
              onChange={(e) => setVencimento(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorTotal">Valor Total</Label>
            <Input
              id="valorTotal"
              type="text"
              value={valorTotal}
              onChange={(e) => {
                let value = e.target.value;
                // Remover tudo exceto números, vírgula e ponto
                value = value.replace(/[^\d,.]/g, '');
                // Garantir apenas uma vírgula
                const parts = value.split(',');
                if (parts.length > 2) {
                  value = parts[0] + ',' + parts.slice(1).join('');
                }
                setValorTotal(value);
              }}
              onBlur={(e) => {
                // Formatar ao sair do campo
                const numValue = parseCurrency(e.target.value);
                if (numValue > 0) {
                  setValorTotal(formatCurrency(numValue));
                }
              }}
              placeholder="0,00"
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500">Formato: 1.000,00 (ponto para milhares, vírgula para centavos)</p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

