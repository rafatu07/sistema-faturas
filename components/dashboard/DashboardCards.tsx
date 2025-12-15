'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEmpenhos } from '@/lib/hooks/useEmpenhos';
import { useFaturas } from '@/lib/hooks/useFaturas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { gerarRelatorioCompleto } from '@/lib/services/relatorios';
import { getFaturasProximasVencimento } from '@/lib/services/faturas';
import { getEmpenhosAtivos } from '@/lib/services/empenhos';
import { Fatura } from '@/types';
import { Calendar, DollarSign, AlertTriangle, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardCards() {
  const { user } = useAuth();
  const { empenhos } = useEmpenhos();
  const { faturas } = useFaturas();
  const [faturasProximas, setFaturasProximas] = useState<Fatura[]>([]);
  const [empenhosProximosZerar, setEmpenhosProximosZerar] = useState<any[]>([]);
  const [saldoPorConta, setSaldoPorConta] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user, empenhos, faturas]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const [faturasProx, empenhosAtivos, relatorio] = await Promise.all([
        getFaturasProximasVencimento(user.uid, 30),
        getEmpenhosAtivos(user.uid),
        gerarRelatorioCompleto(user.uid),
      ]);

      setFaturasProximas(faturasProx);

      // Empenhos próximos de zerar (saldo < 10% do valor total)
      const proximosZerar = empenhosAtivos.filter(
        (e) => e.saldoAtual / e.valorTotal < 0.1 && e.saldoAtual > 0
      );
      setEmpenhosProximosZerar(proximosZerar);

      // Saldo por conta bancária
      const saldoPorContaMap: Record<string, number> = {};
      empenhosAtivos.forEach((e) => {
        saldoPorContaMap[e.contaBancaria] =
          (saldoPorContaMap[e.contaBancaria] || 0) + e.saldoAtual;
      });
      setSaldoPorConta(saldoPorContaMap);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const totalFaturasProximas = faturasProximas.reduce((sum, f) => sum + f.valorTotal, 0);
  const totalSaldo = Object.values(saldoPorConta).reduce((sum, saldo) => sum + saldo, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturas a Vencer (30 dias)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{faturasProximas.length}</div>
            <p className="text-xs text-muted-foreground">
              Total: {formatCurrency(totalFaturasProximas)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total Disponível</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSaldo)}</div>
            <p className="text-xs text-muted-foreground">
              {Object.keys(saldoPorConta).length} conta(s) bancária(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empenhos Próximos de Zerar</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{empenhosProximosZerar.length}</div>
            <p className="text-xs text-muted-foreground">Saldo menor que 10%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Faturas</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{faturas.length}</div>
            <p className="text-xs text-muted-foreground">Cadastradas no sistema</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Faturas a Vencer</CardTitle>
              <Link href="/faturas">
                <Button variant="outline" size="sm">
                  Ver todas
                </Button>
              </Link>
            </div>
            <CardDescription>Próximos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {faturasProximas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma fatura a vencer nos próximos 30 dias.
              </div>
            ) : (
              <div className="space-y-2">
                {faturasProximas.slice(0, 5).map((fatura) => (
                  <div
                    key={fatura.id}
                    className="flex justify-between items-center p-2 border rounded"
                  >
                    <div>
                      <div className="font-medium">{fatura.tipo}</div>
                      <div className="text-sm text-gray-500">
                        Vencimento: {formatDate(fatura.vencimento)}
                      </div>
                    </div>
                    <div className="font-semibold">{formatCurrency(fatura.valorTotal)}</div>
                  </div>
                ))}
                {faturasProximas.length > 5 && (
                  <div className="text-center text-sm text-gray-500 pt-2">
                    +{faturasProximas.length - 5} mais
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Saldo por Conta Bancária</CardTitle>
              <Link href="/empenhos">
                <Button variant="outline" size="sm">
                  Ver todas
                </Button>
              </Link>
            </div>
            <CardDescription>Saldo disponível por conta</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(saldoPorConta).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum empenho cadastrado.
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(saldoPorConta)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([conta, saldo]) => (
                    <div
                      key={conta}
                      className="flex justify-between items-center p-2 border rounded"
                    >
                      <div className="font-medium">{conta}</div>
                      <div className="font-semibold text-green-600">
                        {formatCurrency(saldo)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {empenhosProximosZerar.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Empenhos Próximos de Zerar</CardTitle>
              <CardDescription>Empenhos com saldo menor que 10% do valor total</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {empenhosProximosZerar.map((empenho) => (
                  <div
                    key={empenho.id}
                    className="flex justify-between items-center p-2 border rounded bg-yellow-50"
                  >
                    <div>
                      <div className="font-medium">{empenho.numero}</div>
                      <div className="text-sm text-gray-500">{empenho.contaBancaria}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-red-600">
                        {formatCurrency(empenho.saldoAtual)}
                      </div>
                      <div className="text-sm text-gray-500">
                        de {formatCurrency(empenho.valorTotal)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

