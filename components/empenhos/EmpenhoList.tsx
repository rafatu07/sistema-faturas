'use client';

import { useState } from 'react';
import { useEmpenhos } from '@/lib/hooks/useEmpenhos';
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
import { Empenho } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils/formatters';
import { Plus, Edit, Trash2 } from 'lucide-react';
import EmpenhoForm from './EmpenhoForm';
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

export default function EmpenhoList() {
  const { empenhos, loading, error, addEmpenho, editEmpenho, removeEmpenho } = useEmpenhos();
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmpenho, setEditingEmpenho] = useState<Empenho | null>(null);
  const [deletingEmpenho, setDeletingEmpenho] = useState<Empenho | null>(null);

  const handleEdit = (empenho: Empenho) => {
    setEditingEmpenho(empenho);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletingEmpenho) {
      await removeEmpenho(deletingEmpenho.id);
      setDeletingEmpenho(null);
    }
  };

  const handleFormSubmit = async (
    empenho: Omit<Empenho, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ) => {
    if (editingEmpenho) {
      await editEmpenho(editingEmpenho.id, empenho);
      setEditingEmpenho(null);
    } else {
      await addEmpenho(empenho);
    }
    setFormOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando empenhos...</p>
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
              <CardTitle>Empenhos</CardTitle>
              <CardDescription>Gerencie os empenhos orçamentários</CardDescription>
            </div>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Empenho
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
          )}
          
          {empenhos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum empenho cadastrado ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Dotacao</TableHead>
                  <TableHead>Conta Bancária</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Saldo Atual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empenhos.map((empenho) => (
                  <TableRow key={empenho.id}>
                    <TableCell className="font-medium">{empenho.numero}</TableCell>
                    <TableCell>{empenho.dotacao}</TableCell>
                    <TableCell>{empenho.contaBancaria}</TableCell>
                    <TableCell>{formatCurrency(empenho.valorTotal)}</TableCell>
                    <TableCell>{formatCurrency(empenho.saldoAtual)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          empenho.status === 'ativo'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {empenho.status === 'ativo' ? 'Ativo' : 'Esgotado'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(empenho)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingEmpenho(empenho)}
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

      <EmpenhoForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingEmpenho(null);
        }}
        onSubmit={handleFormSubmit}
        empenho={editingEmpenho}
      />

      <AlertDialog open={!!deletingEmpenho} onOpenChange={() => setDeletingEmpenho(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o empenho {deletingEmpenho?.numero}? Esta ação não
              pode ser desfeita.
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

