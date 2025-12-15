'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import {
  getEmpenhosByUser,
  getEmpenhosAtivos,
  getEmpenhosByConta,
  createEmpenho,
  updateEmpenho,
  deleteEmpenho,
  getEmpenho,
} from '@/lib/services/empenhos';
import { Empenho } from '@/types';

export const useEmpenhos = () => {
  const { user, userData } = useAuth();
  const [empenhos, setEmpenhos] = useState<Empenho[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmpenhos = async () => {
    if (!user || !userData) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Admin vê todos os empenhos, usuário comum apenas os seus
      const data = await getEmpenhosByUser(user.uid);
      setEmpenhos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar empenhos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmpenhos();
  }, [user, userData]);

  const addEmpenho = async (empenho: Omit<Empenho, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      setError(null);
      await createEmpenho({ ...empenho, userId: user.uid });
      await loadEmpenhos();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar empenho';
      setError(message);
      throw err;
    }
  };

  const editEmpenho = async (id: string, updates: Partial<Empenho>) => {
    try {
      setError(null);
      await updateEmpenho(id, updates);
      await loadEmpenhos();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar empenho';
      setError(message);
      throw err;
    }
  };

  const removeEmpenho = async (id: string) => {
    try {
      setError(null);
      await deleteEmpenho(id);
      await loadEmpenhos();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar empenho';
      setError(message);
      throw err;
    }
  };

  const getEmpenhosAtivosList = async () => {
    if (!user) return [];
    return await getEmpenhosAtivos(user.uid);
  };

  const getEmpenhosPorConta = async (contaBancaria: string) => {
    if (!user) return [];
    return await getEmpenhosByConta(user.uid, contaBancaria);
  };

  return {
    empenhos,
    loading,
    error,
    addEmpenho,
    editEmpenho,
    removeEmpenho,
    getEmpenhosAtivosList,
    getEmpenhosPorConta,
    refresh: loadEmpenhos,
  };
};

