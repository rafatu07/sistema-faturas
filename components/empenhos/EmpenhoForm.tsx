'use client';

import { useState } from 'react';
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
import { Empenho } from '@/types';
import { formatCurrency, parseCurrency } from '@/lib/utils/formatters';

interface EmpenhoFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (empenho: Omit<Empenho, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>;
  empenho?: Empenho | null;
}

export default function EmpenhoForm({ open, onClose, onSubmit, empenho }: EmpenhoFormProps) {
  const [numero, setNumero] = useState(empenho?.numero || '');
  const [dotacao, setDotacao] = useState(empenho?.dotacao || '');
  const [contaBancaria, setContaBancaria] = useState(empenho?.contaBancaria || '');
  const [valorTotal, setValorTotal] = useState(empenho?.valorTotal.toString() || '');
  const [saldoAtual, setSaldoAtual] = useState(empenho?.saldoAtual.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const valorTotalNum = parseCurrency(valorTotal);
      const saldoAtualNum = parseCurrency(saldoAtual);

      if (valorTotalNum <= 0) {
        throw new Error('Valor total deve ser maior que zero');
      }

      if (saldoAtualNum < 0 || saldoAtualNum > valorTotalNum) {
        throw new Error('Saldo atual deve estar entre 0 e o valor total');
      }

      await onSubmit({
        numero,
        dotacao,
        contaBancaria,
        valorTotal: valorTotalNum,
        saldoAtual: saldoAtualNum,
        userId: '', // Será preenchido no hook
      });

      // Reset form
      setNumero('');
      setDotacao('');
      setContaBancaria('');
      setValorTotal('');
      setSaldoAtual('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar empenho');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{empenho ? 'Editar Empenho' : 'Novo Empenho'}</DialogTitle>
          <DialogDescription>
            {empenho ? 'Atualize as informações do empenho' : 'Preencha os dados do novo empenho'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Número do Empenho</Label>
              <Input
                id="numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dotacao">Dotação Orçamentária</Label>
              <Input
                id="dotacao"
                value={dotacao}
                onChange={(e) => setDotacao(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contaBancaria">Conta Bancária</Label>
            <Input
              id="contaBancaria"
              value={contaBancaria}
              onChange={(e) => setContaBancaria(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorTotal">Valor Total</Label>
              <Input
                id="valorTotal"
                value={valorTotal}
                onChange={(e) => {
                  let value = e.target.value;
                  value = value.replace(/[^\d,.]/g, '');
                  const parts = value.split(',');
                  if (parts.length > 2) {
                    value = parts[0] + ',' + parts.slice(1).join('');
                  }
                  setValorTotal(value);
                }}
                onBlur={(e) => {
                  const numValue = parseCurrency(e.target.value);
                  if (numValue > 0) {
                    setValorTotal(formatCurrency(numValue));
                  }
                }}
                placeholder="0,00"
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="saldoAtual">Saldo Atual</Label>
              <Input
                id="saldoAtual"
                value={saldoAtual}
                onChange={(e) => {
                  let value = e.target.value;
                  value = value.replace(/[^\d,.]/g, '');
                  const parts = value.split(',');
                  if (parts.length > 2) {
                    value = parts[0] + ',' + parts.slice(1).join('');
                  }
                  setSaldoAtual(value);
                }}
                onBlur={(e) => {
                  const numValue = parseCurrency(e.target.value);
                  if (numValue >= 0) {
                    setSaldoAtual(formatCurrency(numValue));
                  }
                }}
                placeholder="0,00"
                required
                disabled={loading}
              />
            </div>
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

