// components/crud/RoutinesCrud.tsx
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from './Modal';
import NotificationToast from '../NotificationToast';
import UserTabs from '../crud/list_rutina/UserTabs';
import { PlusIcon, ArrowLeftIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';

// Definición de tipos de datos
interface User {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_active?: number;
}

interface MuscleGroup {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

interface Exercise {
  id: number;
  name: string;
  variant: string;
  muscle_group_id: number;
  muscle_group_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface Series {
  series: number;
  weight: number;
  reps: number;
  rest_time: string;
  progress: number;
  notes: string;
}

interface RoutineExercise {
  name: string;
  variant: string;
  muscle_group: string;
  series: Series[];
}

interface Routine {
  id: number;
  week_number: number;
  day_name: string;
  is_active: number;
  username: string;
  muscle_groups: MuscleGroup[];
  exercises: RoutineExercise[];
  created_at: string;
  muscle_group_frequency?: { [key: string]: number };
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface GroupedRoutines {
  [userId: string]: {
    user: User;
    weeks: {
      [weekNumber: number]: {
        [dayName: string]: Routine[];
      };
    };
  };
}

interface RoutinesCrudProps {
  showNotification?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onClose: () => void;
}



const RoutinesCrud = ({ showNotification: externalShowNotification, onClose }: RoutinesCrudProps) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRoutine, setCurrentRoutine] = useState<Routine | null>(null);

  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'info',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    if (externalShowNotification) {
      externalShowNotification(message, type);
    } else {
      setNotification({ show: true, message, type });
    }
  };

  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, show: false }));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [routinesRes, usersRes, muscleGroupsRes, exercisesRes] = await Promise.all([
        axios.get('/api/admin/routines'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/muscle-groups'),
        axios.get('/api/admin/exercises'),
      ]);

      // Manejar la respuesta de usuarios que viene con paginación
      const usersData = usersRes.data.users || usersRes.data;
      
      setRoutines(routinesRes.data || []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setMuscleGroups(muscleGroupsRes.data || []);
      setExercises(exercisesRes.data || []);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Error al cargar los datos. Por favor, inténtalo de nuevo.';
      setError(errorMessage);
      setLoading(false);
      showNotification(errorMessage, 'error');
    }
  };

  const handleDelete = async (routineId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta rutina?')) {
      try {
        await axios.delete(`/api/admin/routines/${routineId}`);
        showNotification('Rutina eliminada con éxito.', 'success');
        await fetchData(); // Refrescar datos después de eliminar
      } catch (err) {
        console.error('Error deleting routine:', err);
        const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Error al eliminar la rutina.';
        showNotification(errorMessage, 'error');
      }
    }
  };

  const handleEdit = (routine: Routine) => {
    setCurrentRoutine(routine);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setCurrentRoutine(null); // Para modo creación
    setIsModalOpen(true);
  };

  const handleSubmission = async (data: any) => {
    try {
      if (currentRoutine) {
        // Editar rutina existente (PUT)
        const response = await axios.put(`/api/admin/routines/${currentRoutine.id}`, data);
        showNotification(response.data.message || 'Rutina actualizada con éxito.', 'success');
      } else {
        // Crear nueva rutina (POST)
        const response = await axios.post('/api/admin/routines', data);
        showNotification(response.data.message || 'Rutina creada con éxito.', 'success');
      }
      await fetchData(); // Refrescar datos después de crear/editar
      setIsModalOpen(false);
      setCurrentRoutine(null);
    } catch (err) {
      console.error('Error saving routine:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Error al guardar la rutina.';
      showNotification(errorMessage, 'error');
    }
  };

  // Nueva función para manejar la carga masiva de rutinas
  const handleUploadRoutine = async (uploadData: any) => {
    try {
      const response = await axios.post('/api/admin/routines/upload', uploadData);
      const { message, summary } = response.data;
      
      showNotification(
        message || `Rutinas cargadas: ${summary?.total_routines_created || 0} nuevas, ${summary?.total_routines_replaced || 0} reemplazadas`,
        'success'
      );
      
      await fetchData(); // Refrescar datos después de la carga
      return response.data;
    } catch (err) {
      console.error('Error uploading routine:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Error al cargar la rutina masiva.';
      showNotification(errorMessage, 'error');
      throw err;
    }
  };

  // Nueva función para cambiar el estado activo/inactivo de una rutina
  const handleToggleActive = async (routineId: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const response = await axios.put(`/api/admin/routines/${routineId}`, {
        is_active: newStatus
      });
      
      showNotification(
        response.data.message || `Rutina ${newStatus ? 'activada' : 'desactivada'} con éxito.`,
        'success'
      );
      
      await fetchData(); // Refrescar datos
    } catch (err) {
      console.error('Error toggling routine status:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Error al cambiar el estado de la rutina.';
      showNotification(errorMessage, 'error');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 hover:text-emerald-800 transition-all duration-200 shadow-sm hover:shadow-md group"
            title="Volver al menú principal"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:transform group-hover:-translate-x-0.5 transition-transform duration-200" />
          </button>
          <h1 className="text-3xl font-bold">Gestión de Rutinas</h1>
          <div className="w-12"></div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando rutinas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 hover:text-emerald-800 transition-all duration-200 shadow-sm hover:shadow-md group"
            title="Volver al menú principal"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:transform group-hover:-translate-x-0.5 transition-transform duration-200" />
          </button>
          <h1 className="text-3xl font-bold">Gestión de Rutinas</h1>
          <div className="w-12"></div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Error al cargar los datos</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Agrupar rutinas por usuario
  const groupedRoutines = routines.reduce((acc: GroupedRoutines, routine) => {
    const user = users.find((u) => u.username === routine.username);
    if (!user) return acc;

    if (!acc[user.id]) {
      acc[user.id] = { user, weeks: {} };
    }
    if (!acc[user.id].weeks[routine.week_number]) {
      acc[user.id].weeks[routine.week_number] = {};
    }
    if (!acc[user.id].weeks[routine.week_number][routine.day_name]) {
      acc[user.id].weeks[routine.week_number][routine.day_name] = [];
    }
    acc[user.id].weeks[routine.week_number][routine.day_name].push(routine);
    return acc;
  }, {});

  if (Object.keys(groupedRoutines).length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 hover:text-emerald-800 transition-all duration-200 shadow-sm hover:shadow-md group"
            title="Volver al menú principal"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:transform group-hover:-translate-x-0.5 transition-transform duration-200" />
          </button>
          <h1 className="text-3xl font-bold">Gestión de Rutinas</h1>
          <div className="w-12"></div>
        </div>
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No hay rutinas creadas</h3>
          <p className="text-gray-600 mb-6">Comienza creando la primera rutina para tus usuarios.</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition duration-300 shadow-md hover:shadow-lg"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Crear Primera Rutina
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Notificaciones (solo si no se usa notificación externa) */}
      {!externalShowNotification && notification.show && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}
      
      <div className="container mx-auto p-4">
        {/* Header con botón de regreso */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 hover:text-emerald-800 transition-all duration-200 shadow-sm hover:shadow-md group"
            title="Volver al menú principal"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:transform group-hover:-translate-x-0.5 transition-transform duration-200" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Rutinas</h1>
          <div className="w-12"></div>
        </div>
        
        <div className="flex justify-center mb-6 space-x-4">
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-full hover:bg-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50
"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Agregar Rutina
          </button>
          
          
        </div>

        <UserTabs
          groupedRoutines={groupedRoutines}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAddRoutine={handleCreate}
          onToggleActive={handleToggleActive}
          onUploadRoutine={handleUploadRoutine}
        />
      </div>

      {isModalOpen && (
        <Modal
          routine={currentRoutine}
          onClose={() => {
            setIsModalOpen(false);
            setCurrentRoutine(null);
          }}
          onSubmit={handleSubmission}
          users={users}
          muscleGroups={muscleGroups}
          exercises={exercises}
        />
      )}

      
    </>
  );
};

export default RoutinesCrud;