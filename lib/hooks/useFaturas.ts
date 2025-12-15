'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import {
  getFaturasByUser,
  getFaturasByTipo,
  getFaturasProximasVencimento,
  createFatura,
  updateFatura,
  deleteFatura,
  getFatura,
} from '@/lib/services/faturas';
import { Fatura } from '@/types';

export const useFaturas = () => {
  const { user, userData } = useAuth();
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFaturas = async () => {
    if (!user || !userData) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await getFaturasByUser(user.uid);
      setFaturas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar faturas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaturas();
  }, [user, userData]);

  const addFatura = async (fatura: Omit<Fatura, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Usuário não autenticado');
    
    try {
      setError(null);
      await createFatura({ ...fatura, userId: user.uid });
      await loadFaturas();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar fatura';
      setError(message);
      throw err;
    }
  };

  const editFatura = async (id: string, updates: Partial<Fatura>) => {
    try {
      setError(null);
      await updateFatura(id, updates);
      await loadFaturas();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar fatura';
      setError(message);
      throw err;
    }
  };

  const removeFatura = async (id: string) => {
    try {
      setError(null);
      await deleteFatura(id);
      await loadFaturas();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar fatura';
      setError(message);
      throw err;
    }
  };

  const getFaturasPorTipo = async (tipo: Fatura['tipo']) => {
    if (!user) return [];
    return await getFaturasByTipo(user.uid, tipo);
  };

  const getFaturasProximas = async (dias: number = 30) => {
    if (!user) return [];
    return await getFaturasProximasVencimento(user.uid, dias);
  };

  return {
    faturas,
    loading,
    error,
    addFatura,
    editFatura,
    removeFatura,
    getFaturasPorTipo,
    getFaturasProximas,
    refresh: loadFaturas,
  };
};

