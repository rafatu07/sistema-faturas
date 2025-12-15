'use client';

import { useState } from 'react';
import { useFaturas } from '@/lib/hooks/useFaturas';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fatura, FaturaTipo } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { Plus, Edit, Trash2, Link as LinkIcon } from 'lucide-react';
import FaturaUpload from './FaturaUpload';
import FaturaForm from './FaturaForm';
import { ExtractedData } from '@/lib/ocr/extractors';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';

export default function FaturaList() {
  const { faturas, loading, error, addFatura, editFatura, removeFatura } = useFaturas();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFatura, setEditingFatura] = useState<Fatura | null>(null);
  const [deletingFatura, setDeletingFatura] = useState<Fatura | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined);

  const handleExtract = (data: ExtractedData, url: string) => {
    setExtractedData(data);
    setFileUrl(url);
    setUploadOpen(false);
    setFormOpen(true);
  };

  const handleEdit = (fatura: Fatura) => {
    setEditingFatura(fatura);
    setExtractedData(null);
    setFileUrl(undefined);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletingFatura) {
      await removeFatura(deletingFatura.id);
      setDeletingFatura(null);
    }
  };

  const handleFormSubmit = async (fatura: Omit<Fatura, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingFatura) {
      await editFatura(editingFatura.id, fatura);
      setEditingFatura(null);
    } else {
      await addFatura(fatura);
    }
    setFormOpen(false);
    setExtractedData(null);
    setFileUrl(undefined);
  };

  const getTipoLabel = (tipo: FaturaTipo) => {
    const labels = {
      EDP: 'EDP',
      SABESP: 'SABESP',
      TELEFONIA: 'Telefonia',
    };
    return labels[tipo];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando faturas...</p>
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
              <CardTitle>Faturas</CardTitle>
              <CardDescription>Gerencie as faturas de energia, água e telefonia</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setUploadOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Upload com OCR
              </Button>
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Fatura
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
          )}

          {faturas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma fatura cadastrada ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faturas.map((fatura) => (
                  <TableRow key={fatura.id}>
                    <TableCell className="font-medium">{getTipoLabel(fatura.tipo)}</TableCell>
                    <TableCell>{formatDate(fatura.vencimento)}</TableCell>
                    <TableCell>{formatCurrency(fatura.valorTotal)}</TableCell>
                    <TableCell>
                      {fatura.arquivoUrl ? (
                        <a
                          href={fatura.arquivoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Ver arquivo
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Link href={`/faturas/${fatura.id}`}>
                          <Button variant="ghost" size="sm">
                            <LinkIcon className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(fatura)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingFatura(fatura)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {uploadOpen && (
        <FaturaUpload
          onExtract={handleExtract}
        />
      )}

      <FaturaForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingFatura(null);
          setExtractedData(null);
          setFileUrl(undefined);
        }}
        onSubmit={handleFormSubmit}
        fatura={editingFatura}
        extractedData={extractedData}
        fileUrl={fileUrl}
      />

      <AlertDialog open={!!deletingFatura} onOpenChange={() => setDeletingFatura(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta fatura? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

