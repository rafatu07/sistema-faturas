'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  gerarRelatorioCompleto,
  RelatorioCompleto,
  RelatorioPorVencimento,
  RelatorioPorConta,
} from '@/lib/services/relatorios';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RelatorioView() {
  const { user } = useAuth();
  const [relatorio, setRelatorio] = useState<RelatorioCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'vencimento' | 'conta'>('vencimento');

  useEffect(() => {
    loadRelatorio();
  }, [user]);

  const loadRelatorio = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await gerarRelatorioCompleto(user.uid);
      setRelatorio(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-600" />
          <p className="mt-2 text-gray-600">Gerando relatório...</p>
        </div>
      </div>
    );
  }

  if (error || !relatorio) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">{error || 'Erro ao carregar relatório'}</p>
          <Button onClick={loadRelatorio} className="mt-4">
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Relatórios Financeiros</CardTitle>
              <CardDescription>Visão consolidada de faturas e empenhos</CardDescription>
            </div>
            <Button variant="outline" onClick={loadRelatorio}>
              <Download className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Geral</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(relatorio.totalGeral)}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Vinculado</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(relatorio.totalVinculado)}
              </div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Pendente</div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(relatorio.totalPendente)}
              </div>
            </div>
          </div>

          <div className="flex space-x-2 border-b mb-4">
            <button
              onClick={() => setActiveTab('vencimento')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'vencimento'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por Vencimento
            </button>
            <button
              onClick={() => setActiveTab('conta')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'conta'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por Conta Bancária
            </button>
          </div>

          {activeTab === 'vencimento' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Faturas Agrupadas por Vencimento</h3>
              {relatorio.porVencimento.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma fatura encontrada.
                </div>
              ) : (
                relatorio.porVencimento.map((item) => (
                  <Card key={item.vencimento.toISOString()}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">
                          {formatDate(item.vencimento, 'dd/MM/yyyy')}
                        </CardTitle>
                        <div className="text-lg font-semibold">
                          {formatCurrency(item.valorTotal)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {item.faturas.map((fatura) => (
                            <TableRow key={fatura.id}>
                              <TableCell>{fatura.tipo}</TableCell>
                              <TableCell>{formatCurrency(fatura.valorTotal)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'conta' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Empenhos Agrupados por Conta Bancária</h3>
              {relatorio.porConta.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum empenho encontrado.
                </div>
              ) : (
                relatorio.porConta.map((item) => (
                  <Card key={item.contaBancaria}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{item.contaBancaria}</CardTitle>
                        <div className="space-y-1 text-right">
                          <div className="text-sm text-gray-600">Saldo Total</div>
                          <div className="text-lg font-semibold text-green-600">
                            {formatCurrency(item.saldoTotal)}
                          </div>
                          <div className="text-sm text-gray-600">Total Empenhado</div>
                          <div className="text-sm font-medium">
                            {formatCurrency(item.valorTotalEmpenhado)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Número</TableHead>
                            <TableHead>Valor Total</TableHead>
                            <TableHead>Saldo Atual</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {item.empenhos.map((empenho) => (
                            <TableRow key={empenho.numero}>
                              <TableCell className="font-medium">{empenho.numero}</TableCell>
                              <TableCell>{formatCurrency(empenho.valorTotal)}</TableCell>
                              <TableCell>{formatCurrency(empenho.saldoAtual)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

