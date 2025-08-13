// hooks/useRoutines.ts
import { useState, useEffect } from 'react';
import { User, Week } from '../types';

interface UseRoutinesReturn {
  users: User[];
  weeks: Week[];
  isLoading: boolean;
  error: string | null;
  canEdit: boolean;
  isModerator: boolean;
  currentUserId: string | null;
  fetchRoutines: (userId?: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export function useRoutines(): UseRoutinesReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Función para obtener usuarios
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/user');
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }
      
      const data = await response.json();
      setUsers(data.users);
      setIsModerator(data.currentUser.isModerator);
      setCurrentUserId(data.currentUser.id.toString());
      
      return data;
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return null;
    }
  };

  // Función para obtener rutinas
  const fetchRoutines = async (userId?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (userId) {
        params.append('userId', userId);
      }

      const response = await fetch(`/api/routines?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Error al cargar rutinas');
      }

      const data = await response.json();
      setWeeks(data.weeks || []);
      setCanEdit(data.canEdit || false);

    } catch (err) {
      console.error('Error fetching routines:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar rutinas');
      setWeeks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para refrescar todos los datos
  const refreshData = async () => {
    const userData = await fetchUsers();
    if (userData && userData.users.length > 0) {
      // Si es moderador, cargar rutinas del primer usuario
      // Si no es moderador, cargar sus propias rutinas
      const targetUserId = userData.currentUser.isModerator 
        ? userData.users[0].id 
        : userData.currentUser.id.toString();
      
      await fetchRoutines(targetUserId);
    }
  };

  // Efecto inicial
  useEffect(() => {
    refreshData();
  }, []);

  return {
    users,
    weeks,
    isLoading,
    error,
    canEdit,
    isModerator,
    currentUserId,
    fetchRoutines,
    refreshData
  };
}