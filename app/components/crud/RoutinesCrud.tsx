// components/crud/RoutinesCrud.tsx
'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Modal from './Modal';
import NotificationToast from '../NotificationToast';
import UserTabs from '../crud/list_rutina/UserTabs';
import { PlusIcon, XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

// Definición de tipos de datos
interface User {
  id: number;
  username: string;
}

interface MuscleGroup {
  id: number;
  name: string;
}

interface Exercise {
  id: number;
  name: string;
  variant: string;
  muscle_group_id: number;
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
      const [routinesRes, usersRes, muscleGroupsRes, exercisesRes] = await Promise.all([
        axios.get('/api/admin/routines'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/muscle-groups'),
        axios.get('/api/admin/exercises'),
      ]);

      setRoutines(routinesRes.data);
      setUsers(usersRes.data);
      setMuscleGroups(muscleGroupsRes.data);
      setExercises(exercisesRes.data);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar los datos. Por favor, inténtalo de nuevo.');
      setLoading(false);
      console.error(err);
      showNotification('Error al cargar los datos.', 'error');
    }
  };

  const handleDelete = async (routineId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta rutina?')) {
      try {
        await axios.delete(`/api/admin/routines/${routineId}`);
        showNotification('Rutina eliminada con éxito.', 'success');
        fetchData();
      } catch (err) {
        showNotification('Error al eliminar la rutina.', 'error');
        console.error(err);
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
        // Editar (PUT)
        await axios.put(`/api/admin/routines/${data.id}`, data);
        showNotification('Rutina actualizada con éxito.', 'success');
      } else {
        // Crear (POST)
        await axios.post('/api/admin/routines', data);
        showNotification('Rutina creada con éxito.', 'success');
      }
      fetchData();
      setIsModalOpen(false);
    } catch (err) {
      showNotification('Error al guardar la rutina.', 'error');
      console.error(err);
    }
  };

  if (loading) {
    return (
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
          <h1 className="text-3xl font-bold">Gestión de Rutinas</h1>
          <div className="w-12"></div> {/* Spacer para centrar el título */}
        </div>
        <p className="text-center mt-8">Cargando rutinas...</p>
      </div>
    );
  }

  if (error) {
    return (
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
          <h1 className="text-3xl font-bold">Gestión de Rutinas</h1>
          <div className="w-12"></div> {/* Spacer para centrar el título */}
        </div>
        <p className="text-center mt-8 text-red-500">{error}</p>
      </div>
    );
  }

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
        {/* Header con botón de regreso */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 hover:text-emerald-800 transition-all duration-200 shadow-sm hover:shadow-md group"
            title="Volver al menú principal"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:transform group-hover:-translate-x-0.5 transition-transform duration-200" />
          </button>
          <h1 className="text-3xl font-bold">Gestión de Rutinas</h1>
          <div className="w-12"></div> {/* Spacer para centrar el título */}
        </div>
        <div className="text-center">
          <p className="mb-4">No hay usuarios con rutinas creadas.</p>
          <button
            onClick={handleCreate}
            className="flex items-center mx-auto px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition duration-300 shadow-md"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Agregar Rutina
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
            className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-200 hover:bg-emerald-200 text-emerald-700 hover:text-emerald-800 transition-all duration-100 shadow-sm hover:shadow-md group"
            title="Volver al menú principal"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:transform group-hover:-translate-x-0.5 transition-transform duration-200" />
          </button>
          <h1 className="text-3xl font-bold">Gestión de Rutinas</h1>
          <div className="w-12"></div> {/* Spacer para centrar el título */}
        </div>
        
        <div className="flex justify-center mb-4">
          <button
            onClick={handleCreate}
            className="flex items-center px-6 py-2 bg-emerald-600 text-white font-semibold rounded-full hover:bg-emerald-700 transition duration-300 shadow-md"
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
        />
      </div>

      {isModalOpen && (
        <Modal
          routine={currentRoutine}
          onClose={() => setIsModalOpen(false)}
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