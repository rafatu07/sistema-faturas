'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getFatura } from '@/lib/services/faturas';
import { Fatura } from '@/types';
import VinculacaoEmpenhos from '@/components/faturas/VinculacaoEmpenhos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function FaturaDetailPage() {
  const params = useParams();
  const [fatura, setFatura] = useState<Fatura | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFatura = async () => {
      try {
        const data = await getFatura(params.id as string);
        setFatura(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar fatura');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadFatura();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando fatura...</p>
        </div>
      </div>
    );
  }

  if (error || !fatura) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">{error || 'Fatura não encontrada'}</p>
          <Link href="/faturas">
            <Button variant="outline" className="mt-4">
              Voltar para Faturas
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getTipoLabel = (tipo: Fatura['tipo']) => {
    const labels = {
      EDP: 'EDP (Energia Elétrica)',
      SABESP: 'SABESP (Água)',
      TELEFONIA: 'Telefonia',
    };
    return labels[tipo];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/faturas">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Detalhes da Fatura</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Fatura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Tipo</div>
              <div className="font-semibold">{getTipoLabel(fatura.tipo)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Data de Vencimento</div>
              <div className="font-semibold">{formatDate(fatura.vencimento)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Valor Total</div>
              <div className="font-semibold text-lg">{formatCurrency(fatura.valorTotal)}</div>
            </div>
            {fatura.arquivoUrl && (
              <div>
                <div className="text-sm text-gray-600">Arquivo</div>
                <a
                  href={fatura.arquivoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Ver arquivo
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <VinculacaoEmpenhos fatura={fatura} />
    </div>
  );
}

