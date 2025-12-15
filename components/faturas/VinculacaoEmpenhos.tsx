'use client';

import { useState, useEffect } from 'react';
import { useEmpenhos } from '@/lib/hooks/useEmpenhos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Fatura, FaturaEmpenho } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { vincularEmpenho, getVinculacoesByFatura, desvincularEmpenho } from '@/lib/services/vinculacoes';
import { getValorTotalVinculado } from '@/lib/services/vinculacoes';
import { Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

interface VinculacaoEmpenhosProps {
  fatura: Fatura;
  onUpdate?: () => void;
}

export default function VinculacaoEmpenhos({ fatura, onUpdate }: VinculacaoEmpenhosProps) {
  const { user } = useAuth();
  const { getEmpenhosAtivosList } = useEmpenhos();
  const [empenhos, setEmpenhos] = useState<any[]>([]);
  const [vinculacoes, setVinculacoes] = useState<FaturaEmpenho[]>([]);
  const [selectedEmpenho, setSelectedEmpenho] = useState<string>('');
  const [valorUtilizado, setValorUtilizado] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valorTotalVinculado, setValorTotalVinculado] = useState(0);

  useEffect(() => {
    loadData();
  }, [fatura.id]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [empenhosList, vinculacoesList, totalVinculado] = await Promise.all([
        getEmpenhosAtivosList(),
        getVinculacoesByFatura(fatura.id),
        getValorTotalVinculado(fatura.id),
      ]);

      setEmpenhos(empenhosList);
      setVinculacoes(vinculacoesList);
      setValorTotalVinculado(totalVinculado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    }
  };

  const handleVincular = async () => {
    if (!selectedEmpenho || !valorUtilizado || !user) return;

    const valor = parseFloat(valorUtilizado.replace(/[^\d,.-]/g, '').replace(',', '.'));

    if (valor <= 0) {
      setError('Valor deve ser maior que zero');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await vincularEmpenho(fatura.id, selectedEmpenho, valor, user.uid);
      setSelectedEmpenho('');
      setValorUtilizado('');
      await loadData();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao vincular empenho');
    } finally {
      setLoading(false);
    }
  };

  const handleDesvincular = async (vinculacaoId: string, empenhoId: string, valor: number) => {
    if (!confirm('Tem certeza que deseja desvincular este empenho?')) return;

    setLoading(true);
    setError(null);

    try {
      await desvincularEmpenho(vinculacaoId, empenhoId, valor);
      await loadData();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao desvincular empenho');
    } finally {
      setLoading(false);
    }
  };

  const empenhosDisponiveis = empenhos.filter(
    (e) => !vinculacoes.some((v) => v.empenhoId === e.id)
  );

  const valorPendente = fatura.valorTotal - valorTotalVinculado;
  const isCompleto = Math.abs(valorPendente) < 0.01;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vinculação de Empenhos</CardTitle>
        <CardDescription>
          Vincule empenhos para pagar esta fatura. Valor total: {formatCurrency(fatura.valorTotal)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
        )}

        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <div className="text-sm text-gray-600">Valor Total da Fatura</div>
            <div className="text-lg font-semibold">{formatCurrency(fatura.valorTotal)}</div>
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-600">Valor Vinculado</div>
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency(valorTotalVinculado)}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-600">Valor Pendente</div>
            <div
              className={`text-lg font-semibold ${isCompleto ? 'text-green-600' : 'text-red-600'}`}
            >
              {formatCurrency(valorPendente)}
            </div>
          </div>
          <div className="flex items-center">
            {isCompleto ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
          </div>
        </div>

        {empenhosDisponiveis.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Nova Vinculação</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="empenho">Empenho</Label>
                <Select value={selectedEmpenho} onValueChange={setSelectedEmpenho}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um empenho" />
                  </SelectTrigger>
                  <SelectContent>
                    {empenhosDisponiveis.map((empenho) => (
                      <SelectItem key={empenho.id} value={empenho.id}>
                        {empenho.numero} - Saldo: {formatCurrency(empenho.saldoAtual)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor">Valor a Utilizar</Label>
                <Input
                  id="valor"
                  type="text"
                  value={valorUtilizado}
                  onChange={(e) => setValorUtilizado(e.target.value)}
                  placeholder="R$ 0,00"
                  max={empenhos.find((e) => e.id === selectedEmpenho)?.saldoAtual || 0}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleVincular}
                  disabled={loading || !selectedEmpenho || !valorUtilizado}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Vincular
                </Button>
              </div>
            </div>
          </div>
        )}

        {vinculacoes.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Empenhos Vinculados</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empenho</TableHead>
                  <TableHead>Valor Utilizado</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vinculacoes.map((vinculacao) => {
                  const empenho = empenhos.find((e) => e.id === vinculacao.empenhoId);
                  return (
                    <TableRow key={vinculacao.id}>
                      <TableCell className="font-medium">
                        {empenho ? empenho.numero : 'N/A'}
                      </TableCell>
                      <TableCell>{formatCurrency(vinculacao.valorUtilizado)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDesvincular(
                              vinculacao.id,
                              vinculacao.empenhoId,
                              vinculacao.valorUtilizado
                            )
                          }
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {empenhosDisponiveis.length === 0 && vinculacoes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum empenho disponível para vincular.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

